#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "======================================================================"
echo "          ⚙️  DF SATELLITE — LINUX SERVER SETUP TOOL"
echo "======================================================================"
echo " This script prepares DF Satellite on this Linux server/system:"
echo "   1. Verify Node.js and environment configuration (.env)"
echo "   2. Install Node.js dependencies (npm install)"
echo "   3. Generate Prisma client types"
echo "   4. Initialize / verify SQLite database & seed data"
echo "   5. Compile production build (npm run build)"
echo "======================================================================"
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ [ERROR] Node.js is not installed or not in PATH!"
  echo "Please install Node.js 18 or 20 LTS (https://nodejs.org)."
  exit 1
fi

# 2. Check .env
echo "[1/5] Verifying environment configuration (.env)..."
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo "      Created .env from .env.example"
  else
    cat <<EOF > .env
DATABASE_URL="file:../Database/data/satellite.db"
NEXTAUTH_SECRET="df-satellite-secret-key-2026"
NEXTAUTH_URL="http://localhost:3001"
PORT=3001
HOST="0.0.0.0"
EOF
    echo "      Generated default .env configuration"
  fi
else
  echo "      .env configuration file verified."
fi

# 3. Install dependencies
echo ""
echo "[2/5] Installing npm dependencies..."
npm install

# 4. Generate Prisma Client
echo ""
echo "[3/5] Generating Prisma Client..."
npx prisma generate

# 5. Database check & initialization
echo ""
echo "[4/5] Checking database status..."
mkdir -p "$BASE_DIR/Database/data"

if [ ! -f "$BASE_DIR/Database/data/satellite.db" ]; then
  if [ -f "$BASE_DIR/DF_Satellite_DB_latest.zip" ]; then
    echo "      Found DF_Satellite_DB_latest.zip in project root, restoring..."
    bash scripts/import_database.sh "$BASE_DIR/DF_Satellite_DB_latest.zip"
  elif [ -f "$BASE_DIR/Database/backups/DF_Satellite_DB_latest.zip" ]; then
    echo "      Found backup in Database/backups, restoring..."
    bash scripts/import_database.sh "$BASE_DIR/Database/backups/DF_Satellite_DB_latest.zip"
  else
    echo "      No existing database detected."
    echo "      Pushing schema and seeding default records..."
    npx prisma db push
    npm run prisma:seed
  fi
else
  echo "      Existing database verified at Database/data/satellite.db"
fi

# Ensure WAL mode
node -e '
  const { PrismaClient } = require("@prisma/client");
  const p = new PrismaClient();
  p.$queryRawUnsafe("PRAGMA journal_mode=WAL;").then(() => p.$disconnect()).catch(() => {});
' 2>/dev/null || true

# 6. Production build
echo ""
echo "[5/5] Compiling production build..."
npm run build

echo ""
echo "======================================================================"
echo " ✅ Setup Complete! DF Satellite is ready for deployment."
echo "======================================================================"
echo " To start the server:"
echo "   ./start.sh"
echo ""
echo " To stop the server:"
echo "   ./stop.sh"
echo "======================================================================"
