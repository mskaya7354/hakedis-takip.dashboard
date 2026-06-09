import os
import time
import requests
from pathlib import Path

# gonoder/.env dosyasından oku
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for line in _env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

EXCEL_PATH = Path(os.environ.get("GONODER_EXCEL_PATH", r"C:\Users\Administrator\Desktop\Hakedis_Takip.xlsm"))
UBUNTU_URL = os.environ.get("GONODER_URL", "http://10.41.77.12:8080/api/internal/push-excel")
TOKEN = os.environ.get("GONODER_TOKEN", "")
INTERVAL = int(os.environ.get("GONODER_INTERVAL", "30"))

last_mtime = 0.0


def push():
    try:
        data = EXCEL_PATH.read_bytes()
        r = requests.post(
            UBUNTU_URL,
            files={"file": ("Hakedis_Takip.xlsm", data)},
            headers={"x-push-token": TOKEN},
            timeout=30,
        )
        print(f"[{time.strftime('%H:%M:%S')}] Gonderildi: {len(data)//1024}KB  HTTP {r.status_code}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] HATA: {e}")


print("Hakedis Veri Gondericisi baslatildi")
print(f"Excel : {EXCEL_PATH}")
print(f"Sunucu: {UBUNTU_URL}")
print()

while True:
    try:
        mtime = EXCEL_PATH.stat().st_mtime
        if mtime != last_mtime:
            last_mtime = mtime
            print(f"[{time.strftime('%H:%M:%S')}] Degisiklik algilandi, gonderiyor...")
            push()
    except FileNotFoundError:
        print(f"[{time.strftime('%H:%M:%S')}] Excel bulunamadi: {EXCEL_PATH}")
    time.sleep(INTERVAL)
