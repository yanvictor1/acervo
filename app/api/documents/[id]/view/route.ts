import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/db'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const docId = parseInt(params.id)

  if (isNaN(docId)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
  }

  await execute('UPDATE documents SET views = views + 1 WHERE id = $1', [docId])
  return NextResponse.json({ success: true })
}
