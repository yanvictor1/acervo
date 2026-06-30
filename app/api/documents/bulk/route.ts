import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  try {
    const body = await request.json()
    const { ids, action, tag } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 })
    }

    const supabase = getSupabase()

    if (action === 'delete') {
      for (const id of ids) {
        const delRes = await supabase.from('documents').select('stored_name').eq('id', id).maybeSingle()
        const doc: any = delRes.data
        if (doc) await deleteFile(doc.stored_name)
      }
      await supabase.from('documents').delete().in('id', ids)
      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === 'add_tag' && tag) {
      const addRes = await supabase.from('documents').select('id, tags').in('id', ids)
      const addDocs: any[] = addRes.data || []
      for (const doc of addDocs) {
        const tags = new Set(JSON.parse(doc.tags || '[]'))
        tags.add(tag)
        await supabase.from('documents').update({ tags: JSON.stringify([...tags]) }).eq('id', doc.id)
      }
      return NextResponse.json({ success: true, updated: addDocs.length })
    }

    if (action === 'remove_tag' && tag) {
      const remRes = await supabase.from('documents').select('id, tags').in('id', ids)
      const remDocs: any[] = remRes.data || []
      for (const doc of remDocs) {
        const tags = (JSON.parse(doc.tags || '[]') as string[]).filter((t: string) => t !== tag)
        await supabase.from('documents').update({ tags: JSON.stringify(tags) }).eq('id', doc.id)
      }
      return NextResponse.json({ success: true, updated: remDocs.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
