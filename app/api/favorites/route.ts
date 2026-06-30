import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { getUserId } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabase()
  const userId = getUserId()

  const { data } = await supabase
    .from('user_favorites')
    .select('document_id')
    .eq('user_id', userId)

  return NextResponse.json((data || []).map((r) => r.document_id))
}
