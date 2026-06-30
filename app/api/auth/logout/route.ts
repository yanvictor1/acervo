import { NextResponse } from 'next/server'
import { deleteSession, getSessionToken, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  const token = getSessionToken()
  if (token) {
    await deleteSession(token)
  }
  const response = NextResponse.json({ success: true })
  clearSessionCookie()
  return response
}
