import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { consume, limitHeaders, type CostClass } from '@/lib/rateLimit'

/**
 * Server-side authentication for API routes.
 *
 * Every /api handler runs through `withAuth` from this file. It exists as one shared
 * implementation on purpose: the guard was previously absent from all nine routes, and a
 * per-route copy would drift the moment one route is edited and its siblings are not.
 *
 * Trust model — three layers, only two of which are boundaries:
 *   1. middleware.ts   — structural token check. A UX gate that stops obviously-forged cookies
 *                        from rendering the dashboard shell. NOT a security boundary: it does
 *                        not verify the signature.
 *   2. this file       — authoritative. Asks Supabase to validate the JWT, so a forged or
 *                        expired token cannot reach an AI agent or spend model credits.
 *   3. Postgres RLS    — the boundary for data. `auth.uid() = user_id` on every table.
 */

export const SESSION_COOKIE = 'mnemo_session'
export const DEMO_USER_ID = 'user_demo'

// ─── Config, validated where it is loaded ─────────────────────────────────────
// A malformed SUPABASE_URL otherwise surfaces as an opaque fetch failure inside a request,
// far from the env var that caused it.
const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function resolveConfig(): { url: string; key: string } | null {
  if (!RAW_URL || RAW_URL.includes('placeholder') || !ANON_KEY || ANON_KEY.includes('placeholder')) {
    return null
  }
  try {
    new URL(RAW_URL)
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL is not an absolute URL (got "${RAW_URL}"). ` +
        'Set it to the full https://<ref>.supabase.co origin.',
    )
  }
  return { url: RAW_URL, key: ANON_KEY }
}

const CONFIG = resolveConfig()

/** True when real Supabase credentials are present. False means demo mode. */
export function isAuthConfigured(): boolean {
  return CONFIG !== null
}

// One client for token validation. Never persists a session — each call is stateless and
// carries its own bearer token.
const authClient = CONFIG
  ? createClient(CONFIG.url, CONFIG.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null

// ─── Identity ─────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | null
  isDemo: boolean
}

/**
 * Pull the access token from the request. Accepts an Authorization header as well as the
 * cookie, so a future native client or server-to-server caller needs no new code path.
 */
export function readAccessToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (header?.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim()
    if (token) return token
  }
  const cookie = req.cookies.get(SESSION_COOKIE)?.value
  return cookie && cookie.trim() ? cookie.trim() : null
}

/**
 * Resolve the caller's identity, or null if they have none.
 *
 * In demo mode there is no real identity to resolve, so a fixed demo user is returned. That
 * keeps local development and the public demo working without a Supabase project, and it is
 * safe because demo mode also means no real user data exists to expose.
 */
export async function authenticate(req: NextRequest): Promise<AuthUser | null> {
  if (!authClient) {
    return { id: DEMO_USER_ID, email: null, isDemo: true }
  }

  const token = readAccessToken(req)
  if (!token) return null

  const { data, error } = await authClient.auth.getUser(token)
  if (error || !data.user) return null

  return { id: data.user.id, email: data.user.email ?? null, isDemo: false }
}

// ─── Route wrapper ────────────────────────────────────────────────────────────

export type AuthedHandler = (req: NextRequest, user: AuthUser) => Promise<Response> | Response

export interface GuardOptions {
  /**
   * Which budget this route spends from. Defaults to the strictest class, so a route added
   * later without an explicit choice is metered conservatively rather than generously.
   */
  cost?: CostClass
}

/**
 * Wrap a route handler so it only runs for an authenticated caller who is within budget.
 *
 *   export const POST = withAuth(async (req, user) => { ... }, { cost: 'model' })
 *
 * Both concerns live here rather than in the routes, and deliberately so: identity and
 * accounting written in some entry paths and not others misclassify exactly the callers who
 * arrive by the path nobody remembered. One choke point, no exceptions.
 *
 * The handler receives the verified user, so routes never re-derive identity from the body —
 * a client-supplied user id is not evidence of anything.
 */
export function withAuth(handler: AuthedHandler, options: GuardOptions = {}) {
  const cost: CostClass = options.cost ?? 'model'

  return async function guarded(req: NextRequest): Promise<Response> {
    const user = await authenticate(req)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const budget = await consume(user.id, cost, readAccessToken(req))
    const headers = limitHeaders(budget)

    if (!budget.allowed) {
      const retryAfter = Math.max(1, Math.ceil((budget.resetAt - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          detail: `You have used your allowance of ${budget.limit} requests. Try again in ${Math.ceil(retryAfter / 60)} minute(s).`,
        },
        {
          status: 429,
          headers: { ...headers, 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' },
        },
      )
    }

    const response = await handler(req, user)
    for (const [k, v] of Object.entries(headers)) response.headers.set(k, v)
    return response
  }
}
