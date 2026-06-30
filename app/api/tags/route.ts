import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  const rows = await query(`
    SELECT DISTINCT value::text as tag
    FROM documents, jsonb_array_elements_text(
      CASE WHEN tags != '[]' THEN tags::jsonb ELSE '[]'::jsonb END
    ) as value
    ORDER BY tag ASC
  `) as { tag: string }[]

  return NextResponse.json(rows.map((r) => r.tag))
}
