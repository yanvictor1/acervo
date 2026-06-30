import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = getSupabase()
    await supabase.from('feedback').insert({ message: message.trim() })
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET() {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const supabase = getSupabase()
  const { data } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json(data || [])
}
