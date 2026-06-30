import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getSupabase } from './db'

const SESSION_COOKIE = 'session_token'
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(): Promise<string> {
  const supabase = getSupabase()
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE).toISOString()
  await supabase.from('sessions').insert({ token, expires_at: expiresAt })
  return token
}

export async function validateSession(token: string): Promise<boolean> {
  const supabase = getSupabase()
  const { data } = await supabase.from('sessions').select('expires_at').eq('token', token).maybeSingle()
  if (!data) return false
  const expiresAt = new Date(data.expires_at)
  if (expiresAt < new Date()) {
    await supabase.from('sessions').delete().eq('token', token)
    return false
  }
  return true
}

export async function deleteSession(token: string) {
  const supabase = getSupabase()
  await supabase.from('sessions').delete().eq('token', token)
}

export async function cleanExpiredSessions() {
  const supabase = getSupabase()
  await supabase.from('sessions').delete().lt('expires_at', new Date().toISOString())
}

export function getSessionToken(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(SESSION_COOKIE)?.value || null
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE / 1000,
    path: '/',
  })
}

export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
}

export async function requireAuth(): Promise<{ error: Response } | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token || !(await validateSession(token))) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    await cleanExpiredSessions()
    return null
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
}

export function getUserId(): string {
  const cookieStore = cookies()
  const userId = cookieStore.get('user_id')?.value
  if (userId) return userId
  const newId = uuidv4()
  cookieStore.set('user_id', newId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 3600,
    path: '/',
  })
  return newId
}
