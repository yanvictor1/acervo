import { NextRequest, NextResponse } from 'next/server'
import { queryOne, execute } from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const userId = getUserId()
  const docId = parseInt(params.id)

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const existing = await queryOne(
    'SELECT * FROM user_favorites WHERE user_id = $1 AND document_id = $2',
    [userId, docId]
  )

  if (existing) {
    await execute('DELETE FROM user_favorites WHERE user_id = $1 AND document_id = $2', [userId, docId])
    return NextResponse.json({ favorited: false })
  } else {
    await execute('INSERT INTO user_favorites (user_id, document_id) VALUES ($1, $2)', [userId, docId])
    return NextResponse.json({ favorited: true })
  }
}
