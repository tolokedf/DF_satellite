#!/bin/bash
set -e

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_DIR="$BASE_DIR/Database/data"
BACKUP_FILE="$1"

# If no file specified, search for latest backup
if [ -z "$BACKUP_FILE" ]; then
  if [ -f "$BASE_DIR/DF_Satellite_DB_latest.zip" ]; then
    BACKUP_FILE="$BASE_DIR/DF_Satellite_DB_latest.zip"
  else
    LATEST_ZIP=$(ls -t "$BASE_DIR/Database/backups/"*.zip 2>/dev/null | head -n 1 || true)
    if [ -n "$LATEST_ZIP" ]; then
      BACKUP_FILE="$LATEST_ZIP"
    fi
  fi
fi

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./import.sh <path_to_backup_file.zip|path_to_database.db>"
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
echo " Target DB:      $DB_DIR/satellite.db"
echo "----------------------------------------------------------------------"

mkdir -p "$DB_DIR"

# Safety backup of current DB before overwrite
if [ -f "$DB_DIR/satellite.db" ]; then
  BACKUP_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  cp "$DB_DIR/satellite.db" "$DB_DIR/satellite.db.bak_$BACKUP_TIMESTAMP"
  echo " ℹ️  Existing DB backed up to: satellite.db.bak_$BACKUP_TIMESTAMP"
fi

# Remove existing WAL and SHM journal files to prevent stale state mismatch
rm -f "$DB_DIR/satellite.db-wal" "$DB_DIR/satellite.db-shm" 2>/dev/null || true

# Check if input is a direct .db file or a .zip archive
if [[ "$BACKUP_FILE" == *.db ]]; then
  cp -f "$BACKUP_FILE" "$DB_DIR/satellite.db"
else
  TEMP_DIR=$(mktemp -d)
  unzip -q -o "$BACKUP_FILE" -d "$TEMP_DIR"
  if [ -f "$TEMP_DIR/data/satellite.db" ]; then
    cp -f "$TEMP_DIR/data/satellite.db" "$DB_DIR/satellite.db"
  elif [ -f "$TEMP_DIR/satellite.db" ]; then
    cp -f "$TEMP_DIR/satellite.db" "$DB_DIR/satellite.db"
  else
    FOUND_DB=$(find "$TEMP_DIR" -name "*.db" -type f | head -n 1 || true)
    if [ -n "$FOUND_DB" ]; then
      cp -f "$FOUND_DB" "$DB_DIR/satellite.db"
    else
      echo "❌ Error: No database (.db) file found inside $BACKUP_FILE"
      rm -rf "$TEMP_DIR"
      exit 1
    fi
  fi
  rm -rf "$TEMP_DIR"
fi

FILE_SIZE=$(du -h "$DB_DIR/satellite.db" | awk '{print $1}')
echo "----------------------------------------------------------------------"
echo " ✅ Database Restored Successfully! ($FILE_SIZE)"
echo " 📍 Location: $DB_DIR/satellite.db"
echo "======================================================================"
echo " 💡 If the web server is running, restart it to load the imported data:"
echo "    ./start.sh"
echo "======================================================================"
