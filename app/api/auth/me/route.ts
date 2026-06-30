import { NextResponse } from 'next/server'
import { getSessionToken, validateSession } from '@/lib/auth'

export async function GET() {
  const token = getSessionToken()
  if (!token || !(await validateSession(token))) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true })
}
