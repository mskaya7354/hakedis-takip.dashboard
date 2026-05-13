#!/usr/bin/env bash
# Hakedis Takip — Güncelleme scripti (kod değişikliği sonrası)
# Çalıştır: sudo bash deploy/update.sh
set -euo pipefail

APP_DIR=/opt/hakedis
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Backend güncelleniyor ==="
rsync -a --exclude='.venv' --exclude='venv' --exclude='__pycache__' \
    "$SCRIPT_DIR/backend/" "$APP_DIR/backend/"
cd "$APP_DIR/backend"
venv/bin/pip install -q -r requirements.txt
chown -R hakedis:hakedis "$APP_DIR/backend"
systemctl restart hakedis

echo "=== Frontend build + deploy ==="
cd "$SCRIPT_DIR/frontend"
npm run build
rsync -a --delete dist/ "$APP_DIR/frontend/dist/"
systemctl reload nginx

echo "✓ Güncelleme tamamlandı."
systemctl status hakedis --no-pager -l
