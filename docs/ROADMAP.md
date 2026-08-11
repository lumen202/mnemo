# 🗺️ Roadmap

> What to build in Mnemo, in the order it should be built.
>
> **Rewritten 2026-08-11.** The previous version of this file described a personal-finance app
> — transactions, budgets, net worth, spending heatmaps — and was never adapted after the
> project became a study tool. It also listed finished work as not-started. None of it applied,
> so none of it was carried over.

---

## Status key

- `[ ]` not started · `[~]` in progress · `[x]` done

Priorities are ordered by **what breaks if it stays undone**, not by size.

---

## The one-line thesis

Mnemo's promise is that it schedules reviews better than a student would themselves. Everything
else — AI generation, analytics, the planner — exists to serve `nextReview`. So correctness in
`utils/srs.ts` outranks every feature on this page, and a feature that assumes a wrong schedule
is worse than no feature.

---

## Stage 1 — Make the schedule correct

Nothing else should ship before this. Both defects were confirmed by executing the scheduler,
not by reading it.

### `[x]` Tests for the scheduler
**Why first:** `utils/srs.ts` is pure, dependency-free and date-injectable — the most testable
module in the codebase, holding the logic that decides whether the product works. There are
currently zero test files in the repo.
**Create:** `utils/srs.test.ts`
**Run:** `npm test` → `node --import tsx --test`
Capture both defects below as failing assertions *before* fixing them.

### `[x]` Day boundaries must be local, not UTC
**Defect:** `toDateString()` is `d.toISOString().split('T')[0]`, which is the UTC calendar day.
Every due date and every "is this due" comparison routes through it.
At UTC+8, any review before 08:00 local reads as *yesterday* — so **a student reviewing in the
morning sees an empty due queue**. West of UTC the error flips and evening reviews schedule a
day late.
**Edit:** `utils/srs.ts → toDateString()` — build from `getFullYear()` / `getMonth()` /
`getDate()`. Single function; every call site already goes through it.

### `[x]` Separate repetitions from lapses
**Defect:** `scheduleReview()` increments `timesReviewed` on every review, pass *or* fail, then
uses that counter as SM-2's repetition number — which means consecutive *successful* recalls.
A card failed four times then passed once is scheduled **10 days out**. The cards a student
knows least get pushed furthest away, which inverts the point of spaced repetition.
The same counter drives promotion (`repetitions % 3 === 0`), so failing twice and passing once
marks a card *easier*.
**Migration:** add `repetitions int not null default 0` and `lapses int not null default 0` to
`public.flashcards`.
**Edit:** `utils/srs.ts` (reset the pass streak on fail), `types/index.ts → Flashcard`,
`services/supabase/repository.ts` (row mapping both ways), `store/index.ts → gradeCard`.

### `[x]` Split per-student ease from AI-assigned difficulty
`difficulty` is both the AI generator's authoring hint and the student's measured performance,
so they overwrite each other. A card the AI called "easy" that a student always fails cannot
represent that state.
**Migration:** `ease numeric not null default 2.5` on `flashcards`.
Keep `difficulty` as a read-only authoring hint. Once these are distinct, adopting FSRS later
is a scheduler swap rather than a schema migration.

---

## Stage 2 — Give the schedule a way to reach the student

### `[x]` Due-card reminders
**Why:** there is no email, push, or notification code anywhere in the app. A spaced-repetition
product whose schedule cannot reach anyone has no mechanism for return visits. This is the
largest retention lever available — and it is worthless before Stage 1, because reminding
someone about a queue computed on the wrong day is worse than silence.
**Create:** `app/api/cron/due-reminders/route.ts` (scheduled), an email sender in `services/`,
and a per-user preference (opt-in, quiet hours, local timezone).
**Note:** the reminder must use the student's local day — the same fix as Stage 1.

---

## Stage 3 — Close the known scale gaps

### `[x]` Authentication on every API route
Nine routes were publicly callable. One shared guard in `lib/auth.ts`, applied via `withAuth`.

### `[x]` Per-user rate limiting
Cost classes (`model` / `lookup` / `upload`) in `lib/rateLimit.ts`, per-instance counter plus a
shared Postgres counter. **Requires `supabase db push`** to activate the shared tier.

### `[x]` Cross-instance response cache
`services/ai/sharedCache.ts`. Also moved the "is this answer shareable" decision server-side —
it previously depended on a browser-side regex, so personal answers could be cached and served
to other students.

### `[x]` Pagination on list queries
20 `.select()` calls in `services/supabase/repository.ts`, zero `.limit()`. Invisible at 12
materials; it becomes the whole experience at 500.

### `[x]` One schema source of truth
The duplicate `services/supabase/schema.sql` had no RLS and still called the product
"StudyMind". Removed; `supabase/migrations/` is authoritative and applied in filename order.

---

## Stage 4 — Growth features

Each of these assumes Stages 1–3 are true.

### `[x]` Offline review (PWA)
No manifest, service worker or IndexedDB today. Reviews are the most offline-friendly operation
in the app: small payloads, queued writes, and students review on transit and in buildings with
bad signal.
**Create:** `app/manifest.ts`, a service worker, an outbox that replays grades on reconnect.

### `[x]` Export and Anki import
No export path exists. Students who cannot get their cards out treat the app as a trial rather
than a home, and Anki import is the cheapest acquisition channel a flashcard app has.

### `[x]` Review forecast
Every interval is stored but the workload ahead is never shown. "34 cards due Thursday" is what
makes a student trust the schedule instead of cramming — and it is a read over existing data.

---

## Deliberately not on this list

Verified present, so not gaps: manual card creation, card edit and delete, quiz retake, search
across materials and flashcards, streak tracking, command palette, error boundaries, toasts,
loading skeletons, theme toggle, route-protection middleware, server-side AI keys.

---

## Operational follow-ups

- `supabase db push` — **five** migrations are written but unapplied: rate limits, response
  cache, flashcard repetitions/lapses, ease + reminder preferences. Until then, limits are
  per-instance, the shared cache is inert, and reminders have no preference table to read.
  Each subsystem logs its own status rather than failing silently.
- `SUPABASE_SERVICE_ROLE_KEY` must be set in the deployment environment, not only locally.
- `CRON_SECRET` must be set, or the reminder job refuses to run — an unauthenticated endpoint
  that sends mail is a spam relay.
- `RESEND_API_KEY` and `EMAIL_FROM` enable delivery. Without them reminders are computed and
  logged but not sent.
- `NEXT_PUBLIC_APP_URL` is used for links inside reminder emails.
