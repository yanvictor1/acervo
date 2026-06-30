import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'text/markdown': ['.md', '.markdown'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/zip': ['.zip'],
}

export interface UploadResult {
  storedName: string
  originalName: string
  mimeType: string
  sizeBytes: number
}

export function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): UploadResult {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  const ext = path.extname(originalName).toLowerCase()
  const storedName = `${uuidv4()}${ext}`
  const filePath = path.join(UPLOAD_DIR, storedName)

  fs.writeFileSync(filePath, buffer)

  return {
    storedName,
    originalName,
    mimeType,
    sizeBytes: buffer.length,
  }
}

export function deleteFile(storedName: string): boolean {
  const filePath = path.join(UPLOAD_DIR, storedName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

export function getFileUrl(storedName: string): string {
  return `/uploads/${storedName}`
}

export function getFileMimeCategory(mimeType: string): string {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType === 'text/html') return 'html'
  if (mimeType === 'text/markdown' || mimeType === 'text/plain') return 'text'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'other'
}
