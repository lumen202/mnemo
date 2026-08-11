import { supabase } from './client'

/**
 * Reminder preferences.
 *
 * Read and written with the user's own session, so RLS scopes every call — the cron job is the
 * only thing that reads across users, and it uses the service role.
 */

export interface NotificationPrefs {
  emailEnabled: boolean
  /** IANA zone. The reminder has to land in the student's morning, not the server's. */
  timezone: string
  /** Local hour, 0–23. */
  sendHour: number
}

export const DEFAULT_PREFS: NotificationPrefs = {
  emailEnabled: false,
  timezone: 'UTC',
  sendHour: 8,
}

/** The browser's own zone, which is the only correct default for a new user. */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs> {
  const { data, error } = await supabase
    .from('notification_prefs')
    .select('email_enabled, timezone, send_hour')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return { ...DEFAULT_PREFS, timezone: detectTimezone() }

  return {
    emailEnabled: data.email_enabled,
    timezone: data.timezone,
    sendHour: data.send_hour,
  }
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs,
): Promise<void> {
  const { error } = await supabase.from('notification_prefs').upsert(
    {
      user_id: userId,
      email_enabled: prefs.emailEnabled,
      timezone: prefs.timezone,
      send_hour: prefs.sendHour,
    },
    { onConflict: 'user_id' },
  )

  if (error) throw error
}
