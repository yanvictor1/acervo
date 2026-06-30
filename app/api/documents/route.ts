import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'
import { saveFile, getFileUrl } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = getSupabase()
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('query') || ''
  const tag = searchParams.get('tag') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
  const offset = (page - 1) * limit

  let queryBuilder = supabase.from('documents').select('*', { count: 'exact' })

  if (search) {
    queryBuilder = queryBuilder.textSearch('search_vector', search, { type: 'plain' })
  }
  if (tag) {
    queryBuilder = queryBuilder.ilike('tags', `%"${tag}"%`)
  }

  const { data: docs, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const documents = (docs || []).map((d: any) => ({ ...d, file_url: getFileUrl(d.stored_name), tags: JSON.parse(d.tags || '[]') }))

  return NextResponse.json({
    documents,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || ''
    const description = (formData.get('description') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || '[]'

    let tags: string[]
    try { tags = JSON.parse(tagsRaw) } catch { tags = [] }

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await saveFile(buffer, file.name, file.type)

    const supabase = getSupabase()
    const { data, error } = await supabase.from('documents').insert({
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      description,
      filename: result.originalName,
      stored_name: result.storedName,
      mime_type: result.mimeType,
      size_bytes: result.sizeBytes,
      tags: JSON.stringify(tags),
    }).select()

    if (error) throw error

    const newDoc = data![0]
    newDoc.file_url = getFileUrl(newDoc.stored_name)
    newDoc.tags = JSON.parse(newDoc.tags || '[]')
    return NextResponse.json(newDoc, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
