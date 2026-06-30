import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase()
  const docRes = await supabase.from('documents').select('*').eq('id', params.id).maybeSingle()
  const doc: any = docRes.data

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json({ ...doc, tags: JSON.parse(doc.tags || '[]') })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  try {
    const supabase = getSupabase()
    const getRes = await supabase.from('documents').select('*').eq('id', params.id).maybeSingle()
    const doc: any = getRes.data
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: Record<string, any> = {}

    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.tags !== undefined) updates.tags = JSON.stringify(body.tags)
    if (body.is_favorite_admin !== undefined) updates.is_favorite_admin = body.is_favorite_admin ? 1 : 0

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updRes = await supabase.from('documents').update(updates).eq('id', params.id).select()
    const updated: any = updRes.data?.[0]
    if (!updated) throw new Error('Update failed')

    return NextResponse.json({ ...updated, tags: JSON.parse(updated.tags || '[]') })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  const supabase = getSupabase()
  const delRes = await supabase.from('documents').select('stored_name').eq('id', params.id).maybeSingle()
  const doc: any = delRes.data

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  deleteFile(doc.stored_name)
  await supabase.from('documents').delete().eq('id', params.id)

  return NextResponse.json({ success: true })
}
