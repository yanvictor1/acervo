import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'app.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

    const needsInit = !fs.existsSync(DB_PATH)
    db = new Database(DB_PATH)
    if (!process.env.VERCEL) db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    if (needsInit) {
      initSchema(db)
    } else {
      migrateSchema(db)
    }
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
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
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
      title, description, tags,
      content='documents', content_rowid='id',
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
  `)
}

function migrateSchema(db: Database.Database) {
  try { db.exec("ALTER TABLE documents ADD COLUMN views INTEGER NOT NULL DEFAULT 0") } catch {}
  db.exec(
    "CREATE TABLE IF NOT EXISTS feedback (" +
    "id INTEGER PRIMARY KEY AUTOINCREMENT," +
    "user_id TEXT DEFAULT ''," +
    "message TEXT NOT NULL," +
    "created_at TEXT NOT NULL DEFAULT (datetime('now'))" +
    ")"
  )
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}
