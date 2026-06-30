import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDb()
  const docId = parseInt(params.id)

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  db.prepare('UPDATE documents SET views = views + 1 WHERE id = ?').run(docId)
  return NextResponse.json({ success: true })
}
