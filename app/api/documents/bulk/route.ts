import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { deleteFile } from '@/lib/upload'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const auth = requireAuth()
  if (auth?.error) return auth.error
  try {
    const body = await request.json()
    const { ids, action, tag } = body

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No document IDs provided' }, { status: 400 })
    }

    const db = getDb()

    if (action === 'delete') {
      const deleteStmt = db.prepare('SELECT stored_name FROM documents WHERE id = ?')
      for (const id of ids) {
        const doc = deleteStmt.get(id) as { stored_name: string } | undefined
        if (doc) deleteFile(doc.stored_name)
      }

      const placeholders = ids.map(() => '?').join(',')
      db.prepare(`DELETE FROM documents WHERE id IN (${placeholders})`).run(...ids)

      return NextResponse.json({ success: true, deleted: ids.length })
    }

    if (action === 'add_tag' && tag) {
      const placeholders = ids.map(() => '?').join(',')
      const docs = db.prepare(`SELECT * FROM documents WHERE id IN (${placeholders})`).all(...ids) as any[]

      const update = db.prepare('UPDATE documents SET tags = ?, updated_at = datetime(\'now\') WHERE id = ?')
      for (const doc of docs) {
        const tags = new Set(JSON.parse(doc.tags || '[]'))
        tags.add(tag)
        update.run(JSON.stringify([...tags]), doc.id)
      }

      return NextResponse.json({ success: true, updated: docs.length })
    }

    if (action === 'remove_tag' && tag) {
      const placeholders = ids.map(() => '?').join(',')
      const docs = db.prepare(`SELECT * FROM documents WHERE id IN (${placeholders})`).all(...ids) as any[]

      const update = db.prepare('UPDATE documents SET tags = ?, updated_at = datetime(\'now\') WHERE id = ?')
      for (const doc of docs) {
        const tags = (JSON.parse(doc.tags || '[]') as string[]).filter((t: string) => t !== tag)
        update.run(JSON.stringify(tags), doc.id)
      }

      return NextResponse.json({ success: true, updated: docs.length })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
