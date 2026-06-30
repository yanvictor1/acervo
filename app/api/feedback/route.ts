import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const db = getDb()
    db.prepare('INSERT INTO feedback (message) VALUES (?)').run(message.trim())
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET() {
  const auth = requireAuth()
  if (auth?.error) return auth.error

  const db = getDb()
  const items = db.prepare('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50').all()
  return NextResponse.json(items)
}
