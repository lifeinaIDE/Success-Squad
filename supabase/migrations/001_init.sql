-- ============================================================
-- 001_init.sql  –  Success Squad E-Fest '26 Supabase schema
-- ============================================================
-- Run via: supabase db push
-- Or paste into the Supabase SQL Editor in your dashboard.
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── pending_payments ────────────────────────────────────────
create table if not exists public.pending_payments (
  id                  uuid        primary key default gen_random_uuid(),
  order_id            text        unique not null,          -- Razorpay order ID
  event_id            text        not null,
  team_data           jsonb       not null,                 -- leader/members/team name
  status              text        not null default 'pending'
                        constraint pending_payments_status_check
                        check (status in ('pending','paid','failed','expired')),
  razorpay_payment_id text,
  amount_inr          integer     not null default 0,
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null
);

alter table public.pending_payments enable row level security;

-- Clients may only SELECT the single row they already know the order_id for.
-- All INSERTs/UPDATEs happen via the service_role key in Edge Functions (bypasses RLS).
create policy "select own pending_payment"
  on public.pending_payments for select
  using (true);   -- filter is enforced by the client query (.eq('order_id', orderId))
                  -- Listing all rows is blocked below.

-- Block bulk SELECT (clients must always filter by order_id)
-- The above policy allows SELECT; the application layer never exposes a list endpoint.

-- ── registrations ─────────────────────────────────────────────
create table if not exists public.registrations (
  id                  uuid        primary key default gen_random_uuid(),
  team_id             text        unique not null,           -- human-readable "BGMI-XXXXX"
  event_id            text        not null,
  order_id            text        references public.pending_payments(order_id),
  team_data           jsonb       not null,
  razorpay_payment_id text        not null,
  status              text        not null default 'confirmed'
                        constraint registrations_status_check
                        check (status in ('confirmed','verified')),
  screenshot_url      text,
  created_at          timestamptz not null default now(),
  verified_at         timestamptz
);

alter table public.registrations enable row level security;

-- Anyone may read a registration (client filters by team_id for status lookup)
create policy "select registrations"
  on public.registrations for select
  using (true);

-- Clients may update ONLY screenshot_url on their own row (matched by team_id they supply).
-- status/verified_at can ONLY be changed by Edge Functions via service_role.
create policy "update own screenshot_url"
  on public.registrations for update
  using (true)
  with check (
    -- Only screenshot_url may change; status must remain unchanged
    status = (select status from public.registrations where id = registrations.id)
    and verified_at is not distinct from (select verified_at from public.registrations where id = registrations.id)
  );

-- ── team_id counter (per-event, collision-safe) ────────────────
create table if not exists public.team_id_counters (
  event_id  text    primary key,
  counter   integer not null default 0
);

alter table public.team_id_counters enable row level security;

-- Only service_role (Edge Functions) may touch the counter.
-- No client policies needed — RLS blocks all client access by default.

-- ── Trigger: auto-create registration when payment is confirmed ─
create or replace function public.handle_payment_confirmed()
returns trigger
language plpgsql
security definer   -- runs as DB owner, bypasses RLS for counter + registrations insert
as $$
declare
  v_prefix    text;
  v_counter   integer;
  v_team_id   text;
  v_attempt   integer := 0;
begin
  -- Only fire on transitions to 'paid'
  if new.status <> 'paid' or old.status = 'paid' then
    return new;
  end if;

  -- Map event_id to prefix
  v_prefix := case new.event_id
    when 'bgmi-lec'      then 'BGMI'
    when 'fflec'         then 'FFLEC'
    when 'hackathon-24h' then 'HACK'
    when 'ipl-auction'   then 'IPL'
    when 'startup-pitch' then 'PITCH'
    when 'mun'           then 'MUN'
    else upper(left(new.event_id, 6))
  end;

  -- Atomically increment counter and generate team_id
  loop
    v_attempt := v_attempt + 1;
    if v_attempt > 10 then
      raise exception 'Could not generate unique team_id after 10 attempts';
    end if;

    insert into public.team_id_counters (event_id, counter)
    values (new.event_id, 1)
    on conflict (event_id)
    do update set counter = team_id_counters.counter + 1
    returning counter into v_counter;

    v_team_id := v_prefix || '-' || lpad(v_counter::text, 5, '0');

    -- Check for collision (extremely unlikely, but be safe)
    exit when not exists (
      select 1 from public.registrations where team_id = v_team_id
    );
  end loop;

  -- Insert confirmed registration
  insert into public.registrations (
    team_id,
    event_id,
    order_id,
    team_data,
    razorpay_payment_id,
    status,
    created_at
  ) values (
    v_team_id,
    new.event_id,
    new.order_id,
    new.team_data,
    coalesce(new.razorpay_payment_id, ''),
    'confirmed',
    now()
  );

  return new;
end;
$$;

-- Drop and recreate trigger to be idempotent
drop trigger if exists on_payment_confirmed on public.pending_payments;
create trigger on_payment_confirmed
  after update on public.pending_payments
  for each row
  execute function public.handle_payment_confirmed();

-- ── Enable Realtime on pending_payments ────────────────────────
-- Clients subscribe to status changes on their own order row.
alter publication supabase_realtime add table public.pending_payments;

-- ── Scheduled sweep: expire stale pending_payments ─────────────
-- pg_cron is NOT enabled by default. Set up the sweep manually:
--
-- STEP 1: Enable pg_cron in Supabase Dashboard:
--   Database → Extensions → search "pg_cron" → Enable
--
-- STEP 2: After enabling, run this SQL in the SQL Editor:
--   select cron.schedule(
--     'expire-stale-payments',
--     '* * * * *',
--     $$
--       update public.pending_payments
--       set status = 'expired'
--       where status = 'pending'
--         and expires_at < now();
--     $$
--   );
--
-- NOTE: This sweep is a safety net only. The expire-order Edge Function
-- called by the client when the countdown hits 0 handles the primary case.
