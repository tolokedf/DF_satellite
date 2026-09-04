#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="$BASE_DIR/Database/data"
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./import_database.sh <path_to_backup_zip>"
  echo "Available backups in Database/backups/:"
  ls -lh "$BASE_DIR/Database/backups/"*.zip 2>/dev/null || echo "  (None found)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "======================================================================"
echo " 📥 DF SATELLITE - DATABASE RESTORE TOOL"
echo "======================================================================"
echo " Restoring from: $BACKUP_FILE"
echo " Target:         $DB_DIR"
echo "----------------------------------------------------------------------"

# Backup current DB before overwrite if exists
if [ -f "$DB_DIR/satellite.db" ]; then
  BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  cp "$DB_DIR/satellite.db" "$DB_DIR/satellite.db.pre_restore_$BACKUP_TIMESTAMP"
  echo " ℹ️  Current DB backed up to satellite.db.pre_restore_$BACKUP_TIMESTAMP"
fi

unzip -o "$BACKUP_FILE" -d "$BASE_DIR/Database"

echo "----------------------------------------------------------------------"
echo " ✅ Database Restored Successfully!"
echo "======================================================================"
