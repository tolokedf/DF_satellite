#!/bin/bash
set -e

PORT=${PORT:-3000}
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

export PATH="/home/tinonn/.local/bin:$PATH"

# Detect local IP address
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
  LAN_IP="127.0.0.1"
fi

echo "======================================================================"
echo " 🚀 DF SATELLITE — FIELD DEPLOYMENT & ROBOT ISSUE TRACKER"
echo "======================================================================"
echo " Local URL:    http://localhost:$PORT"
echo " Network / LAN: http://$LAN_IP:$PORT"
echo " Database:     $BASE_DIR/Database/data/satellite.db (Decoupled)"
echo "----------------------------------------------------------------------"
echo " Quick Accounts:"
echo "   • Engineer (Google linked): engineer / eng123"
echo "   • Admin:                    admin / admin123"
echo "   • Proton Customer:          proton / proton123 (Johor & Penang only)"
echo "   • Perodua Customer:        perodua / perodua123 (Rawang only)"
echo "   • Engineer (Field Intern):  intern / intern123"
echo "======================================================================"

exec npx next start -H 0.0.0.0 -p "$PORT"
