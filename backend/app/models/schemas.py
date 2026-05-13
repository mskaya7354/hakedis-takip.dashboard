"""
Pydantic models — Excel kolon adları → Python field adları mapping burada değil,
ExcelRepository._load() içindeki rename dict'inde. Burada saf domain modeller.

Excel'de olmayan kolonlar (musteri, kod) Optional → Excel'e sonradan eklenebilir.
id kolonları da Excel'de yok → repo row index'ten üretir.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


# ── Ham veri modeller (Excel'den gelen) ──────────────────────────────────────

class Project(BaseModel):
    id: int
    name: str
    kod: Optional[str] = None        # Excel'de yok — ileride eklenebilir
    musteri: Optional[str] = None    # Excel'de yok — ileride eklenebilir
    avansOrani: float = 0.0
    nakitTeminatOrani: float = 0.0
    kdvOrani: float = 0.20
    tevkifatOrani: float = 0.0
    stopajOrani: float = 0.0
    ilkSozlesmeBedeli: float = 0.0
    zeyilnamelerToplami: float = 0.0
    guncelSozlesmeBedeli: float = 0.0
    durum: Literal["Devam", "Tamamlandı", "Askıda"] = "Devam"


class Zeyilname(BaseModel):
    id: int
    projectName: str
    zeyilnameNo: str
    tarih: str
    tutar: float
    aciklama: str = ""


class HakedisRaw(BaseModel):
    id: int
    projectName: str
    hakedisNo: int
    donem: str
    tarih: str
    matrah: float
    digerKesintiler: float = 0.0
    tahsilEdilen: float = 0.0
    notlar: str = ""


# ── Hesaplanmış modeller (calc.py çıktısı) ───────────────────────────────────

class HakedisComputed(HakedisRaw):
    kdv: float
    tevkifat: float
    stopaj: float
    faturaToplami: float
    avansKesinti: float
    nakitTeminat: float
    odenecek: float
    bakiye: float


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


class ProjectDetailResponse(BaseModel):
    project: Project
    agg: ProjectAggregate
    zeyilnameler: list[Zeyilname]
