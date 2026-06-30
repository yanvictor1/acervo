import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = getSupabase()

  const { count: total } = await supabase.from('documents').select('*', { count: 'exact', head: true })
  const sizeRes = await supabase.from('documents').select('size_bytes')
  const sizeData: any[] = sizeRes.data || []
  const total_size = sizeData.reduce((s: number, d: any) => s + (d.size_bytes || 0), 0)

  const viewRes = await supabase.from('documents').select('views')
  const viewData: any[] = viewRes.data || []
  const total_views = viewData.reduce((s: number, d: any) => s + (d.views || 0), 0)

  const { count: favorites } = await supabase.from('documents').select('*', { count: 'exact', head: true }).eq('is_favorite_admin', 1)
  const { count: feedback_count } = await supabase.from('feedback').select('*', { count: 'exact', head: true })

  const docsRes = await supabase.from('documents').select('mime_type, size_bytes')
  const docs: any[] = docsRes.data || []
  const byTypeMap: Record<string, { count: number; total_size: number }> = {}
  for (const doc of docs) {
    let type = 'other'
    if (doc.mime_type === 'application/pdf') type = 'pdf'
    else if (doc.mime_type.startsWith('image/')) type = 'image'
    else if (doc.mime_type.startsWith('video/')) type = 'video'
    else if (doc.mime_type.startsWith('audio/')) type = 'audio'
    else if (['text/markdown', 'text/plain'].includes(doc.mime_type)) type = 'text'
    if (!byTypeMap[type]) byTypeMap[type] = { count: 0, total_size: 0 }
    byTypeMap[type].count++
    byTypeMap[type].total_size += doc.size_bytes || 0
  }
  const byType = Object.entries(byTypeMap)
    .map(([type, data]) => ({ type, count: data.count, total_size: data.total_size }))
    .sort((a, b) => b.count - a.count)

  const tagDataRes = await supabase.from('documents').select('tags')
  const tagData: any[] = tagDataRes.data || []
  const tagCountMap: Record<string, number> = {}
  for (const doc of tagData) {
    try {
      const tags = JSON.parse(doc.tags || '[]')
      for (const tag of tags) tagCountMap[tag] = (tagCountMap[tag] || 0) + 1
    } catch {}
  }
  const tagCounts = Object.entries(tagCountMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({
    total: total || 0,
    total_size,
    total_views,
    favorites: favorites || 0,
    feedback_count: feedback_count || 0,
    by_type: byType,
    tag_counts: tagCounts,
  })
}
