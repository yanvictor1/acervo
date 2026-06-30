import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const doc = await queryOne('SELECT * FROM documents WHERE id = $1', [params.id]) as any

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
  const auth = await requireAuth()
  if (auth?.error) return auth.error
  try {
    const doc = await queryOne('SELECT * FROM documents WHERE id = $1', [params.id]) as any

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const body = await request.json()
    const sets: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.title !== undefined) {
      sets.push(`title = $${paramIndex++}`)
      values.push(body.title)
    }
    if (body.description !== undefined) {
      sets.push(`description = $${paramIndex++}`)
      values.push(body.description)
    }
    if (body.tags !== undefined) {
      sets.push(`tags = $${paramIndex++}`)
      values.push(JSON.stringify(body.tags))
    }
    if (body.is_favorite_admin !== undefined) {
      sets.push(`is_favorite_admin = $${paramIndex++}`)
      values.push(body.is_favorite_admin ? 1 : 0)
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    sets.push(`updated_at = NOW()`)
    values.push(params.id)

    await execute(
      `UPDATE documents SET ${sets.join(', ')} WHERE id = $${paramIndex}`,
      values
    )

    const updated = await queryOne('SELECT * FROM documents WHERE id = $1', [params.id]) as any
    return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags || '[]') })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error
  const doc = await queryOne('SELECT * FROM documents WHERE id = $1', [params.id]) as any

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  deleteFile(doc.stored_name)
  await execute('DELETE FROM documents WHERE id = $1', [params.id])

  return NextResponse.json({ success: true })
}
