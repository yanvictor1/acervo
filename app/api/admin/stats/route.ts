import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export async function GET() {
  const total = (await queryOne('SELECT COUNT(*)::int as total FROM documents')) as { total: number }
  const total_size = (await queryOne("SELECT COALESCE(SUM(size_bytes), 0)::int as total_size FROM documents")) as { total_size: number }
  const total_views = (await queryOne("SELECT COALESCE(SUM(views), 0)::int as total_views FROM documents")) as { total_views: number }
  const favorites = (await queryOne("SELECT COUNT(*)::int as favorites FROM documents WHERE is_favorite_admin = 1")) as { favorites: number }
  const feedback_count = (await queryOne("SELECT COUNT(*)::int as feedback_count FROM feedback")) as { feedback_count: number }

  const byType = await query(`
    SELECT
      CASE
        WHEN mime_type = 'application/pdf' THEN 'pdf'
        WHEN mime_type LIKE 'image/%' THEN 'image'
        WHEN mime_type LIKE 'video/%' THEN 'video'
        WHEN mime_type LIKE 'audio/%' THEN 'audio'
        WHEN mime_type IN ('text/markdown', 'text/plain') THEN 'text'
        ELSE 'other'
      END as type,
      COUNT(*)::int as count,
      COALESCE(SUM(size_bytes), 0)::int as total_size
    FROM documents
    GROUP BY type
    ORDER BY count DESC
  `)

  const tagCounts = await query(`
    SELECT value::text as tag, COUNT(*)::int as count
    FROM documents, jsonb_array_elements_text(
      CASE WHEN tags != '[]' THEN tags::jsonb ELSE '[]'::jsonb END
    ) as value
    GROUP BY value
    ORDER BY count DESC
  `)

  return NextResponse.json({
    total: total?.total || 0,
    total_size: total_size?.total_size || 0,
    total_views: total_views?.total_views || 0,
    favorites: favorites?.favorites || 0,
    feedback_count: feedback_count?.feedback_count || 0,
    by_type: byType,
    tag_counts: tagCounts,
  })
}
