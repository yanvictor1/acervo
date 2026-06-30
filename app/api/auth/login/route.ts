import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession, setSessionCookie, hashPassword } from '@/lib/auth'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    const hashed = await hashPassword(ADMIN_PASSWORD)
    const valid = await verifyPassword(password, hashed)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = createSession()
    const response = NextResponse.json({ success: true })
    setSessionCookie(token)
    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
