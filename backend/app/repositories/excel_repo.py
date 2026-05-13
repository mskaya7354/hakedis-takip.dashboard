"""
ExcelRepository — Excel'i okur, mtime cache ile belleğe alır.
SMB/network share gecikmelerine karşı retry + stale fallback içerir.

Excel kolon adı → Pydantic field adı mapping bu dosyada.
"""
from __future__ import annotations

import logging
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import pandas as pd

from app.models.schemas import HakedisRaw, Project, Zeyilname

logger = logging.getLogger(__name__)

# ── Excel kolon adı → Python field adı ──────────────────────────────────────
# Bu dict'ler Excel'deki gerçek başlıklarla birebir eşleşmelidir.

_PROJELER_RENAME: dict[str, str] = {
    "Proje Adı":              "name",
    "Avans Oranı":            "avansOrani",
    "Nakit Teminat Oranı":    "nakitTeminatOrani",
    "KDV Oranı":              "kdvOrani",
    "Tevkifat Oranı":         "tevkifatOrani",
    "Stopaj Oranı":           "stopajOrani",
    "İlk Sözleşme Bedeli":    "ilkSozlesmeBedeli",
    "Zeyilnameler Toplamı":   "zeyilnamelerToplami",
    "Güncel Sözleşme":        "guncelSozlesmeBedeli",
    "Durum":                  "durum",
    # Opsiyonel — Excel'e sonradan eklenebilir
    "Müşteri":                "musteri",
    "Proje Kodu":             "kod",
}

_ZEYILNAMELER_RENAME: dict[str, str] = {
    "Proje Adı":                    "projectName",
    "Zeyilname No / Konusu":        "zeyilnameNo",
    "Düzenlenme Tarihi":            "tarih",
    "Zeyilname Tutarı (+ / -)":     "tutar",
    "Açıklama":                     "aciklama",
}

_VERI_GIRISI_RENAME: dict[str, str] = {
    "Proje Adı":                    "projectName",
    "Hakediş No":                   "hakedisNo",
    "Dönem":                        "donem",
    "Düzenleme Tarihi":             "tarih",
    "Matrah (Brüt İş Tutarı)":      "matrah",
    "Diğer Kesintiler (Manuel)":    "digerKesintiler",
    "Tahsil Edilen Tutar":          "tahsilEdilen",
    "Notlar":                       "notlar",
}


@dataclass
class RepoHealth:
    last_load_at: Optional[float] = None       # monotonic timestamp
    last_error: Optional[str] = None
    consecutive_failures: int = 0
    total_loads: int = 0
    total_stale_serves: int = 0
    source_path: str = ""


class ExcelUnavailableError(RuntimeError):
    """Önbelleksiz halde Excel'e ulaşılamadığında fırlatılır → 503."""


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

        self.health = RepoHealth(source_path=str(excel_path))

    # ── Public ───────────────────────────────────────────────────────────────

    def get_projects(self) -> list[Project]:
        self._ensure_fresh()
        return self._projects

    def get_hakedisler(self) -> list[HakedisRaw]:
        self._ensure_fresh()
        return self._hakedisler

    def get_zeyilnameler(self) -> list[Zeyilname]:
        self._ensure_fresh()
        return self._zeyilnameler

    def invalidate(self) -> None:
        """Cache'i sıfırla — sonraki istekte Excel'i yeniden yükler."""
        with self._lock:
            self._mtime = 0.0
            self._last_check_at = 0.0

    # ── Internals ─────────────────────────────────────────────────────────────

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
                    "Excel yüklendi: %d proje, %d hakediş, %d zeyilname",
                    len(self._projects), len(self._hakedisler), len(self._zeyilnameler),
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
            logger.warning(
                "Eski önbellek servis ediliyor (yaş=%.1fs, hata sayısı=%d): %s",
                self._cache_age(), self.health.consecutive_failures, exc,
            )
            return

        raise ExcelUnavailableError(
            f"Excel'e erişilemiyor ({phase}): {exc}. "
            f"Önbellek {'yok' if not self._has_cache() else f'çok eski ({self._cache_age():.0f}s)'}."
        )

    def _load(self) -> None:
        """Tek deneme — exception fırlatırsa _load_with_retry yakalar."""
        if not self.path.exists():
            raise FileNotFoundError(f"Dosya bulunamadı: {self.path}")

        xls = pd.ExcelFile(self.path, engine="openpyxl")

        # ── Projeler ──────────────────────────────────────────────────────────
        df_p = pd.read_excel(xls, sheet_name="Projeler")
        df_p = df_p.rename(columns=_PROJELER_RENAME)
        df_p = df_p.fillna({
            "musteri": "",
            "kod": "",
            "zeyilnamelerToplami": 0,
        })
        df_p["id"] = range(1, len(df_p) + 1)    # id yok → satır numarası
        # Boş dizeyi None'a çevir (opsiyonel alanlar için)
        for col in ("musteri", "kod"):
            if col in df_p.columns:
                df_p[col] = df_p[col].replace("", None)
        self._projects = [Project(**row) for row in df_p.to_dict(orient="records")]

        # ── Veri_Girisi (Hakedişler) ──────────────────────────────────────────
        df_h = pd.read_excel(xls, sheet_name="Veri_Girisi")
        df_h = df_h.rename(columns=_VERI_GIRISI_RENAME)
        df_h = df_h.fillna({"digerKesintiler": 0, "tahsilEdilen": 0, "notlar": ""})
        df_h["id"] = range(1, len(df_h) + 1)
        # Dönem sütununu string'e çevir (Excel bazen datetime okuyabilir)
        if "donem" in df_h.columns:
            df_h["donem"] = df_h["donem"].astype(str).str.strip()
        if "tarih" in df_h.columns:
            df_h["tarih"] = df_h["tarih"].astype(str).str.strip()
        self._hakedisler = [HakedisRaw(**row) for row in df_h.to_dict(orient="records")]

        # ── Zeyilnameler ──────────────────────────────────────────────────────
        df_z = pd.read_excel(xls, sheet_name="Zeyilnameler")
        df_z = df_z.rename(columns=_ZEYILNAMELER_RENAME)
        df_z = df_z.fillna({"aciklama": ""})
        df_z["id"] = range(1, len(df_z) + 1)
        if "tarih" in df_z.columns:
            df_z["tarih"] = df_z["tarih"].astype(str).str.strip()
        self._zeyilnameler = [Zeyilname(**row) for row in df_z.to_dict(orient="records")]
