import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const supabase = getSupabase()
  const { data } = await supabase.from('documents').select('id, title, description, tags')

  for (const doc of data || []) {
    // Trigger auto-updates search_vector on update, so we trigger a no-op update
    await supabase.from('documents').update({ title: doc.title }).eq('id', doc.id)
  }

  return NextResponse.json({ success: true })
}
