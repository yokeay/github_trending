#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Data Directory Init Script
# Creates and initializes the SQLite database
# Run: npm run db:init
# ─────────────────────────────────────────────────────────────

set -e

DATA_DIR="./data"
DB_PATH="${DATA_DIR}/github_trending.db"

echo "🔧 Initializing data directory..."

# Create data directory if it doesn't exist
mkdir -p "${DATA_DIR}"

# Check if database exists
if [ -f "${DB_PATH}" ]; then
  echo "⚠️  Database already exists at ${DB_PATH}"
  read -p "Do you want to reinitialize? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "✨ Using existing database"
    exit 0
  fi
  rm "${DB_PATH}"
  echo "   Removed existing database"
fi

# Initialize database using Node.js
echo "   Creating database schema..."
node --input-type=module << 'EOF'
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './src/lib/db/schema.ts';

const db = new Database('./data/github_trending.db');
const drizzleDb = drizzle(db);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS gth_cache (
    key TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gth_bookmark (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT NOT NULL,
    repo TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    language TEXT,
    stargazers_count INTEGER NOT NULL DEFAULT 0,
    avatar_url TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gth_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    category TEXT,
    owner TEXT,
    repo TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS gth_user_pref (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    theme TEXT NOT NULL DEFAULT 'system',
    locale TEXT NOT NULL DEFAULT 'zh',
    per_page INTEGER NOT NULL DEFAULT 30,
    default_category TEXT NOT NULL DEFAULT 'trending',
    default_days INTEGER NOT NULL DEFAULT 7,
    auto_refresh INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cache_expires ON gth_cache(expires_at);
  CREATE INDEX IF NOT EXISTS idx_bookmark_fullname ON gth_bookmark(full_name);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON gth_audit_log(created_at);
`);

console.log('✅ Database initialized successfully');
db.close();
EOF

echo ""
echo "✅ Data directory initialized: ${DB_PATH}"
echo ""
echo "📊 Database tables:"
echo "   - gth_cache    (API response cache)"
echo "   - gth_bookmark (user bookmarks)"
echo "   - gth_audit_log (usage audit trail)"
echo "   - gth_user_pref (user preferences)"