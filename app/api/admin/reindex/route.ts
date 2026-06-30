import { NextResponse } from 'next/server'
import { execute } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST() {
  const auth = await requireAuth()
  if (auth?.error) return auth.error
  await execute(`
    UPDATE documents SET search_vector = to_tsvector('portuguese', COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(tags, ''))
  `)
  return NextResponse.json({ success: true })
}
