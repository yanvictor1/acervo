const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db')
const SCHEMA_PATH = path.join(__dirname, '..', 'data', 'schema.sql')
const DATA_DIR = path.join(__dirname, '..', 'data')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const schema = `
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT DEFAULT '',
  filename TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL DEFAULT '[]',
  is_favorite_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_favorites (
  user_id TEXT NOT NULL,
  document_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, document_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
  title,
  description,
  tags,
  content='documents',
  content_rowid='id',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS documents_ai AFTER INSERT ON documents BEGIN
  INSERT INTO documents_fts(rowid, title, description, tags)
  VALUES (new.id, new.title, new.description, new.tags);
END;

CREATE TRIGGER IF NOT EXISTS documents_ad AFTER DELETE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description, tags)
  VALUES ('delete', old.id, old.title, old.description, old.tags);
END;

CREATE TRIGGER IF NOT EXISTS documents_au AFTER UPDATE ON documents BEGIN
  INSERT INTO documents_fts(documents_fts, rowid, title, description, tags)
  VALUES ('delete', old.id, old.title, old.description, old.tags);
  INSERT INTO documents_fts(rowid, title, description, tags)
  VALUES (new.id, new.title, new.description, new.tags);
END;
`

fs.writeFileSync(SCHEMA_PATH, schema)
console.log('Schema written to:', SCHEMA_PATH)

// Check if sqlite3 CLI is available
try {
  execSync('sqlite3 --version', { stdio: 'ignore' })
  execSync(`sqlite3 "${DB_PATH}" < "${SCHEMA_PATH}"`, { stdio: 'inherit' })
  console.log('Database initialized at:', DB_PATH)
} catch {
  // Create empty file, the app will create tables on first run
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, '')
  }
  console.log('SQLite CLI not found. Empty database created at:', DB_PATH)
  console.log('The app will initialize tables on first startup.')
}
