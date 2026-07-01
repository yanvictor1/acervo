import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSupabase } from '@/lib/db'

export const dynamic = 'force-dynamic'

const USE_SUPABASE_STORAGE = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

const mimeMap: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf', '.md': 'text/markdown', '.txt': 'text/plain',
  '.csv': 'text/csv', '.json': 'application/json',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav', '.ogg': 'audio/ogg',
  '.html': 'text/html', '.htm': 'text/html',
  '.zip': 'application/zip',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (USE_SUPABASE_STORAGE) {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage
      .from('acervo-files')
      .download(params.id)
    if (error || !data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    const buffer = Buffer.from(await data.arrayBuffer())
    const ext = params.id.substring(params.id.lastIndexOf('.')).toLowerCase()
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeMap[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }

  const filePath = path.join(LOCAL_UPLOAD_DIR, params.id)
  if (!filePath.startsWith(LOCAL_UPLOAD_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  const ext = path.extname(params.id).toLowerCase()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mimeMap[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
