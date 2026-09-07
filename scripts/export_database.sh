#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="$BASE_DIR/Database/data"
BACKUP_DIR="$BASE_DIR/Database/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ZIP_NAME="DF_Satellite_DB_${TIMESTAMP}.zip"
DEST_FILE="$BACKUP_DIR/$ZIP_NAME"

mkdir -p "$BACKUP_DIR"

echo "======================================================================"
echo " 📦 DF SATELLITE - DATABASE EXPORT TOOL (PROGRAM-DB SEPARATION)"
echo "======================================================================"
echo " Source:       $DB_DIR"
echo " Destination:  $DEST_FILE"
echo "----------------------------------------------------------------------"

if [ ! -d "$DB_DIR" ] || [ -z "$(ls -A "$DB_DIR" 2>/dev/null)" ]; then
  echo "❌ Error: Database directory is empty or not found at $DB_DIR"
  exit 1
fi

# Ensure SQLite WAL is checkpointed to avoid missing pending journal writes
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$DB_DIR/satellite.db" ]; then
  echo " 🔄 Checkpointing SQLite WAL journal..."
  sqlite3 "$DB_DIR/satellite.db" "PRAGMA wal_checkpoint(TRUNCATE);" 2>/dev/null || true
fi

# Package Database/data into zip
(cd "$BASE_DIR/Database" && zip -r "$DEST_FILE" data -x "*.gitkeep" -x "*.wal" -x "*.shm" -x "*.bak*")

# Keep DF_Satellite_DB_latest.zip in backups folder
cp -f "$DEST_FILE" "$BACKUP_DIR/DF_Satellite_DB_latest.zip"

CHECKSUM=$(sha256sum "$DEST_FILE" | awk '{print $1}')
FILE_SIZE=$(du -h "$DEST_FILE" | awk '{print $1}')

echo "----------------------------------------------------------------------"
echo " ✅ Export Complete!"
echo " 🗜️  Archive Size:     $FILE_SIZE"
echo " 🔒 SHA-256 Checksum: $CHECKSUM"
echo " 💾 Backup Archive:   $DEST_FILE"
echo " 📍 Quick USB Copy:   $BACKUP_DIR/DF_Satellite_DB_latest.zip"
echo "======================================================================"
echo " 📋 Next Steps to Transfer to Windows Desktop:"
echo " 1. Copy 'DF_Satellite_DB_latest.zip' from Database/backups/ to your USB drive."
echo " 2. On your Windows desktop, plug in the USB drive."
echo " 3. Drag and drop the zip file onto 'import.bat' (or place it in the folder and double-click 'import.bat')."
echo "======================================================================"
