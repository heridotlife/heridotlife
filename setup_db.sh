#!/bin/bash

# Check if tables exist
TABLES_EXISTS=$(bunx wrangler d1 execute D1_db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name='ShortUrl';" 2>&1 | grep -q "ShortUrl" && echo "yes" || echo "no")

if [ "$TABLES_EXISTS" = "no" ]; then
  echo "📦 Setting up local D1 database..."
  
  # Create schema
  echo "Creating tables..."
  bunx wrangler d1 execute D1_db --local --file=./schema.sql
  
  # Import data
  echo "Importing data..."
  bunx wrangler d1 execute D1_db --local --file=./import_remote_data.sql
  
  echo "✅ Database setup complete!"
else
  echo "✅ Database already exists, skipping setup"
fi

# Also populate ALL miniflare database files directly (handles multiple instances created by live-reload)
echo "🔧 Ensuring all miniflare database instances are populated..."
for db in .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite; do
  if [ -f "$db" ]; then
    # Check if this specific database file has tables
    HAS_TABLES=$(sqlite3 "$db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='ShortUrl';" 2>/dev/null)
    if [ "$HAS_TABLES" = "0" ] || [ -z "$HAS_TABLES" ]; then
      echo "   Populating $(basename $db)..."
      sqlite3 "$db" < schema.sql 2>&1
      sqlite3 "$db" < import_remote_data.sql 2>&1
    fi
  fi
done
echo "✅ All database instances verified"
