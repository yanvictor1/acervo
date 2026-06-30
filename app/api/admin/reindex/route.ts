import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST() {
  const auth = requireAuth()
  if (auth?.error) return auth.error
  const db = getDb()
  db.exec(`
    INSERT INTO documents_fts(documents_fts) VALUES('rebuild');
    INSERT INTO documents_fts(documents_fts) VALUES('optimize');
  `)
  return NextResponse.json({ success: true })
}
