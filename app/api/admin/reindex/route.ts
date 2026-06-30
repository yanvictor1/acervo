import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const supabase = getSupabase()
  const { data } = await supabase.from('documents').select('id')

  for (const doc of data || []) {
    await supabase.from('documents').update({ updated_at: new Date().toISOString() }).eq('id', doc.id)
  }

  return NextResponse.json({ success: true })
}
