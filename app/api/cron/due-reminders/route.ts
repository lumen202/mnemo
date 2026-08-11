import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { renderDueReminder, sendEmail, isEmailConfigured } from '@/services/email'

/**
 * Hourly job that emails students whose cards are due.
 *
 * NOT wrapped in withAuth: there is no user session on a cron invocation. It authenticates with
 * a shared secret instead, and refuses to run without one — an unauthenticated endpoint that
 * sends mail is a spam relay.
 *
 * It runs hourly rather than daily because "8am" is 24 different instants across a userbase.
 * Each run selects only the students whose local clock currently reads their chosen hour, and
 * `last_sent_on` (a local calendar day) makes a repeat run within the same day a no-op.
 */

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://mnemo.app'

/** The student's current local hour and calendar day, from an IANA zone. */
function localNow(timezone: string): { hour: number; day: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(new Date())

    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
    const hour = Number(get('hour'))
    const day = `${get('year')}-${get('month')}-${get('day')}`
    if (Number.isNaN(hour) || day.includes('undefined')) return null
    return { hour, day }
  } catch {
    // An invalid IANA zone must skip that student, not fail the whole run.
    return null
  }
}

export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 })
  }

  const provided =
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    req.nextUrl.searchParams.get('secret')

  if (provided !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return NextResponse.json({ error: 'Supabase service credentials are not configured' }, { status: 503 })
  }

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  const { data: prefs, error } = await db
    .from('notification_prefs')
    .select('user_id, timezone, send_hour, last_sent_on')
    .eq('email_enabled', true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const report = { considered: prefs?.length ?? 0, due: 0, sent: 0, skipped: 0, failed: 0 }

  for (const pref of prefs ?? []) {
    const now = localNow(pref.timezone)
    if (!now) {
      report.skipped++
      continue
    }

    // Not their hour yet, or already written to today.
    if (now.hour !== pref.send_hour || pref.last_sent_on === now.day) {
      report.skipped++
      continue
    }

    // Due against the STUDENT's calendar day, not the server's — the same distinction the
    // scheduler makes. Counting against a UTC day would email the wrong queue.
    const { count: dueToday } = await db
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', pref.user_id)
      .or(`next_review.lte.${now.day},next_review.is.null`)

    if (!dueToday) {
      // Nothing due is not a failure, and is not worth an email. Still stamp the day so we do
      // not re-check this student every hour until midnight.
      await db.from('notification_prefs').update({ last_sent_on: now.day }).eq('user_id', pref.user_id)
      report.skipped++
      continue
    }

    report.due++

    const weekEnd = new Date(`${now.day}T00:00:00Z`)
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)
    const { count: upcoming } = await db
      .from('flashcards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', pref.user_id)
      .lte('next_review', weekEnd.toISOString().slice(0, 10))

    const { data: userData } = await db.auth.admin.getUserById(pref.user_id)
    const email = userData?.user?.email
    if (!email) {
      report.skipped++
      continue
    }

    const name = (userData?.user?.user_metadata?.name as string | undefined) ?? email.split('@')[0]
    const message = renderDueReminder({
      name,
      dueToday,
      upcomingThisWeek: upcoming ?? dueToday,
      appUrl: APP_URL,
    })

    const result = await sendEmail({ to: email, ...message })
    if (result.sent) {
      report.sent++
      await db.from('notification_prefs').update({ last_sent_on: now.day }).eq('user_id', pref.user_id)
    } else {
      // Do NOT stamp last_sent_on: a delivery failure should be retried on the next hourly run
      // within the same local day, not swallowed until tomorrow.
      report.failed++
    }
  }

  return NextResponse.json({
    ok: true,
    emailConfigured: isEmailConfigured(),
    ...report,
  })
}
