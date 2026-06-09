"""
ExcelRepository — Hakedis_Takip.xlsm (birleşik Borç/Alacak defteri) okur.
mtime cache + retry + stale fallback içerir.

Veri modeli:
  Projeler            → Project (snake_case kolonlar, USD/EUR/TRY)
  Hareketler          → Hesap_Tipi'ne göre:
                          "Sözleşme" → Zeyilname
                          "Ana Cari" + Hakedis_No → Hakediş kalemleri (pivot)
                          "Avans"   → (şimdilik portföy dışı)
  Maliyetler          → MaliyetRaw
  SGK Bildirimleri    → SGKRaw
  Kur_Gecmisi         → güncel kur (sözleşme bedelini TL'ye çevirmek için)

Tüm tutarlar TL bazlı: Hareketler'de Borc_TL/Alacak_TL kullanılır.
Proje sözleşme bedeli (orijinal döviz) güncel kurla TL'ye çevrilir.
"""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pandas as pd

from app.models.schemas import (
    HakedisRaw,
    MaliyetRaw,
    Project,
    SGKRaw,
    Zeyilname,
)

logger = logging.getLogger(__name__)

# Türkçe ay adları (dönem türetme)
_TR_AYLAR = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
]

# Kalem adları (Hareketler[Kalem]) → pivot alanı
_KALEM_BEDEL = "BEDELİ"
_KALEM_STOPAJ = "STOPAJ"
_KALEM_AVANS_KES = "AVANS KESİNTİSİ"
_KALEM_TEMINAT_KES = "TEMİNAT KESİNTİSİ"
_KALEM_DIGER_KES = "DİĞER KESİNTİ"
_KALEM_DIGER_IADE = "DİĞER KESİNTİ İADESİ"
_KALEM_TAHSILAT = "TAHSİLATI"

_HESAP_ANA = "Ana Cari"
_HESAP_SOZLESME = "Sözleşme"


@dataclass
class RepoHealth:
    last_load_at: Optional[float] = None
    last_error: Optional[str] = None
    consecutive_failures: int = 0
    total_loads: int = 0
    total_stale_serves: int = 0
    source_path: str = ""


class ExcelUnavailableError(RuntimeError):
    """Önbelleksiz halde Excel'e ulaşılamadığında → 503."""


def _f(v, default: float = 0.0) -> float:
    """Güvenli float."""
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return default
        return float(v)
    except (ValueError, TypeError):
        return default


def _s(v, default: str = "") -> str:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return default
    return str(v).strip()


def _donem_from_date(ts) -> str:
    """Timestamp → 'YYYY-AyAdı'."""
    if ts is None or pd.isna(ts):
        return ""
    try:
        return f"{ts.year}-{_TR_AYLAR[ts.month - 1]}"
    except (AttributeError, IndexError):
        return ""


def _date_str(ts) -> str:
    if ts is None or pd.isna(ts):
        return ""
    try:
        return ts.strftime("%d.%m.%Y")
    except (AttributeError, ValueError):
        return str(ts).split()[0]


class ExcelRepository:
    def __init__(
        self,
        excel_path: Path,
        cache_ttl_sec: float = 5.0,
        max_retries: int = 3,
        retry_backoff: float = 1.0,
        stale_tolerance_sec: int = 300,
    ):
        self.path = excel_path
        self.cache_ttl = cache_ttl_sec
        self.max_retries = max_retries
        self.retry_backoff = retry_backoff
        self.stale_tolerance = stale_tolerance_sec

        self._lock = threading.RLock()
        self._mtime: float = 0.0
        self._last_check_at: float = 0.0

        self._projects: list[Project] = []
        self._hakedisler: list[HakedisRaw] = []
        self._zeyilnameler: list[Zeyilname] = []
        self._maliyetler: list[MaliyetRaw] = []
        self._sgk: list[SGKRaw] = []

        self.health = RepoHealth(source_path=str(excel_path))

    # ── Public ────────────────────────────────────────────────────────────────

    def get_projects(self) -> list[Project]:
        self._ensure_fresh()
        return self._projects

    def get_hakedisler(self) -> list[HakedisRaw]:
        self._ensure_fresh()
        return self._hakedisler

    def get_zeyilnameler(self) -> list[Zeyilname]:
        self._ensure_fresh()
        return self._zeyilnameler

    def get_maliyetler(self) -> list[MaliyetRaw]:
        self._ensure_fresh()
        return self._maliyetler

    def get_sgk(self) -> list[SGKRaw]:
        self._ensure_fresh()
        return self._sgk

    def invalidate(self) -> None:
        with self._lock:
            self._mtime = 0.0
            self._last_check_at = 0.0

    # ── Cache internals ──────────────────────────────────────────────────────

    def _has_cache(self) -> bool:
        return self.health.last_load_at is not None

    def _cache_age(self) -> float:
        if not self._has_cache():
            return float("inf")
        return time.monotonic() - self.health.last_load_at  # type: ignore[operator]

    def _ensure_fresh(self) -> None:
        now = time.monotonic()
        with self._lock:
            if now - self._last_check_at < self.cache_ttl and self._has_cache():
                return
            self._last_check_at = now
            try:
                current_mtime = self.path.stat().st_mtime
            except (FileNotFoundError, PermissionError, OSError) as e:
                self._on_io_error(e, "stat")
                return
            if current_mtime == self._mtime and self._has_cache():
                return
            self._load_with_retry(current_mtime)

    def _load_with_retry(self, target_mtime: float) -> None:
        last_exc: Optional[Exception] = None
        for attempt in range(1, self.max_retries + 1):
            try:
                self._load()
                self._mtime = target_mtime
                self.health.last_load_at = time.monotonic()
                self.health.last_error = None
                self.health.consecutive_failures = 0
                self.health.total_loads += 1
                logger.info(
                    "Excel yüklendi: %d proje, %d hakediş, %d zeyilname, %d maliyet, %d SGK",
                    len(self._projects), len(self._hakedisler), len(self._zeyilnameler),
                    len(self._maliyetler), len(self._sgk),
                )
                return
            except (FileNotFoundError, PermissionError, OSError) as e:
                last_exc = e
                logger.warning("Excel yüklenemedi (deneme %d/%d): %s", attempt, self.max_retries, e)
                if attempt < self.max_retries:
                    time.sleep(self.retry_backoff * attempt)
            except Exception as e:
                logger.exception("Excel parse hatası (retry yok): %s", e)
                last_exc = e
                break
        self._on_io_error(last_exc or RuntimeError("bilinmeyen hata"), "load")

    def _on_io_error(self, exc: Exception, phase: str) -> None:
        self.health.consecutive_failures += 1
        self.health.last_error = f"[{phase}] {type(exc).__name__}: {exc}"
        if self._has_cache() and self._cache_age() <= self.stale_tolerance:
            self.health.total_stale_serves += 1
            logger.warning("Eski önbellek servis ediliyor (yaş=%.1fs): %s", self._cache_age(), exc)
            return
        raise ExcelUnavailableError(
            f"Excel'e erişilemiyor ({phase}): {exc}. "
            f"Önbellek {'yok' if not self._has_cache() else f'çok eski ({self._cache_age():.0f}s)'}."
        )

    # ── Parse ─────────────────────────────────────────────────────────────────

    def _load(self) -> None:
        if not self.path.exists():
            raise FileNotFoundError(f"Dosya bulunamadı: {self.path}")

        xls = pd.ExcelFile(self.path, engine="openpyxl")

        # Kur_Gecmisi: en güncel kur (sözleşme TL çevrimi için)
        guncel_eur, guncel_usd = self._read_guncel_kur(xls)

        # Hareketler — sadece tablo kolonları (Z dropdown kaynağını dışla)
        hareket_cols = [
            "Proje_Kodu", "Hesap_Tipi", "Hakedis_No", "Kalem",
            "Tarih", "Kur", "Borc", "Alacak", "Borc_TL", "Alacak_TL",
        ]
        df_h = pd.read_excel(xls, sheet_name="Hareketler")
        df_h = df_h[[c for c in hareket_cols if c in df_h.columns]].copy()
        df_h = df_h[df_h["Proje_Kodu"].notna()]

        # Zeyilnameler (Hesap_Tipi = Sözleşme)
        self._zeyilnameler = self._parse_zeyilnameler(df_h)

        # Hakedişler (Hesap_Tipi = Ana Cari, Hakedis_No dolu → pivot)
        self._hakedisler = self._parse_hakedisler(df_h)

        # Maliyetler
        self._maliyetler = self._parse_maliyetler(xls)

        # SGK
        self._sgk = self._parse_sgk(xls)

        # Projeler (kur ile TL çevrimi + zeyilname toplamı)
        self._projects = self._parse_projeler(xls, guncel_eur, guncel_usd)

    def _read_guncel_kur(self, xls) -> tuple[float, float]:
        """Kur_Gecmisi'nin en güncel (son tarihli) EUR/USD kuru."""
        try:
            df = pd.read_excel(xls, sheet_name="Kur_Gecmisi")
            df = df[df["Tarih"].notna()]
            if df.empty:
                return 1.0, 1.0
            df = df.sort_values("Tarih")
            last = df.iloc[-1]
            return _f(last.get("EUR"), 1.0), _f(last.get("USD"), 1.0)
        except Exception:
            return 1.0, 1.0

    def _parse_zeyilnameler(self, df_h: pd.DataFrame) -> list[Zeyilname]:
        df_z = df_h[df_h["Hesap_Tipi"] == _HESAP_SOZLESME].copy()
        out: list[Zeyilname] = []
        for i, (_, row) in enumerate(df_z.iterrows(), start=1):
            tutar_tl = _f(row.get("Borc_TL")) or _f(row.get("Borc")) * _f(row.get("Kur"), 1.0)
            out.append(Zeyilname(
                id=i,
                projectName=_s(row.get("Proje_Kodu")),
                zeyilnameNo=_s(row.get("Kalem")) or f"Zeyil {i}",
                tarih=_date_str(row.get("Tarih")),
                tutar=tutar_tl,
                aciklama=_s(row.get("Kalem")),
            ))
        return out

    def _parse_hakedisler(self, df_h: pd.DataFrame) -> list[HakedisRaw]:
        df = df_h[
            (df_h["Hesap_Tipi"] == _HESAP_ANA) & (df_h["Hakedis_No"].notna())
        ].copy()
        if df.empty:
            return []

        out: list[HakedisRaw] = []
        hid = 0
        # (proje, hakediş no) grupla
        for (proje, hakno), grp in df.groupby(["Proje_Kodu", "Hakedis_No"], sort=True):
            hid += 1

            def kalem_borc(kalem: str) -> float:
                return _f(grp[grp["Kalem"] == kalem]["Borc_TL"].sum())

            def kalem_alacak(kalem: str) -> float:
                return _f(grp[grp["Kalem"] == kalem]["Alacak_TL"].sum())

            matrah = kalem_borc(_KALEM_BEDEL)
            stopaj = kalem_alacak(_KALEM_STOPAJ)
            avans_kes = kalem_alacak(_KALEM_AVANS_KES)
            teminat_kes = kalem_alacak(_KALEM_TEMINAT_KES)
            diger = kalem_alacak(_KALEM_DIGER_KES) - kalem_borc(_KALEM_DIGER_IADE)
            tahsil = kalem_alacak(_KALEM_TAHSILAT)

            # tarih: BEDELİ satırı, yoksa grubun ilk tarihi
            bedel_rows = grp[grp["Kalem"] == _KALEM_BEDEL]
            tarih_ts = (bedel_rows["Tarih"].iloc[0] if not bedel_rows.empty
                        else grp["Tarih"].dropna().min() if grp["Tarih"].notna().any()
                        else None)

            out.append(HakedisRaw(
                id=hid,
                projectName=_s(proje),
                hakedisNo=int(hakno),
                donem=_donem_from_date(tarih_ts),
                tarih=_date_str(tarih_ts),
                matrah=matrah,
                stopaj=stopaj,
                avansKesinti=avans_kes,
                nakitTeminat=teminat_kes,
                digerKesintiler=diger,
                tahsilEdilen=tahsil,
                notlar="",
            ))
        return out

    def _parse_maliyetler(self, xls) -> list[MaliyetRaw]:
        try:
            df = pd.read_excel(xls, sheet_name="Maliyetler")
        except Exception:
            return []
        cols = ["Proje_Kodu", "Donem", "Kategori", "Aciklama", "Tutar"]
        df = df[[c for c in cols if c in df.columns]].copy()
        df = df[df["Proje_Kodu"].notna()]
        out: list[MaliyetRaw] = []
        for _, row in df.iterrows():
            out.append(MaliyetRaw(
                projectName=_s(row.get("Proje_Kodu")),
                donem=_s(row.get("Donem")),
                kategori=_s(row.get("Kategori")) or "Diğer",
                aciklama=_s(row.get("Aciklama")),
                tutar=_f(row.get("Tutar")),
            ))
        return out

    def _parse_sgk(self, xls) -> list[SGKRaw]:
        try:
            df = pd.read_excel(xls, sheet_name="SGK Bildirimleri")
        except Exception:
            return []
        cols = ["Proje_Kodu", "Donem", "Calisan_Sayisi", "Gun", "Prime_Esas_Tutar"]
        df = df[[c for c in cols if c in df.columns]].copy()
        df = df[df["Proje_Kodu"].notna()]
        out: list[SGKRaw] = []
        for _, row in df.iterrows():
            out.append(SGKRaw(
                projectName=_s(row.get("Proje_Kodu")),
                donem=_s(row.get("Donem")),
                calisanSayisi=int(_f(row.get("Calisan_Sayisi"))),
                gun=int(_f(row.get("Gun"))),
                primeEsas=_f(row.get("Prime_Esas_Tutar")),
            ))
        return out

    def _parse_projeler(self, xls, guncel_eur: float, guncel_usd: float) -> list[Project]:
        df = pd.read_excel(xls, sheet_name="Projeler")
        df = df[df["Proje_Kodu"].notna()]

        # zeyilname TL toplamları (parse edilmiş zeyilnamelerden)
        z_sums: dict[str, float] = {}
        for z in self._zeyilnameler:
            z_sums[z.projectName] = z_sums.get(z.projectName, 0.0) + z.tutar

        out: list[Project] = []
        for idx, (_, row) in enumerate(df.iterrows(), start=1):
            kod = _s(row.get("Proje_Kodu"))
            para = _s(row.get("Para_Birimi"), "TRY").upper() or "TRY"
            kur = 1.0 if para == "TRY" else (guncel_eur if para == "EUR" else guncel_usd)

            ilk_orj = _f(row.get("Ilk_Sozlesme_Bedeli"))
            ilk_tl = ilk_orj * kur
            z_tl = z_sums.get(kod, 0.0)
            guncel_tl = ilk_tl + z_tl

            out.append(Project(
                id=idx,
                name=_s(row.get("Proje_Adi")) or kod,
                kod=kod,
                musteri=None,
                paraBirimi=para,
                guncelKur=kur,
                avansOrani=_f(row.get("Avans_Orani")),
                nakitTeminatOrani=_f(row.get("Teminat_Orani")),
                kdvOrani=_f(row.get("KDV_Orani"), 0.20),
                tevkifatOrani=_f(row.get("Tevkifat_Orani")),
                stopajOrani=_f(row.get("Stopaj_Orani")),
                damgaVergisiOrani=_f(row.get("Damga_Vergisi_Orani")),
                asgariIscilikOrani=_f(row.get("Asgari_Iscilik_Orani")),
                ilkSozlesmeBedeli=ilk_tl,
                zeyilnamelerToplami=z_tl,
                guncelSozlesmeBedeli=guncel_tl,
                durum="Devam",
            ))
        return out
