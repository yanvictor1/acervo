import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { saveFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('query') || ''
  const tag = searchParams.get('tag') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let sql: string
  let countSql: string
  let sqlParams: any[]
  let countParams: any[]

  if (search && tag) {
    sql = `SELECT d.* FROM documents d WHERE d.search_vector @@ plainto_tsquery('portuguese', $1) AND d.tags LIKE $2 ORDER BY d.created_at DESC LIMIT $3 OFFSET $4`
    countSql = `SELECT COUNT(*) as total FROM documents d WHERE d.search_vector @@ plainto_tsquery('portuguese', $1) AND d.tags LIKE $2`
    sqlParams = [search, `%"${tag}"%`, limit, offset]
    countParams = [search, `%"${tag}"%`]
  } else if (search) {
    sql = `SELECT d.* FROM documents d WHERE d.search_vector @@ plainto_tsquery('portuguese', $1) ORDER BY d.created_at DESC LIMIT $2 OFFSET $3`
    countSql = `SELECT COUNT(*) as total FROM documents d WHERE d.search_vector @@ plainto_tsquery('portuguese', $1)`
    sqlParams = [search, limit, offset]
    countParams = [search]
  } else if (tag) {
    sql = `SELECT * FROM documents WHERE tags LIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
    countSql = `SELECT COUNT(*) as total FROM documents WHERE tags LIKE $1`
    sqlParams = [`%"${tag}"%`, limit, offset]
    countParams = [`%"${tag}"%`]
  } else {
    sql = `SELECT * FROM documents ORDER BY created_at DESC LIMIT $1 OFFSET $2`
    countSql = `SELECT COUNT(*) as total FROM documents`
    sqlParams = [limit, offset]
    countParams = []
  }

  const docs = await query(sql, sqlParams)
  const totalRow = await queryOne(countSql, countParams) as { total: number } | undefined

  return NextResponse.json({
    documents: docs,
    pagination: {
      page,
      limit,
      total: totalRow?.total || 0,
      totalPages: Math.ceil((totalRow?.total || 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
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

    const rows = await query(
      `INSERT INTO documents (title, description, filename, stored_name, mime_type, size_bytes, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        title || file.name.replace(/\.[^/.]+$/, ''),
        description,
        result.originalName,
        result.storedName,
        result.mimeType,
        result.sizeBytes,
        JSON.stringify(tags),
      ]
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
