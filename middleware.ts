import { NextRequest, NextResponse } from 'next/server'

const DASHBOARD_PATHS = [
  '/dashboard', '/materials', '/subjects',
  '/flashcards', '/quizzes', '/planner', '/assistant',
]
const AUTH_PATHS = ['/auth']

// Demo mode: mock auth handles state client-side via Zustand.
// When real Supabase keys are present, this middleware enforces session cookies.
const IS_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (IS_DEMO) return NextResponse.next()

  const session = req.cookies.get('mnemo_session')?.value
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
    '/auth/:path*',
  ],
}
