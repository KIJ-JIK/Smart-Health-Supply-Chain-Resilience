#!/usr/bin/env bash
# ==============================================================================
# Automated PostgreSQL Backup & Point-in-Time Recovery (PITR) Script
# Masterplan §75 & Abdul_Backend.md (Prompt 21)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgresql}"
WAL_ARCHIVE_DIR="${WAL_ARCHIVE_DIR:-/var/lib/postgresql/wal_archive}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BASE_BACKUP_NAME="base_backup_${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}" "${WAL_ARCHIVE_DIR}"

echo "================================================================"
echo "Starting Automated Base Backup: ${BASE_BACKUP_NAME}"
echo "Timestamp: ${TIMESTAMP}"
echo "================================================================"

# 1. Take consistent physical base backup using pg_basebackup
if command -v pg_basebackup &> /dev/null; then
    pg_basebackup -h "${PGHOST:-localhost}" \
                  -p "${PGPORT:-5432}" \
                  -U "${PGUSER:-postgres}" \
                  -D "${BACKUP_DIR}/${BASE_BACKUP_NAME%.tar.gz}" \
                  -Ft -z -P -Xs
    echo "Base backup completed successfully via pg_basebackup."
else
    # Fallback logical backup using pg_dumpall if pg_basebackup is unavailable
    echo "pg_basebackup not found; falling back to pg_dumpall..."
    pg_dumpall -h "${PGHOST:-localhost}" \
               -p "${PGPORT:-5432}" \
               -U "${PGUSER:-postgres}" | gzip > "${BACKUP_DIR}/${BASE_BACKUP_NAME}"
    echo "Logical dump completed successfully: ${BACKUP_DIR}/${BASE_BACKUP_NAME}"
fi

# 2. Prune old base backups older than retention threshold (default 14 days)
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
echo "Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "base_backup_*.tar.gz" -mtime +"${RETENTION_DAYS}" -delete

# 3. WAL archive status check
WAL_COUNT=$(find "${WAL_ARCHIVE_DIR}" -type f | wc -l)
echo "Active WAL segments in archive: ${WAL_COUNT}"
echo "Disaster recovery base backup completed."
