import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const db = getDb()
  const userId = getUserId()

  const rows = db.prepare(
    'SELECT document_id FROM user_favorites WHERE user_id = ?'
  ).all(userId) as { document_id: number }[]

  return NextResponse.json(rows.map((r) => r.document_id))
}
