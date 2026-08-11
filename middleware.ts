import { NextRequest, NextResponse } from 'next/server'

const DASHBOARD_PATHS = [
  '/dashboard', '/materials', '/subjects',
  '/flashcards', '/quizzes', '/planner', '/assistant', '/settings',
]
const AUTH_PATHS = ['/auth']

// Demo mode: mock auth handles state client-side via Zustand.
// When real Supabase keys are present, this middleware enforces session cookies.
const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

/**
 * Structural check on the session cookie: is this a JWT, and is it still within its own
 * expiry? Previously any non-empty cookie value passed, so `document.cookie =
 * 'mnemo_session=x'` in devtools rendered the dashboard shell.
 *
 * This deliberately does NOT verify the signature — that needs a network round-trip to
 * Supabase, and paying it on every navigation would tax page loads to protect a shell that
 * holds no data. It is a UX gate. The security boundaries are lib/auth.ts (which does verify,
 * on every API call) and Postgres RLS (which owns the data). A forged cookie gets an empty
 * dashboard and a 401 from every endpoint behind it.
 */
function looksLikeLiveSession(token: string | undefined): boolean {
  if (!token) return false

  const parts = token.split('.')
  if (parts.length !== 3) return false

  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number }
    // A JWT with no exp is not something Supabase issues; treat it as forged.
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (IS_DEMO) return NextResponse.next()

  const session = looksLikeLiveSession(req.cookies.get('mnemo_session')?.value)
    ? req.cookies.get('mnemo_session')?.value
    : undefined
  const isDashboard = DASHBOARD_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (isDashboard && !session) {
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuth && session) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/materials/:path*',
    '/subjects/:path*',
    '/flashcards/:path*',
    '/quizzes/:path*',
    '/planner/:path*',
    '/assistant/:path*',
    '/settings/:path*',
    '/auth/:path*',
  ],
}
