-- Separate "consecutive successful recalls" from "reviews attempted".
--
-- The scheduler read SM-2's repetition number from `times_reviewed`, which increments on every
-- review including failures. Forgetting a card therefore advanced its schedule: a card failed
-- four times and then passed once was scheduled ten days out. The cards a student knew least
-- were pushed furthest away.
--
-- `times_reviewed` is kept as-is — it is a meaningful lifetime counter for display. It is simply
-- no longer the scheduling input.

alter table public.flashcards
  add column if not exists repetitions int not null default 0,
  add column if not exists lapses      int not null default 0;

comment on column public.flashcards.repetitions is
  'Consecutive successful recalls. Any failed review resets this to 0. This is the scheduler''s interval input.';
comment on column public.flashcards.lapses is
  'Lifetime failed reviews. A high count marks a leech worth resurfacing or rewriting.';

-- Backfill: existing cards have no pass/fail history to recover, so the honest reconstruction is
-- to treat a card as having whatever streak its current schedule implies. A card that has never
-- been reviewed keeps 0; a reviewed card is credited with one successful repetition so it is not
-- treated as brand new, and its next interval is recomputed from there rather than from a count
-- that included failures.
update public.flashcards
   set repetitions = 1
 where times_reviewed > 0
   and repetitions = 0;

-- Cards due soon are unaffected; cards sitting on an inflated interval will simply come back
-- sooner than their old schedule promised, which is the correction, not a regression.
