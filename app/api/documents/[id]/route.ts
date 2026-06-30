import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb()
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.id) as any

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const tags = JSON.parse(doc.tags || '[]')
  return NextResponse.json({ ...doc, tags })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth()
  if (auth?.error) return auth.error
  try {
    const db = getDb()
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.id) as any

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: string[] = []
    const values: any[] = []

    if (body.title !== undefined) {
      updates.push('title = ?')
      values.push(body.title)
    }
    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description)
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?')
      values.push(JSON.stringify(body.tags))
    }
    if (body.is_favorite_admin !== undefined) {
      updates.push('is_favorite_admin = ?')
      values.push(body.is_favorite_admin ? 1 : 0)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push("updated_at = datetime('now')")
    values.push(params.id)

    db.prepare(`UPDATE documents SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.id) as any
    return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags || '[]') })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth()
  if (auth?.error) return auth.error
  const db = getDb()
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(params.id) as any

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  deleteFile(doc.stored_name)
  db.prepare('DELETE FROM documents WHERE id = ?').run(params.id)

  return NextResponse.json({ success: true })
}
