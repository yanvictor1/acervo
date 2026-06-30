const { Pool } = require('pg');
const connStr = 'postgresql://postgres:Euamosamara0211%40@db.mxnqgeexoogbatrxrtza.supabase.co:5432/postgres?sslmode=require';
const pool = new Pool({ connectionString: connStr, ssl: { rejectUnauthorized: false } });

async function init() {
  try {
    const client = await pool.connect();
    console.log('Connected to Supabase PostgreSQL!');
    // ... rest stays the same
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
    `);
    console.log('✓ documents table');
    await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS search_vector tsvector`);
    await client.query(`CREATE INDEX IF NOT EXISTS documents_search_idx ON documents USING GIN(search_vector)`);
    await client.query(`
      CREATE OR REPLACE FUNCTION documents_search_update() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector := to_tsvector('portuguese', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, '') || ' ' || COALESCE(NEW.tags, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await client.query('DROP TRIGGER IF EXISTS documents_search_trigger ON documents');
    await client.query(`
      CREATE TRIGGER documents_search_trigger
        BEFORE INSERT OR UPDATE ON documents
        FOR EACH ROW EXECUTE FUNCTION documents_search_update()
    `);
    console.log('✓ search trigger');
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT DEFAULT '',
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    console.log('✓ feedback table');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id TEXT NOT NULL,
        document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, document_id)
      )
    `);
    console.log('✓ user_favorites table');
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT 'admin',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      )
    `);
    console.log('✓ sessions table');
    await client.query(`
      UPDATE documents SET search_vector = to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(tags, ''))
    `);
    console.log('✓ existing search vectors updated');
    console.log('\nAll done!');
    await client.release();
    await pool.end();
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}
init();
