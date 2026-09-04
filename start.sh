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
echo " Administrator Login:"
echo "   • Username: admin"
echo "   • Password: df"
echo "   (Add Customer and Engineer accounts in Admin Console -> /admin)"
echo "======================================================================"

exec npx next start -H 0.0.0.0 -p "$PORT"
