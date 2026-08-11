-- Two changes that both follow from the same idea: a card's schedule belongs to the student,
-- not to the generator, and the schedule is worthless if it cannot reach them.

-- ─── 1. Per-student ease ──────────────────────────────────────────────────────
-- `difficulty` is what the AI decided when it authored the card, once. `ease` is what this
-- student's actual performance says about it, and moves on every review. Sharing one column
-- meant the model's guess and the student's experience overwrote each other.

alter table public.flashcards
  add column if not exists ease numeric(4, 2) not null default 2.5;

comment on column public.flashcards.ease is
  'This student''s ease factor for this card (SM-2 EF), 1.30–2.80. Moves on every review. Distinct from `difficulty`, which is the generator''s authoring hint and does not change.';

-- Seed each existing card from the tier it was authored at, matching STARTING_EASE in utils/srs.ts.
update public.flashcards
   set ease = case difficulty
                when 'easy'   then 2.5
                when 'medium' then 2.0
                when 'hard'   then 1.5
                else 2.0
              end
 where ease = 2.5;

-- ─── 2. Reminder preferences ──────────────────────────────────────────────────
-- Opt-in by default-off. A study app that emails without being asked is a study app people
-- unsubscribe from.

create table if not exists public.notification_prefs (
  user_id        uuid        primary key references auth.users(id) on delete cascade,
  email_enabled  boolean     not null default false,
  -- IANA zone, e.g. 'Asia/Manila'. The whole point of the reminder is that it lands in the
  -- student's morning, which is not derivable from the server's clock.
  timezone       text        not null default 'UTC',
  -- Local hour (0–23) to send at.
  send_hour      int         not null default 8 check (send_hour between 0 and 23),
  last_sent_on   date,
  created_at     timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

create policy "Users can manage own notification prefs"
  on public.notification_prefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- `last_sent_on` is a local calendar day, and it is what makes the cron idempotent: the job may
-- run every hour, but a student is only written to once per their own day.
comment on column public.notification_prefs.last_sent_on is
  'Local calendar day of the last reminder sent. Guards against duplicate sends when the cron runs more often than daily.';
