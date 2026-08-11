-- Per-user rate limiting, shared across every server instance.
--
-- The application also keeps a per-process counter, but on serverless each instance counts only
-- its own traffic, so the per-process number is a backstop rather than a budget. This table is
-- the budget.

create table if not exists public.rate_limit_counters (
  user_id      uuid        not null references auth.users(id) on delete cascade,
  bucket       text        not null,
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (user_id, bucket, window_start)
);

-- No policies are defined on purpose. RLS is enabled and nothing grants direct access, so the
-- table is reachable only through the security-definer function below. A user must not be able
-- to read, reset, or forge their own counter.
alter table public.rate_limit_counters enable row level security;

create index if not exists rate_limit_counters_window_idx
  on public.rate_limit_counters (window_start);

/**
 * Atomically record one request and report whether it is within budget.
 *
 * Identity comes from auth.uid(), never from a parameter — a caller-supplied user id would let
 * anyone spend someone else's allowance or reset their own.
 *
 * The window is a fixed tumbling window derived from the clock, so every instance computes the
 * same boundary without coordinating.
 */
create or replace function public.consume_rate_limit(
  p_bucket         text,
  p_limit          int,
  p_window_seconds int
)
returns table (allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user         uuid := auth.uid();
  v_window_start timestamptz;
  v_count        int;
begin
  if v_user is null then
    raise exception 'consume_rate_limit: no authenticated user';
  end if;

  if p_limit <= 0 or p_window_seconds <= 0 then
    raise exception 'consume_rate_limit: limit and window must be positive';
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limit_counters as c (user_id, bucket, window_start, count)
  values (v_user, p_bucket, v_window_start, 1)
  on conflict (user_id, bucket, window_start)
    do update set count = c.count + 1
  returning c.count into v_count;

  -- Opportunistic cleanup: rows outside any live window are dead weight. Doing this on ~1% of
  -- calls keeps the table bounded without needing a scheduled job.
  if random() < 0.01 then
    delete from public.rate_limit_counters
     where window_start < now() - interval '2 days';
  end if;

  return query
    select
      v_count <= p_limit,
      greatest(p_limit - v_count, 0),
      v_window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public;
grant execute on function public.consume_rate_limit(text, int, int) to authenticated;
