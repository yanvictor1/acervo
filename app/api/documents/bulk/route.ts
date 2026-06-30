import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, execute } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = await requireAuth()
  if (auth?.error) return auth.error
  try {
    const body = await request.json()
    const { ids, action, tag } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 })
    }

    if (action === 'delete') {
      for (const id of ids) {
        const doc = await queryOne('SELECT stored_name FROM documents WHERE id = $1', [id]) as any
        if (doc) deleteFile(doc.stored_name)
      }

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
      await execute(`DELETE FROM documents WHERE id IN (${placeholders})`, ids)
      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === 'add_tag' && tag) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
      const docs = await query(`SELECT * FROM documents WHERE id IN (${placeholders})`, ids) as any[]

      for (const doc of docs) {
        const tags = new Set(JSON.parse(doc.tags || '[]'))
        tags.add(tag)
        await execute('UPDATE documents SET tags = $1 WHERE id = $2', [JSON.stringify([...tags]), doc.id])
      }

      return NextResponse.json({ success: true, updated: docs.length })
    }

    if (action === 'remove_tag' && tag) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
      const docs = await query(`SELECT * FROM documents WHERE id IN (${placeholders})`, ids) as any[]

      for (const doc of docs) {
        const tags = (JSON.parse(doc.tags || '[]') as string[]).filter((t: string) => t !== tag)
        await execute('UPDATE documents SET tags = $1 WHERE id = $2', [JSON.stringify(tags), doc.id])
      }

      return NextResponse.json({ success: true, updated: docs.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
