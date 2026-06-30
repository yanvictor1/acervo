import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth()
  if (auth?.error) return auth.error

  const db = getDb()
  const userId = getUserId()
  const docId = parseInt(params.id)

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const existing = db.prepare(
    'SELECT * FROM user_favorites WHERE user_id = ? AND document_id = ?'
  ).get(userId, docId)

  if (existing) {
    db.prepare('DELETE FROM user_favorites WHERE user_id = ? AND document_id = ?').run(userId, docId)
    return NextResponse.json({ favorited: false })
  } else {
    db.prepare('INSERT INTO user_favorites (user_id, document_id) VALUES (?, ?)').run(userId, docId)
    return NextResponse.json({ favorited: true })
  }
}
