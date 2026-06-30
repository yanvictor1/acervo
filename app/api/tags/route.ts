import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabase()
  const { data } = await supabase.from('documents').select('tags')

  const tagSet = new Set<string>()
  for (const doc of data || []) {
    try {
      const tags = JSON.parse(doc.tags || '[]')
      for (const tag of tags) tagSet.add(tag)
    } catch {}
  }

  return NextResponse.json([...tagSet].sort())
}
