#!/usr/bin/env bash
# Hakedis Takip — Ubuntu 22.04 deployment script
# Çalıştır: sudo bash setup.sh
set -euo pipefail

APP_DIR=/opt/hakedis
SHARE_IP="192.168.1.x"          # Windows makinesi IP'si
SHARE_PATH="RAPOR"               # ← Paylaşım adı (net share ile kontrol et)
CIFS_USER="Administrator"        # ← Windows kullanıcı adı
CIFS_PASS="YourWindowsPassword"  # ← Windows şifresi
MOUNT_POINT="/mnt/hakedis_rapor"

echo "=== 1. Bağımlılıklar ==="
apt-get update -q
apt-get install -y python3.11 python3.11-venv python3-pip nginx cifs-utils curl

# Node.js 20 LTS (yoksa kur)
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "=== 2. Kullanıcı ==="
id hakedis &>/dev/null || useradd -r -s /sbin/nologin hakedis

echo "=== 3. SMB mount ==="
mkdir -p "$MOUNT_POINT"
# Credentials dosyası (daha güvenli)
cat > /etc/hakedis-smb-credentials <<EOF
username=$CIFS_USER
password=$CIFS_PASS
EOF
chmod 600 /etc/hakedis-smb-credentials

# /etc/fstab'a ekle (zaten yoksa)
FSTAB_ENTRY="//$SHARE_IP/$SHARE_PATH  $MOUNT_POINT  cifs  credentials=/etc/hakedis-smb-credentials,uid=hakedis,gid=hakedis,file_mode=0440,dir_mode=0550,iocharset=utf8,nofail,_netdev,x-systemd.automount  0  0"
grep -qF "$MOUNT_POINT" /etc/fstab || echo "$FSTAB_ENTRY" >> /etc/fstab
systemctl daemon-reload
mount "$MOUNT_POINT" 2>/dev/null || true

echo "=== 4. Frontend build ==="
cd "$SCRIPT_DIR/frontend"
npm ci --silent
npm run build

echo "=== 5a. Uygulama dosyaları ==="
mkdir -p "$APP_DIR"
rsync -a --exclude='.venv' --exclude='venv' --exclude='__pycache__' --exclude='dist' \
    "$SCRIPT_DIR/backend/" "$APP_DIR/backend/"
rsync -a "$SCRIPT_DIR/frontend/dist/" "$APP_DIR/frontend/dist/"
chown -R hakedis:hakedis "$APP_DIR"

echo "=== 5. Python venv ==="
cd "$APP_DIR/backend"
python3.11 -m venv venv
venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements.txt

echo "=== 6. .env (prod) ==="
cat > "$APP_DIR/backend/.env" <<EOF
EXCEL_PATH=$MOUNT_POINT/Hakediş Takip.xlsx
AUTH_USERNAME=hakediş
AUTH_PASSWORD=change-me-password
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_MINUTES=480
CACHE_TTL_SECONDS=5
LOAD_MAX_RETRIES=3
LOAD_RETRY_BACKOFF_SEC=1.0
STALE_TOLERANCE_SEC=300
EOF
chmod 600 "$APP_DIR/backend/.env"
chown hakedis:hakedis "$APP_DIR/backend/.env"

echo "=== 7. systemd servisi ==="
cp "$SCRIPT_DIR/deploy/hakedis.service" /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now hakedis

echo "=== 8. Nginx ==="
cp "$SCRIPT_DIR/deploy/nginx.conf" /etc/nginx/sites-available/hakedis
ln -sf /etc/nginx/sites-available/hakedis /etc/nginx/sites-enabled/hakedis
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ""
echo "✓ Kurulum tamamlandı!"
echo "  API: http://localhost:8000/api/health"
echo "  Web: http://$(hostname -I | awk '{print $1}')"
