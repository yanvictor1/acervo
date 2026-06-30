import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { getUserId, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const supabase = getSupabase()
  const userId = getUserId()
  const docId = parseInt(params.id)

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .eq('document_id', docId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('document_id', docId)
    return NextResponse.json({ favorited: false })
  } else {
    await supabase
      .from('user_favorites')
      .insert({ user_id: userId, document_id: docId })
    return NextResponse.json({ favorited: true })
  }
}
