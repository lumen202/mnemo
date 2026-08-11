import { createClient } from '@supabase/supabase-js'

/**
 * Per-user rate limiting for API routes.
 *
 * Two layers, both always applied, because they fail in different directions:
 *
 *   memory   — a per-process counter. Correct only for a single instance, but free, instant,
 *              and impossible to disable. On serverless this under-counts (each instance keeps
 *              its own tally), so it is a backstop, not the budget.
 *   postgres — an atomic counter in the database, shared by every instance. This is the real
 *              budget. Requires the migration in supabase/migrations that creates
 *              `consume_rate_limit`; until that is applied the call fails and we fall back to
 *              memory rather than letting traffic through unmetered.
 *
 * A request must pass BOTH. Memory is checked first so an abusive caller hitting one instance
 * is rejected without touching the database.
 */

const RAW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const HAS_SUPABASE = Boolean(
  RAW_URL && !RAW_URL.includes('placeholder') && ANON_KEY && !ANON_KEY.includes('placeholder'),
)

// ─── Cost classes ─────────────────────────────────────────────────────────────
// Endpoints do not cost the same thing, so they must not share a budget. A generous allowance
// for free encyclopedia lookups would be a reckless one for paid model calls.

export type CostClass = 'model' | 'lookup' | 'upload'

export interface LimitPolicy {
  limit: number
  windowSeconds: number
}

export const POLICIES: Record<CostClass, LimitPolicy> = {
  // Paid model calls. This is the number that bounds the monthly bill.
  model: { limit: 40, windowSeconds: 60 * 60 },
  // Free public APIs (Wikipedia, Wiktionary, arXiv). Limited to protect those services and to
  // stop the endpoints being used as an open proxy — not because they cost us money.
  lookup: { limit: 180, windowSeconds: 60 * 60 },
  // PDF text extraction: no API cost, but CPU- and memory-bound in-process.
  upload: { limit: 30, windowSeconds: 60 * 60 },
}

export interface LimitResult {
  allowed: boolean
  limit: number
  remaining: number
  /** Unix ms when the current window ends. */
  resetAt: number
  source: 'memory' | 'postgres'
}

// ─── Layer 1: per-process counter ─────────────────────────────────────────────

interface Window {
  count: number
  resetAt: number
}

const buckets = new Map<string, Window>()

// Bound the map so a long-lived instance cannot accumulate a window per user forever.
function prune(now: number): void {
  if (buckets.size < 5000) return
  for (const [key, w] of buckets) {
    if (w.resetAt <= now) buckets.delete(key)
  }
}

function consumeMemory(key: string, policy: LimitPolicy): LimitResult {
  const now = Date.now()
  prune(now)

  const windowMs = policy.windowSeconds * 1000
  const existing = buckets.get(key)
  const window: Window =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: Math.floor(now / windowMs) * windowMs + windowMs }

  window.count += 1
  buckets.set(key, window)

  return {
    allowed: window.count <= policy.limit,
    limit: policy.limit,
    remaining: Math.max(policy.limit - window.count, 0),
    resetAt: window.resetAt,
    source: 'memory',
  }
}

// ─── Layer 2: shared counter in Postgres ──────────────────────────────────────

let pgUnavailableLogged = false

async function consumePostgres(
  bucket: string,
  policy: LimitPolicy,
  accessToken: string,
): Promise<LimitResult | null> {
  if (!HAS_SUPABASE) return null

  try {
    // The token is what identifies the user: the RPC reads auth.uid() itself rather than
    // trusting a caller-supplied id.
    const client = createClient(RAW_URL as string, ANON_KEY as string, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    })

    const { data, error } = await client.rpc('consume_rate_limit', {
      p_bucket: bucket,
      p_limit: policy.limit,
      p_window_seconds: policy.windowSeconds,
    })

    if (error || !data) {
      if (!pgUnavailableLogged) {
        pgUnavailableLogged = true
        console.warn(
          '[rateLimit] shared counter unavailable, falling back to per-instance limits. ' +
            'Apply supabase/migrations/*_rate_limits.sql to enable it. Cause:',
          error?.message ?? 'no rows returned',
        )
      }
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null

    return {
      allowed: Boolean(row.allowed),
      limit: policy.limit,
      remaining: Number(row.remaining ?? 0),
      resetAt: new Date(row.reset_at).getTime(),
      source: 'postgres',
    }
  } catch (err) {
    if (!pgUnavailableLogged) {
      pgUnavailableLogged = true
      console.warn('[rateLimit] shared counter threw, using per-instance limits:', err)
    }
    return null
  }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function consume(
  userId: string,
  cost: CostClass,
  accessToken: string | null,
): Promise<LimitResult> {
  const policy = POLICIES[cost]
  const key = `${userId}:${cost}`

  const memory = consumeMemory(key, policy)
  if (!memory.allowed) return memory

  if (!accessToken) return memory

  const shared = await consumePostgres(cost, policy, accessToken)
  return shared ?? memory
}

/** Headers every guarded response carries, so clients can back off before being refused. */
export function limitHeaders(result: LimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  }
}
