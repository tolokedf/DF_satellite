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

# Package Database/data into zip
(cd "$BASE_DIR/Database" && zip -r "$DEST_FILE" data -x "*.gitkeep")

# Also copy to root for quick access / USB copy
cp "$DEST_FILE" "$BASE_DIR/$ZIP_NAME"

CHECKSUM=$(sha256sum "$DEST_FILE" | awk '{print $1}')
FILE_SIZE=$(du -h "$DEST_FILE" | awk '{print $1}')

echo "----------------------------------------------------------------------"
echo " ✅ Export Complete!"
echo " 🗜️  Archive Size:     $FILE_SIZE"
echo " 🔒 SHA-256 Checksum: $CHECKSUM"
echo " 💾 Backup Archive:   $DEST_FILE"
echo " 📍 Quick Copy:       $BASE_DIR/$ZIP_NAME"
echo "======================================================================"
echo " 💡 Ready to copy to USB or transfer to another deployment server."
echo "======================================================================"
