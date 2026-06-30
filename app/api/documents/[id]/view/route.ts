import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const docId = parseInt(params.id)
  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data } = await supabase.from('documents').select('views').eq('id', docId).maybeSingle()
  if (data) {
    await supabase.from('documents').update({ views: (data.views || 0) + 1 }).eq('id', docId)
  }

  return NextResponse.json({ success: true })
}
