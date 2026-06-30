import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const USE_SQLITE = process.env.NODE_ENV === 'development' && !process.env.VERCEL

let pool: Pool | null = null
let sqliteDb: any = null

async function initPgSchema(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      description TEXT DEFAULT '',
      filename TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      tags TEXT NOT NULL DEFAULT '[]',
      is_favorite_admin INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  try { await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector`) } catch {}
  try { await client.query(`CREATE INDEX IF NOT EXISTS documents_search_idx ON documents USING GIN(search_vector)`) } catch {}

  await client.query(`
    CREATE OR REPLACE FUNCTION documents_search_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.tags, ''));
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `)
  await client.query('DROP TRIGGER IF EXISTS documents_search_trigger ON documents')
  await client.query(`
    CREATE TRIGGER documents_search_trigger
      BEFORE INSERT OR UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION documents_search_update()
  `)

  await client.query(`
    CREATE TABLE IF NOT EXISTS feedback (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT DEFAULT '',
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id TEXT NOT NULL,
      document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, document_id)
    )
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    )
  `)
}

function initSqliteSchema(db: any) {
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

export async function getDb() {
  if (USE_SQLITE) {
    if (!sqliteDb) {
      const Database = (await import('better-sqlite3')).default
      const DATA_DIR = path.join(process.cwd(), 'data')
      if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
      const DB_PATH = path.join(DATA_DIR, 'app.db')
      const needsInit = !fs.existsSync(DB_PATH)
      sqliteDb = new Database(DB_PATH)
      if (!process.env.VERCEL) sqliteDb.pragma('journal_mode = WAL')
      sqliteDb.pragma('foreign_keys = ON')
      if (needsInit) initSqliteSchema(sqliteDb)
    }
    return sqliteDb
  }

  if (!pool) {
    const connStr = process.env.DATABASE_URL
    if (!connStr) throw new Error('DATABASE_URL environment variable not set')
    const { Pool: PgPool } = await import('pg')
    pool = new PgPool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
    const client = await pool.connect()
    try {
      await initPgSchema(client)
    } finally {
      client.release()
    }
  }
  return pool
}

export async function query(sql: string, params?: any[]): Promise<any[]> {
  const db = await getDb()
  if (USE_SQLITE) return (db as any).prepare(sql).all(...(params || []))
  const { rows } = await (db as Pool).query(sql, params)
  return rows
}

export async function queryOne(sql: string, params?: any[]): Promise<any> {
  const rows = await query(sql, params)
  return rows[0] || null
}

export async function execute(sql: string, params?: any[]): Promise<{ rowCount: number; rows?: any[]; lastInsertId?: number }> {
  const db = await getDb()
  if (USE_SQLITE) {
    const stmt = (db as any).prepare(sql)
    const info = stmt.run(...(params || []))
    return { rowCount: info.changes, lastInsertId: info.lastInsertRowid as number }
  }
  const result = await (db as Pool).query(sql, params)
  return { rowCount: result.rowCount || 0, rows: result.rows }
}

export function closeDb() {
  if (sqliteDb) { sqliteDb.close(); sqliteDb = null }
  if (pool) { pool.end().catch(() => {}); pool = null }
}
