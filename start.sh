#!/bin/bash
set -e

PORT=${PORT:-3001}
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

export PATH="/home/tinonn/.local/bin:$PATH"

# 1. Ensure .env exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
  else
    cat <<EOF > .env
DATABASE_URL="file:../Database/data/satellite.db"
NEXTAUTH_SECRET="df-satellite-secret-key-2026"
NEXTAUTH_URL="http://localhost:3001"
PORT=3001
HOST="0.0.0.0"
EOF
  fi
fi

# 2. Ensure Prisma Client is generated
if [ ! -d "node_modules/@prisma/client" ]; then
  echo "📦 Generating Prisma Client..."
  npx prisma generate
fi

# 3. Ensure Database directory and SQLite database exist
mkdir -p "$BASE_DIR/Database/data"
if [ ! -f "$BASE_DIR/Database/data/satellite.db" ]; then
  echo "⚠️  Database file not found at Database/data/satellite.db"
  if [ -f "$BASE_DIR/DF_Satellite_DB_latest.zip" ]; then
    echo "🔄 Restoring database from DF_Satellite_DB_latest.zip..."
    bash scripts/import_database.sh "$BASE_DIR/DF_Satellite_DB_latest.zip"
  elif [ -f "$BASE_DIR/Database/backups/DF_Satellite_DB_latest.zip" ]; then
    echo "🔄 Restoring database from Database/backups/DF_Satellite_DB_latest.zip..."
    bash scripts/import_database.sh "$BASE_DIR/Database/backups/DF_Satellite_DB_latest.zip"
  else
    echo "🌱 Initializing new SQLite schema and seeding default records..."
    npx prisma db push
    npm run prisma:seed
  fi
fi

# Ensure SQLite WAL mode is enabled
node -e '
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  p.$queryRawUnsafe("PRAGMA journal_mode=WAL;").then(() => p.$disconnect()).catch(() => {});
' 2>/dev/null || true

# 4. Ensure production build exists
if [ ! -d ".next" ]; then
  echo "🔨 No production build found. Building application..."
  npm run build
fi

# 5. Clean up any stale process occupying the target port
if command -v fuser >/dev/null 2>&1; then
  fuser -k "$PORT/tcp" 2>/dev/null || true
fi

# Detect local IP address
LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
if [ -z "$LAN_IP" ]; then
  LAN_IP="127.0.0.1"
fi

echo "======================================================================"
echo " 🚀 DF SATELLITE — FIELD DEPLOYMENT & ROBOT ISSUE TRACKER"
echo "======================================================================"
echo " Local URL:     http://localhost:$PORT"
echo " Network / LAN:  http://$LAN_IP:$PORT"
echo " Database:      $BASE_DIR/Database/data/satellite.db (Decoupled)"
echo "----------------------------------------------------------------------"
echo " Administrator Login:"
echo "   • Username: admin"
echo "   • Password: df"
echo "   (Add Customer and Engineer accounts in Admin Console -> /admin)"
echo "======================================================================"

exec npx next start -H 0.0.0.0 -p "$PORT"
