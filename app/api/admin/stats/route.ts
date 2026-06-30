import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const { total } = db.prepare('SELECT COUNT(*) as total FROM documents').get() as { total: number }
  const { total_size } = db.prepare('SELECT COALESCE(SUM(size_bytes), 0) as total_size FROM documents').get() as { total_size: number }
  const { total_views } = db.prepare('SELECT COALESCE(SUM(views), 0) as total_views FROM documents').get() as { total_views: number }
  const { favorites } = db.prepare('SELECT COUNT(*) as favorites FROM documents WHERE is_favorite_admin = 1').get() as { favorites: number }
  const { feedback_count } = db.prepare('SELECT COUNT(*) as feedback_count FROM feedback').get() as { feedback_count: number }

  const byType = db.prepare(`
    SELECT
      CASE
        WHEN mime_type = 'application/pdf' THEN 'pdf'
        WHEN mime_type LIKE 'image/%' THEN 'image'
        WHEN mime_type LIKE 'video/%' THEN 'video'
        WHEN mime_type LIKE 'audio/%' THEN 'audio'
        WHEN mime_type IN ('text/markdown', 'text/plain') THEN 'text'
        ELSE 'other'
      END as type,
      COUNT(*) as count,
      COALESCE(SUM(size_bytes), 0) as total_size
    FROM documents
    GROUP BY type
    ORDER BY count DESC
  `).all()

  const tagCounts = db.prepare(`
    SELECT json_each.value as tag, COUNT(*) as count
    FROM documents, json_each(documents.tags)
    GROUP BY tag
    ORDER BY count DESC
  `).all()

  return NextResponse.json({ total, total_size, total_views, favorites, feedback_count, by_type: byType, tag_counts: tagCounts })
}
