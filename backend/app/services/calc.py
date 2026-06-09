"""
Hesaplama motoru — Hakedis_Takip.xlsm modeli.

HakedisRaw alanları (matrah, stopaj, avans, teminat, diğer, tahsil) Excel'den
GERÇEK okunur (Borc_TL/Alacak_TL). calc burada KDV/tevkifat/ödenecek/bakiye türetir
ve maliyet + SGK uyumunu hesaplar.

KDV mantığı: Excel "KDV BEYAN (6/10)" = matrah × kdvOrani × (1−tevkifatOrani).
Burada tam KDV ve tevkifat oranlardan türetilir (Excel beyanıyla tutarlı):
  kdv      = matrah × kdvOrani
  tevkifat = kdv × tevkifatOrani
"""
from app.models.schemas import (
    CustomerBreakdown,
    HakedisComputed,
    HakedisRaw,
    MaliyetKategori,
    MaliyetRaw,
    Portfolio,
    Project,
    ProjectAggregate,
    ProjectWithAgg,
    SGKDonem,
    SGKRaw,
    SGKUyum,
)

_TR_MONTHS: dict[str, int] = {
    "Ocak": 0, "Şubat": 1, "Subat": 1, "Mart": 2, "Nisan": 3,
    "Mayıs": 4, "Mayis": 4, "Haziran": 5, "Temmuz": 6,
    "Ağustos": 7, "Agustos": 7, "Eylül": 8, "Eylul": 8,
    "Ekim": 9, "Kasım": 10, "Kasim": 10, "Aralık": 11, "Aralik": 11,
}


def _donem_key(donem: str) -> tuple[int, int]:
    try:
        year_str, month_str = donem.split("-", 1)
        return int(year_str), _TR_MONTHS.get(month_str, 0)
    except (ValueError, AttributeError):
        return 2000, 0


def calc_hakedis(h: HakedisRaw, p: Project) -> HakedisComputed:
    """Excel'den gelen ham hakedişe KDV/tevkifat/ödenecek/bakiye türet."""
    kdv = h.matrah * p.kdvOrani
    tevkifat = kdv * p.tevkifatOrani
    fatura_toplami = h.matrah + kdv - tevkifat - h.stopaj
    odenecek = fatura_toplami - h.avansKesinti - h.nakitTeminat - (h.digerKesintiler or 0.0)
    bakiye = odenecek - (h.tahsilEdilen or 0.0)

    return HakedisComputed(
        **h.model_dump(),
        kdv=kdv,
        tevkifat=tevkifat,
        faturaToplami=fatura_toplami,
        odenecek=odenecek,
        bakiye=bakiye,
    )


def _build_maliyet(p: Project, all_maliyetler: list[MaliyetRaw]) -> tuple[list[MaliyetKategori], float]:
    """Projenin maliyetlerini kategoriye göre topla."""
    cat_map: dict[str, float] = {}
    for m in all_maliyetler:
        if m.projectName == (p.kod or p.name) or m.projectName == p.name:
            cat_map[m.kategori] = cat_map.get(m.kategori, 0.0) + m.tutar
    toplam = sum(cat_map.values())
    kategoriler = [
        MaliyetKategori(kategori=k, tutar=v, oran=(v / toplam if toplam > 0 else 0.0))
        for k, v in sorted(cat_map.items(), key=lambda x: x[1], reverse=True)
    ]
    return kategoriler, toplam


def _build_sgk(p: Project, toplam_matrah: float, all_sgk: list[SGKRaw]) -> SGKUyum | None:
    """SGK asgari işçilik uyumu."""
    donemler = [
        SGKDonem(donem=s.donem, calisanSayisi=s.calisanSayisi, gun=s.gun, primeEsas=s.primeEsas)
        for s in all_sgk
        if s.projectName == (p.kod or p.name) or s.projectName == p.name
    ]
    if not donemler and p.asgariIscilikOrani <= 0:
        return None

    gerekli = toplam_matrah * p.asgariIscilikOrani
    gerceklesen = sum(d.primeEsas for d in donemler)
    fark = gerceklesen - gerekli
    return SGKUyum(
        gerekliMinIscilik=gerekli,
        gerceklesenPEK=gerceklesen,
        fark=fark,
        riskli=fark < 0,
        donemler=sorted(donemler, key=lambda d: _donem_key(d.donem)),
    )


def aggregate_project(
    p: Project,
    all_hakedisler: list[HakedisRaw],
    all_maliyetler: list[MaliyetRaw] | None = None,
    all_sgk: list[SGKRaw] | None = None,
) -> ProjectAggregate:
    all_maliyetler = all_maliyetler or []
    all_sgk = all_sgk or []

    rows = sorted(
        [calc_hakedis(h, p) for h in all_hakedisler if h.projectName == (p.kod or p.name) or h.projectName == p.name],
        key=lambda r: _donem_key(r.donem),
    )

    def _sum(attr: str) -> float:
        return sum(getattr(r, attr) or 0.0 for r in rows)

    toplam_matrah = _sum("matrah")
    toplam_odenecek = _sum("odenecek")
    toplam_tahsil = _sum("tahsilEdilen")
    toplam_avans = _sum("avansKesinti")
    planlanan_avans = p.guncelSozlesmeBedeli * p.avansOrani

    maliyet_kategorileri, toplam_maliyet = _build_maliyet(p, all_maliyetler)
    brut_kar = toplam_matrah - toplam_maliyet
    kar_marji = brut_kar / toplam_matrah if toplam_matrah > 0 else 0.0
    sgk = _build_sgk(p, toplam_matrah, all_sgk)

    return ProjectAggregate(
        rows=rows,
        toplamMatrah=toplam_matrah,
        toplamKDV=_sum("kdv"),
        toplamTevkifat=_sum("tevkifat"),
        toplamStopaj=_sum("stopaj"),
        toplamFatura=_sum("faturaToplami"),
        toplamAvansKesinti=toplam_avans,
        toplamNakitTeminat=_sum("nakitTeminat"),
        toplamDiger=_sum("digerKesintiler"),
        toplamOdenecek=toplam_odenecek,
        toplamTahsil=toplam_tahsil,
        toplamBakiye=_sum("bakiye"),
        tamamlanmaOrani=toplam_matrah / p.guncelSozlesmeBedeli if p.guncelSozlesmeBedeli > 0 else 0.0,
        kalanSozlesme=p.guncelSozlesmeBedeli - toplam_matrah,
        tahsilatOrani=toplam_tahsil / toplam_odenecek if toplam_odenecek > 0 else 0.0,
        planlananAvansToplam=planlanan_avans,
        avansMahsupOrani=toplam_avans / planlanan_avans if planlanan_avans > 0 else 0.0,
        toplamMaliyet=toplam_maliyet,
        maliyetKategorileri=maliyet_kategorileri,
        brutKar=brut_kar,
        karMarji=kar_marji,
        sgk=sgk,
    )


def aggregate_portfolio(
    projects: list[Project],
    hakedisler: list[HakedisRaw],
    zeyilnameler_count: int,
    maliyetler: list[MaliyetRaw] | None = None,
    sgk: list[SGKRaw] | None = None,
) -> Portfolio:
    maliyetler = maliyetler or []
    sgk = sgk or []

    proj_aggs = [
        ProjectWithAgg(p=p, agg=aggregate_project(p, hakedisler, maliyetler, sgk))
        for p in projects
    ]

    toplam_portfoy = sum(x.p.guncelSozlesmeBedeli for x in proj_aggs)
    toplam_ilk = sum(x.p.ilkSozlesmeBedeli for x in proj_aggs)
    toplam_zey = sum(x.p.zeyilnamelerToplami for x in proj_aggs)
    toplam_ger = sum(x.agg.toplamMatrah for x in proj_aggs)
    toplam_tah = sum(x.agg.toplamTahsil for x in proj_aggs)
    toplam_bak = sum(x.agg.toplamBakiye for x in proj_aggs)
    toplam_ode = sum(x.agg.toplamOdenecek for x in proj_aggs)
    toplam_mal = sum(x.agg.toplamMaliyet for x in proj_aggs)

    musteri_map: dict[str, CustomerBreakdown] = {}
    for x in proj_aggs:
        key = x.p.musteri or x.p.name
        cur = musteri_map.setdefault(key, CustomerBreakdown(musteri=key, deger=0.0, projeSayisi=0))
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
        toplamMaliyet=toplam_mal,
        portfoyKarMarji=(toplam_ger - toplam_mal) / toplam_ger if toplam_ger > 0 else 0.0,
    )
