import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const rows = db.prepare(`
    SELECT DISTINCT json_each.value as tag
    FROM documents, json_each(documents.tags)
    ORDER BY tag ASC
  `).all() as { tag: string }[]

  return NextResponse.json(rows.map((r) => r.tag))
}
