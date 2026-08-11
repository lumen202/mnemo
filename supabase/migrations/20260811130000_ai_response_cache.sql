-- Shared cache for non-personalised AI answers.
--
-- The application keeps an in-process LRU as well, but on serverless each instance holds its own,
-- so the hit rate falls exactly as traffic rises — the opposite of what a cost-saving cache is
-- supposed to do. This table is the shared tier.
--
-- Only stateless, non-personalised answers are ever written here (see services/ai/sharedCache.ts).
-- An answer generated with a student's study context, or from a conversation with history, is
-- never eligible: this table is readable by every user by construction, so anything in it is
-- effectively public to the userbase.

create table if not exists public.ai_response_cache (
  cache_key  text        primary key,
  response   text        not null,
  model      text,
  hits       int         not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists ai_response_cache_expires_idx
  on public.ai_response_cache (expires_at);

-- RLS on with no policies: unreachable by anon/authenticated clients entirely. The server writes
-- and reads this table with the service role, so a signed-in user cannot poison the cache by
-- inserting an answer that would then be served to every other student.
alter table public.ai_response_cache enable row level security;
