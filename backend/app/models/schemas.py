"""
Pydantic models — Hakedis_Takip.xlsm (birleşik Borç/Alacak defteri) için.

Veri akışı:
  Excel "Hareketler" (Borç/Alacak, Kalem bazlı)
    → repo: Hesap_Tipi'ne göre ayır (Ana Cari=hakediş, Sözleşme=zeyilname, Avans=avans)
    → Hakediş = Proje_Kodu + Hakedis_No grubu, Kalem'leri TL pivotla
  Tüm tutarlar TL bazlıdır (Excel Borc_TL/Alacak_TL kullanılır).
  Proje sözleşme bedeli orijinal döviz → güncel kurla TL'ye çevrilir.
"""
from typing import Literal, Optional
from pydantic import BaseModel


# ── Ham veri modeller ─────────────────────────────────────────────────────────

class Project(BaseModel):
    id: int
    name: str
    kod: Optional[str] = None
    musteri: Optional[str] = None
    paraBirimi: str = "TRY"            # USD / EUR / TRY — gösterim rozeti
    guncelKur: float = 1.0             # sözleşme bedelini TL'ye çeviren kur
    avansOrani: float = 0.0
    nakitTeminatOrani: float = 0.0     # Excel: Teminat_Orani
    kdvOrani: float = 0.20
    tevkifatOrani: float = 0.0
    stopajOrani: float = 0.0
    damgaVergisiOrani: float = 0.0     # yeni
    asgariIscilikOrani: float = 0.0    # yeni — SGK uyum
    ilkSozlesmeBedeli: float = 0.0     # TL
    zeyilnamelerToplami: float = 0.0   # TL
    guncelSozlesmeBedeli: float = 0.0  # TL
    durum: Literal["Devam", "Tamamlandı", "Askıda"] = "Devam"


class Zeyilname(BaseModel):
    id: int
    projectName: str
    zeyilnameNo: str
    tarih: str
    tutar: float          # TL
    aciklama: str = ""


class MaliyetRaw(BaseModel):
    projectName: str
    donem: str
    kategori: str
    aciklama: str = ""
    tutar: float          # TL


class SGKRaw(BaseModel):
    projectName: str
    donem: str
    calisanSayisi: int = 0
    gun: int = 0
    primeEsas: float = 0.0   # TL


class HakedisRaw(BaseModel):
    id: int
    projectName: str
    hakedisNo: int
    donem: str
    tarih: str
    matrah: float                 # TL — Σ BEDELİ (Borc_TL)
    stopaj: float = 0.0           # TL — Excel STOPAJ (gerçek)
    avansKesinti: float = 0.0     # TL — Excel AVANS KESİNTİSİ
    nakitTeminat: float = 0.0     # TL — Excel TEMİNAT KESİNTİSİ
    digerKesintiler: float = 0.0  # TL — Excel DİĞER KESİNTİ − DİĞER KESİNTİ İADESİ
    tahsilEdilen: float = 0.0     # TL — Excel TAHSİLATI
    notlar: str = ""


# ── Hesaplanmış modeller ──────────────────────────────────────────────────────

class HakedisComputed(HakedisRaw):
    kdv: float                # matrah × kdvOrani (tam KDV)
    tevkifat: float           # kdv × tevkifatOrani (4/10 devlet payı)
    faturaToplami: float      # matrah + kdv − tevkifat − stopaj
    odenecek: float           # faturaToplami − avans − teminat − diğer
    bakiye: float             # odenecek − tahsilEdilen


class MaliyetKategori(BaseModel):
    kategori: str
    tutar: float              # TL
    oran: float               # toplam maliyete oranı


class SGKDonem(BaseModel):
    donem: str
    calisanSayisi: int
    gun: int
    primeEsas: float          # TL


class SGKUyum(BaseModel):
    gerekliMinIscilik: float  # toplamMatrah(TL) × asgariIscilikOrani
    gerceklesenPEK: float     # Σ primeEsas
    fark: float               # gerceklesen − gerekli (negatif = risk)
    riskli: bool
    donemler: list[SGKDonem]


class ProjectAggregate(BaseModel):
    rows: list[HakedisComputed]
    toplamMatrah: float
    toplamKDV: float
    toplamTevkifat: float
    toplamStopaj: float
    toplamFatura: float
    toplamAvansKesinti: float
    toplamNakitTeminat: float
    toplamDiger: float
    toplamOdenecek: float
    toplamTahsil: float
    toplamBakiye: float
    tamamlanmaOrani: float
    kalanSozlesme: float
    tahsilatOrani: float
    planlananAvansToplam: float
    avansMahsupOrani: float
    # ── Maliyet & SGK (yeni) ──
    toplamMaliyet: float = 0.0
    maliyetKategorileri: list[MaliyetKategori] = []
    brutKar: float = 0.0           # toplamMatrah − toplamMaliyet
    karMarji: float = 0.0          # brutKar / toplamMatrah
    sgk: Optional[SGKUyum] = None


class CustomerBreakdown(BaseModel):
    musteri: str
    deger: float
    projeSayisi: int


class ProjectWithAgg(BaseModel):
    p: Project
    agg: ProjectAggregate


class Portfolio(BaseModel):
    projAggs: list[ProjectWithAgg]
    toplamPortfoyDegeri: float
    toplamIlkSozlesme: float
    toplamZeyilname: float
    toplamGerceklesen: float
    toplamTahsilat: float
    toplamBakiye: float
    toplamOdenecek: float
    toplamBacklog: float
    portfoyTamamlanma: float
    portfoyTahsilatOrani: float
    portfoySozlesmeDegisim: float
    musteriler: list[CustomerBreakdown]
    aktifProjeSayisi: int
    toplamProjeSayisi: int
    toplamHakedisSayisi: int
    toplamZeyilnameSayisi: int
    # ── Maliyet (yeni) ──
    toplamMaliyet: float = 0.0
    portfoyKarMarji: float = 0.0


class ProjectDetailResponse(BaseModel):
    project: Project
    agg: ProjectAggregate
    zeyilnameler: list[Zeyilname]
