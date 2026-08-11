// Server-only by construction: it reads SUPABASE_SERVICE_ROLE_KEY and imports node:crypto, so a
// client bundle importing this would fail to build rather than leak the key.
import { createHash } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { isPersonalQuery } from '@/utils/aiContext'

/**
 * Cross-instance cache for AI answers.
 *
 * WHY THIS EXISTS: the in-process LRU in responseVault.ts is per-instance. On serverless, two
 * students hitting two lambdas share nothing and instances recycle constantly, so the hit rate
 * of the app's primary cost-control mechanism falls as traffic grows.
 *
 * WHAT MAY BE STORED — the important part. This table is readable by the server on behalf of
 * every user, so an entry in it is effectively published to the whole userbase. An answer is
 * eligible only when all three hold:
 *
 *   1. no study context was attached to the request,
 *   2. the conversation had no history (a follow-up turn is shaped by what came before it,
 *      which is another student's text once the entry is shared), and
 *   3. the question does not read as personal.
 *
 * Crucially, the server decides all three. Previously the safety property rested on a regex
 * running in the browser deciding whether to attach context — a question like "am I ready for
 * my exam Friday?" does not match it, so a personalised answer was eligible for a cache that
 * every other student reads. A client cannot be the arbiter of whether its own data is
 * shareable.
 */

const TTL_MS = 24 * 60 * 60 * 1000
const CACHE_VERSION = 'v1'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
// Server-only. Never NEXT_PUBLIC_ — the service role bypasses RLS, and it is used here precisely
// so that signed-in users cannot write to a table everyone reads.
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let client: SupabaseClient | null = null
let disabledLogged = false
let tableMissingLogged = false

function getClient(): SupabaseClient | null {
  if (client) return client
  if (!URL || URL.includes('placeholder') || !SERVICE_KEY) {
    if (!disabledLogged) {
      disabledLogged = true
      console.warn(
        '[sharedCache] disabled — set SUPABASE_SERVICE_ROLE_KEY (server-only) and apply ' +
          'supabase/migrations/*_ai_response_cache.sql to enable the cross-instance cache. ' +
          'Falling back to the per-instance LRU.',
      )
    }
    return null
  }
  client = createClient(URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return client
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

export interface Turn {
  role: string
  content: string
}

/**
 * Decide, server-side, whether an answer to this request may be shared with other users.
 * Returns false whenever anything about the request is specific to the person asking.
 */
export function isShareable(
  message: string,
  history: Turn[] | undefined,
  hasContext: boolean,
): boolean {
  if (hasContext) return false
  if (history && history.length > 0) return false
  if (isPersonalQuery(message)) return false

  // Second-person/first-person possessives that the narrower progress regex misses:
  // "am I ready for my exam", "review my notes on X", "what did I get wrong".
  if (/\b(my|mine|i'?ve|i'?m|i am|did i|am i|should i)\b/i.test(message)) return false

  return true
}

function keyFor(message: string): string {
  const normalized = message.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
  return `${CACHE_VERSION}:${createHash('sha256').update(normalized).digest('hex').slice(0, 40)}`
}

// ─── Read / write ─────────────────────────────────────────────────────────────

export async function lookupShared(message: string): Promise<string | null> {
  const db = getClient()
  if (!db) return null

  try {
    const { data, error } = await db
      .from('ai_response_cache')
      .select('response, hits')
      .eq('cache_key', keyFor(message))
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error) {
      // Distinguish "cache is empty" from "cache is broken". A miss is silent by design; a
      // failing table must not be, or the tier stays dead and looks like a low hit rate.
      if (!tableMissingLogged) {
        tableMissingLogged = true
        console.warn(
          '[sharedCache] read failed — the cross-instance cache is NOT active. Apply ' +
            'supabase/migrations/*_ai_response_cache.sql. Cause:',
          error.message,
        )
      }
      return null
    }
    if (!data) return null

    // Fire-and-forget: a hit counter is worth having for tuning, never worth delaying a response.
    void db
      .from('ai_response_cache')
      .update({ hits: (data.hits ?? 0) + 1 })
      .eq('cache_key', keyFor(message))
      .then(() => undefined)

    return data.response
  } catch {
    return null
  }
}

export async function storeShared(message: string, response: string, model?: string): Promise<void> {
  const db = getClient()
  if (!db) return
  if (!response.trim()) return

  try {
    await db.from('ai_response_cache').upsert(
      {
        cache_key: keyFor(message),
        response,
        model: model ?? null,
        expires_at: new Date(Date.now() + TTL_MS).toISOString(),
      },
      { onConflict: 'cache_key' },
    )
  } catch {
    // A cache write failing must never fail the request it was meant to speed up.
  }
}
