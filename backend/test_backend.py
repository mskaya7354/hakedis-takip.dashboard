#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Backend repo+calc dogrudan test (uvicorn'suz)."""
import sys
sys.stdout.reconfigure(encoding="utf-8")

from app.config import settings
from app.repositories.excel_repo import ExcelRepository
from app.services.calc import aggregate_portfolio, aggregate_project

print("="*64)
print(f"EXCEL: {settings.excel_path}")
print("="*64)

repo = ExcelRepository(settings.excel_path)
projects = repo.get_projects()
hakedisler = repo.get_hakedisler()
zeyilnameler = repo.get_zeyilnameler()
maliyetler = repo.get_maliyetler()
sgk = repo.get_sgk()

print(f"\nProjeler: {len(projects)} | Hakedis: {len(hakedisler)} | "
      f"Zeyil: {len(zeyilnameler)} | Maliyet: {len(maliyetler)} | SGK: {len(sgk)}")

print("\n--- PROJELER ---")
for p in projects:
    print(f"  [{p.id}] {p.name} ({p.paraBirimi}, kur={p.guncelKur}) "
          f"Sozlesme={p.guncelSozlesmeBedeli:,.0f}TL Zeyil={p.zeyilnamelerToplami:,.0f}TL")

print("\n--- PORTFOLIO ---")
pf = aggregate_portfolio(projects, hakedisler, len(zeyilnameler), maliyetler, sgk)
print(f"  Portfoy Degeri:   {pf.toplamPortfoyDegeri:,.0f} TL")
print(f"  Gerceklesen:      {pf.toplamGerceklesen:,.0f} TL")
print(f"  Tahsilat:         {pf.toplamTahsilat:,.0f} TL")
print(f"  Bakiye:           {pf.toplamBakiye:,.0f} TL")
print(f"  Toplam Maliyet:   {pf.toplamMaliyet:,.0f} TL")
print(f"  Kar Marji:        {pf.portfoyKarMarji*100:.1f}%")
print(f"  Tamamlanma:       {pf.portfoyTamamlanma*100:.1f}%")
print(f"  Aktif/Toplam:     {pf.aktifProjeSayisi}/{pf.toplamProjeSayisi}")

print("\n--- MONA94 DETAY ---")
mona = next((p for p in projects if p.kod == "MONA94"), None)
if mona:
    agg = aggregate_project(mona, hakedisler, maliyetler, sgk)
    print(f"  Hakedis sayisi: {len(agg.rows)}")
    for r in agg.rows:
        print(f"    Hak#{r.hakedisNo} ({r.donem}): matrah={r.matrah:,.0f} "
              f"kdv={r.kdv:,.0f} stopaj={r.stopaj:,.0f} odenecek={r.odenecek:,.0f} "
              f"tahsil={r.tahsilEdilen:,.0f} bakiye={r.bakiye:,.0f}")
    print(f"  TOPLAM matrah={agg.toplamMatrah:,.0f} odenecek={agg.toplamOdenecek:,.0f} "
          f"tahsil={agg.toplamTahsil:,.0f} bakiye={agg.toplamBakiye:,.0f}")
    print(f"  Tamamlanma: {agg.tamamlanmaOrani*100:.1f}%")
    print(f"  Maliyet: {agg.toplamMaliyet:,.0f} TL | Brut Kar: {agg.brutKar:,.0f} | Marj: {agg.karMarji*100:.1f}%")
    print(f"  Maliyet kategorileri:")
    for mk in agg.maliyetKategorileri:
        print(f"    {mk.kategori}: {mk.tutar:,.0f} ({mk.oran*100:.0f}%)")
    if agg.sgk:
        print(f"  SGK: gerekli={agg.sgk.gerekliMinIscilik:,.0f} gerceklesen={agg.sgk.gerceklesenPEK:,.0f} "
              f"fark={agg.sgk.fark:,.0f} {'RISKLI' if agg.sgk.riskli else 'UYGUN'}")

print("\n[OK] Backend test tamam.")
