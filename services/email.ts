/**
 * Transactional email.
 *
 * Deliberately a plain `fetch` against a provider's HTTP API rather than an SDK: this sends one
 * kind of message, and a dependency that exists to wrap a single POST is a dependency that will
 * need updating for no benefit. Provider is chosen by which key is set, so swapping is an env
 * change, not a code change.
 *
 * Sending is disabled unless a key is present, and says so once — an app that silently no-ops
 * its only retention mechanism looks identical to one nobody wants to come back to.
 */

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Mnemo <reminders@mnemo.app>'

let disabledLogged = false

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_KEY)
}

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

export interface SendResult {
  sent: boolean
  reason?: string
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (!RESEND_KEY) {
    if (!disabledLogged) {
      disabledLogged = true
      console.warn('[email] RESEND_API_KEY not set — reminders are computed but not delivered.')
    }
    return { sent: false, reason: 'not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      return { sent: false, reason: `provider returned ${res.status}: ${detail.slice(0, 200)}` }
    }
    return { sent: true }
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : 'network error' }
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface DueReminderInput {
  name: string
  dueToday: number
  upcomingThisWeek: number
  appUrl: string
}

/**
 * The reminder deliberately leads with the number and links straight into the review session.
 * A digest that requires reading is a digest that gets archived.
 */
export function renderDueReminder(input: DueReminderInput): { subject: string; html: string; text: string } {
  const { name, dueToday, upcomingThisWeek, appUrl } = input
  const cards = `${dueToday} card${dueToday === 1 ? '' : 's'}`
  const subject = `${cards} ready for review`

  const text = [
    `Hi ${name},`,
    ``,
    `${cards} are due today.`,
    upcomingThisWeek > dueToday ? `${upcomingThisWeek} are scheduled across the next 7 days.` : '',
    ``,
    `Review now: ${appUrl}/flashcards`,
    ``,
    `To stop these, turn off reminders in Settings: ${appUrl}/settings`,
  ]
    .filter(Boolean)
    .join('\n')

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f6f5;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#161c1c;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #d3d9d9;border-radius:8px;padding:28px;">
    <p style="margin:0 0 18px;font-size:15px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 6px;font-size:30px;font-weight:700;line-height:1.1;">${dueToday}</p>
    <p style="margin:0 0 20px;font-size:15px;color:#4d5757;">card${dueToday === 1 ? '' : 's'} due today${
      upcomingThisWeek > dueToday ? ` &middot; ${upcomingThisWeek} across the next 7 days` : ''
    }</p>
    <a href="${appUrl}/flashcards" style="display:inline-block;background:#1f5f52;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:6px;font-size:15px;font-weight:600;">Start reviewing</a>
    <p style="margin:24px 0 0;font-size:12px;color:#6f7a79;">Reviewing on time is what keeps the intervals growing. <a href="${appUrl}/settings" style="color:#1f5f52;">Turn off reminders</a></p>
  </div>
</body></html>`

  return { subject, html, text }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
