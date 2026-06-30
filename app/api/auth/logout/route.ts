import { NextResponse } from 'next/server'
import { deleteSession, getSessionToken, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  const token = await getSessionToken()
  if (token) {
    deleteSession(token)
  }
  const response = NextResponse.json({ success: true })
  clearSessionCookie()
  return response
}
