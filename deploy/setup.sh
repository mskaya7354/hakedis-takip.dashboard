#!/usr/bin/env bash
# Hakedis Takip — Ubuntu 22.04 deployment (gonoder PUSH modu, SMB YOK)
# Kasa dashboard ile AYNI sunucuda yan yana çalışır (farklı port).
#
# Çalıştır:  cd hakedis-takip.dashboard && sudo bash deploy/setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"   # repo kökü
APP_DIR=/opt/hakedis
DATA_DIR=/opt/hakedis/data                        # gonoder push hedefi
EXCEL_FILE="$DATA_DIR/Hakedis_Takip.xlsm"
NGINX_PORT=8080                                   # kasa 8765 ile çakışmaz
UVICORN_PORT=8000                                 # sadece localhost (nginx proxy)

echo "=== 1. Bağımlılıklar ==="
apt-get update -q
apt-get install -y python3.11 python3.11-venv python3-pip nginx curl openssl
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "=== 2. Kullanıcı + dizinler ==="
id hakedis &>/dev/null || useradd -r -s /sbin/nologin hakedis
mkdir -p "$APP_DIR" "$DATA_DIR"

echo "=== 3. Frontend build ==="
cd "$SCRIPT_DIR/frontend"
npm ci --silent
npm run build

echo "=== 4. Uygulama dosyaları ==="
rsync -a --exclude='venv' --exclude='__pycache__' --exclude='dist' --exclude='test_backend.py' \
    "$SCRIPT_DIR/backend/" "$APP_DIR/backend/"
mkdir -p "$APP_DIR/frontend"
rsync -a --delete "$SCRIPT_DIR/frontend/dist/" "$APP_DIR/frontend/dist/"

echo "=== 5. Python venv ==="
cd "$APP_DIR/backend"
python3.11 -m venv venv
venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements.txt

echo "=== 6. .env (prod) ==="
# Mevcut .env varsa PUSH_TOKEN'ı koru, yoksa üret
if [ -f "$APP_DIR/backend/.env" ] && grep -q '^PUSH_TOKEN=' "$APP_DIR/backend/.env"; then
    PUSH_TOKEN=$(grep '^PUSH_TOKEN=' "$APP_DIR/backend/.env" | cut -d= -f2-)
else
    PUSH_TOKEN=$(openssl rand -hex 24)
fi
JWT_SECRET=$(openssl rand -hex 32)
cat > "$APP_DIR/backend/.env" <<EOF
EXCEL_PATH=$EXCEL_FILE
AUTH_USERNAME=hakedis
AUTH_PASSWORD=hakedis2026
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_MINUTES=480
PUSH_TOKEN=$PUSH_TOKEN
CACHE_TTL_SECONDS=5
LOAD_MAX_RETRIES=3
LOAD_RETRY_BACKOFF_SEC=1.0
STALE_TOLERANCE_SEC=300
EOF
chmod 600 "$APP_DIR/backend/.env"

echo "=== 7. İzinler ==="
chown -R hakedis:hakedis "$APP_DIR"

echo "=== 8. systemd servisi ==="
sed "s|__UVICORN_PORT__|$UVICORN_PORT|g" "$SCRIPT_DIR/deploy/hakedis.service" \
    > /etc/systemd/system/hakedis.service
systemctl daemon-reload
systemctl enable --now hakedis
systemctl restart hakedis

echo "=== 9. Nginx ==="
sed "s|__NGINX_PORT__|$NGINX_PORT|g; s|__UVICORN_PORT__|$UVICORN_PORT|g" \
    "$SCRIPT_DIR/deploy/nginx.conf" > /etc/nginx/sites-available/hakedis
ln -sf /etc/nginx/sites-available/hakedis /etc/nginx/sites-enabled/hakedis
nginx -t && systemctl reload nginx

IP=$(hostname -I | awk '{print $1}')
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✓ Kurulum tamamlandı!"
echo "  Web:        http://$IP:$NGINX_PORT"
echo "  Giriş:      hakedis / hakedis2026"
echo "  Excel yolu: $EXCEL_FILE  (gonoder buraya push eder)"
echo ""
echo "  ⚠ gonoder için PUSH_TOKEN (Windows .env'e koy):"
echo "    $PUSH_TOKEN"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  Sağlık testi:"
echo "    curl http://127.0.0.1:$UVICORN_PORT/api/health"
echo "  Henüz Excel push edilmediyse dashboard boş görünür (normal)."
