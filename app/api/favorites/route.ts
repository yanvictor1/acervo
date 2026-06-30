import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export async function GET() {
  const userId = getUserId()

  const rows = await query(
    'SELECT document_id FROM user_favorites WHERE user_id = $1',
    [userId]
  ) as { document_id: number }[]

  return NextResponse.json(rows.map((r) => r.document_id))
}
