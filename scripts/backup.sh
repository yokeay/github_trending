#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Disaster Backup Script
# Creates timestamped backup of critical files
# Run: ./scripts/backup.sh
# ─────────────────────────────────────────────────────────────

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

echo "📦 Creating disaster backup..."
echo "   Location: ${BACKUP_PATH}"

# Create backup directory
mkdir -p "${BACKUP_PATH}"

# Backup critical files
cp package.json "${BACKUP_PATH}/"
cp package-lock.json "${BACKUP_PATH}/"
cp -r src "${BACKUP_PATH}/src"
cp -r scripts "${BACKUP_PATH}/scripts"
cp .env.example "${BACKUP_PATH}/.env.example"

# Backup config files
cp tsconfig.json "${BACKUP_PATH}/" 2>/dev/null || true
cp next.config.ts "${BACKUP_PATH}/" 2>/dev/null || true
cp vitest.config.ts "${BACKUP_PATH}/" 2>/dev/null || true
cp eslint.config.mjs "${BACKUP_PATH}/" 2>/dev/null || true
cp tailwind.config.ts "${BACKUP_PATH}/" 2>/dev/null || true

# Create metadata
cat > "${BACKUP_PATH}/metadata.json" << EOF
{
  "timestamp": "${TIMESTAMP}",
  "date": "$(date -Iseconds)",
  "git": "$(git rev-parse HEAD 2>/dev/null || echo 'not a git repo')",
  "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
}
EOF

# Compress backup
echo "   Compressing..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"

echo ""
echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo ""

# Clean old backups (keep last 10)
cd "${BACKUP_DIR}"
BACKUP_COUNT=$(ls -1 backup_*.tar.gz 2>/dev/null | wc -l)
if [ $BACKUP_COUNT -gt 10 ]; then
  echo "🧹 Cleaning old backups (keeping last 10)..."
  ls -1t backup_*.tar.gz | tail -n +11 | xargs -r rm
fi

echo "📊 Backup list:"
ls -1t backup_*.tar.gz | head -5