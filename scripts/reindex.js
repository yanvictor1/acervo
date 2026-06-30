const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data', 'app.db')
const SCHEMA_PATH = path.join(__dirname, '..', 'data', 'schema.sql')
const fs = require('fs')

if (!fs.existsSync(DB_PATH)) {
  console.error('Database not found. Run: npm run db:init')
  process.exit(1)
}

const db = new Database(DB_PATH)

// Rebuild and reindex FTS
db.exec(`
  INSERT INTO documents_fts(documents_fts) VALUES('rebuild');
  INSERT INTO documents_fts(documents_fts) VALUES('optimize');
`)

console.log('FTS index rebuilt and optimized.')
db.close()
