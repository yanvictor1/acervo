import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicPage =
    pathname.startsWith('/login') ||
    pathname === '/'

  const isStaticResource =
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/uploads/') ||
    pathname === '/favicon.ico'

  if (isPublicPage || isStaticResource) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get('session_token')?.value

  if (!sessionToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
