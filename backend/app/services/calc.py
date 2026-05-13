"""
Hesaplama motoru — data.jsx'teki JS fonksiyonlarının bire bir Python karşılığı.
calcHakedis  →  calc_hakedis
aggregateProject  →  aggregate_project
aggregatePortfolio  →  aggregate_portfolio
"""
from app.models.schemas import (
    CustomerBreakdown,
    HakedisComputed,
    HakedisRaw,
    Portfolio,
    Project,
    ProjectAggregate,
    ProjectWithAgg,
    Zeyilname,
)

_TR_MONTHS: dict[str, int] = {
    "Ocak": 0, "Şubat": 1, "Subat": 1, "Mart": 2, "Nisan": 3,
    "Mayıs": 4, "Mayis": 4, "Haziran": 5, "Temmuz": 6,
    "Ağustos": 7, "Agustos": 7, "Eylül": 8, "Eylul": 8,
    "Ekim": 9, "Kasım": 10, "Kasim": 10, "Aralık": 11, "Aralik": 11,
}


def _donem_key(donem: str) -> tuple[int, int]:
    """'2026-Ocak' → (2026, 0) — sıralama için."""
    try:
        year_str, month_str = donem.split("-", 1)
        return int(year_str), _TR_MONTHS.get(month_str, 0)
    except (ValueError, AttributeError):
        return 2000, 0


def calc_hakedis(h: HakedisRaw, p: Project) -> HakedisComputed:
    """Tek hakediş satırını hesapla — JS calcHakedis ile birebir aynı formüller."""
    kdv = h.matrah * p.kdvOrani
    tevkifat = kdv * p.tevkifatOrani
    stopaj = h.matrah * p.stopajOrani
    fatura_toplami = h.matrah + kdv - tevkifat - stopaj
    avans_kesinti = h.matrah * p.avansOrani
    nakit_teminat = h.matrah * p.nakitTeminatOrani
    odenecek = fatura_toplami - avans_kesinti - nakit_teminat - (h.digerKesintiler or 0.0)
    bakiye = odenecek - (h.tahsilEdilen or 0.0)

    return HakedisComputed(
        **h.model_dump(),
        kdv=kdv,
        tevkifat=tevkifat,
        stopaj=stopaj,
        faturaToplami=fatura_toplami,
        avansKesinti=avans_kesinti,
        nakitTeminat=nakit_teminat,
        odenecek=odenecek,
        bakiye=bakiye,
    )


def aggregate_project(p: Project, all_hakedisler: list[HakedisRaw]) -> ProjectAggregate:
    rows = sorted(
        [calc_hakedis(h, p) for h in all_hakedisler if h.projectName == p.name],
        key=lambda r: _donem_key(r.donem),
    )

    def _s(attr: str) -> float:
        return sum(getattr(r, attr) or 0.0 for r in rows)

    toplam_matrah = _s("matrah")
    toplam_odenecek = _s("odenecek")
    toplam_tahsil = _s("tahsilEdilen")
    toplam_avans = _s("avansKesinti")
    planlanan_avans = p.guncelSozlesmeBedeli * p.avansOrani

    return ProjectAggregate(
        rows=rows,
        toplamMatrah=toplam_matrah,
        toplamKDV=_s("kdv"),
        toplamTevkifat=_s("tevkifat"),
        toplamStopaj=_s("stopaj"),
        toplamFatura=_s("faturaToplami"),
        toplamAvansKesinti=toplam_avans,
        toplamNakitTeminat=_s("nakitTeminat"),
        toplamDiger=_s("digerKesintiler"),
        toplamOdenecek=toplam_odenecek,
        toplamTahsil=toplam_tahsil,
        toplamBakiye=_s("bakiye"),
        tamamlanmaOrani=toplam_matrah / p.guncelSozlesmeBedeli if p.guncelSozlesmeBedeli > 0 else 0.0,
        kalanSozlesme=p.guncelSozlesmeBedeli - toplam_matrah,
        tahsilatOrani=toplam_tahsil / toplam_odenecek if toplam_odenecek > 0 else 0.0,
        planlananAvansToplam=planlanan_avans,
        avansMahsupOrani=toplam_avans / planlanan_avans if planlanan_avans > 0 else 0.0,
    )


def aggregate_portfolio(
    projects: list[Project],
    hakedisler: list[HakedisRaw],
    zeyilnameler_count: int,
) -> Portfolio:
    proj_aggs = [
        ProjectWithAgg(p=p, agg=aggregate_project(p, hakedisler))
        for p in projects
    ]

    toplam_portfoy = sum(x.p.guncelSozlesmeBedeli for x in proj_aggs)
    toplam_ilk = sum(x.p.ilkSozlesmeBedeli for x in proj_aggs)
    toplam_zey = sum(x.p.zeyilnamelerToplami for x in proj_aggs)
    toplam_ger = sum(x.agg.toplamMatrah for x in proj_aggs)
    toplam_tah = sum(x.agg.toplamTahsil for x in proj_aggs)
    toplam_bak = sum(x.agg.toplamBakiye for x in proj_aggs)
    toplam_ode = sum(x.agg.toplamOdenecek for x in proj_aggs)

    # Müşteri kırılımı — musteri alanı None ise proje adını kullan
    musteri_map: dict[str, CustomerBreakdown] = {}
    for x in proj_aggs:
        key = x.p.musteri or x.p.name
        cur = musteri_map.setdefault(
            key, CustomerBreakdown(musteri=key, deger=0.0, projeSayisi=0)
        )
        cur.deger += x.p.guncelSozlesmeBedeli
        cur.projeSayisi += 1

    musteriler = sorted(musteri_map.values(), key=lambda m: m.deger, reverse=True)

    return Portfolio(
        projAggs=proj_aggs,
        toplamPortfoyDegeri=toplam_portfoy,
        toplamIlkSozlesme=toplam_ilk,
        toplamZeyilname=toplam_zey,
        toplamGerceklesen=toplam_ger,
        toplamTahsilat=toplam_tah,
        toplamBakiye=toplam_bak,
        toplamOdenecek=toplam_ode,
        toplamBacklog=toplam_portfoy - toplam_ger,
        portfoyTamamlanma=toplam_ger / toplam_portfoy if toplam_portfoy > 0 else 0.0,
        portfoyTahsilatOrani=toplam_tah / toplam_ode if toplam_ode > 0 else 0.0,
        portfoySozlesmeDegisim=toplam_zey / toplam_ilk if toplam_ilk > 0 else 0.0,
        musteriler=musteriler,
        aktifProjeSayisi=sum(1 for x in proj_aggs if x.p.durum == "Devam"),
        toplamProjeSayisi=len(proj_aggs),
        toplamHakedisSayisi=len(hakedisler),
        toplamZeyilnameSayisi=zeyilnameler_count,
    )
