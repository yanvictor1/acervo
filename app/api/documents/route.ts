import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { saveFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const db = getDb()
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const tag = searchParams.get('tag') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let sql: string
  let countSql: string
  let params: any[]

  if (query) {
    sql = `
      SELECT d.* FROM documents d
      INNER JOIN documents_fts fts ON d.id = fts.rowid
      WHERE documents_fts MATCH ?
      ${tag ? "AND d.tags LIKE ?" : ""}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `
    countSql = `
      SELECT COUNT(*) as total FROM documents d
      INNER JOIN documents_fts fts ON d.id = fts.rowid
      WHERE documents_fts MATCH ?
      ${tag ? "AND d.tags LIKE ?" : ""}
    `
    params = [query]
    if (tag) params.push(`%"${tag}"%`)
    params.push(limit, offset)
  } else if (tag) {
    sql = `
      SELECT * FROM documents
      WHERE tags LIKE ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    countSql = `
      SELECT COUNT(*) as total FROM documents
      WHERE tags LIKE ?
    `
    params = [`%"${tag}"%`, limit, offset]
  } else {
    sql = `
      SELECT * FROM documents
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `
    countSql = `SELECT COUNT(*) as total FROM documents`
    params = [limit, offset]
  }

  const docs = db.prepare(sql).all(...params)
  const { total } = db.prepare(countSql).get(...(query || tag ? params.slice(0, -2) : [])) as { total: number }

  return NextResponse.json({
    documents: docs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = requireAuth()
  if (auth?.error) return auth.error
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || '[]'

    let tags: string[]
    try { tags = JSON.parse(tagsRaw) } catch { tags = [] }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = saveFile(buffer, file.name, file.type)

    const db = getDb()
    const info = db.prepare(`
      INSERT INTO documents (title, description, filename, stored_name, mime_type, size_bytes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      title || file.name.replace(/\.[^/.]+$/, ''),
      description,
      result.originalName,
      result.storedName,
      result.mimeType,
      result.sizeBytes,
      JSON.stringify(tags)
    )

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(info.lastInsertRowid)
    return NextResponse.json(doc, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
