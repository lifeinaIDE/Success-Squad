-- ============================================================
-- 004_craftcode_unstop_status.sql
-- ============================================================
-- Part 7: Add 'pending_unstop_review' status for CraftCode external Unstop flow.
-- Also renames hackathon-24h → craftcode in event_capacities.
-- ============================================================

-- 1. Extend the status check constraint to include 'pending_unstop_review'
alter table public.pending_payments drop constraint if exists pending_payments_status_check;
alter table public.pending_payments add constraint pending_payments_status_check
  check (status in ('pending', 'submitted', 'pending_unstop_review', 'verified', 'rejected', 'expired'));

-- 2. Rename hackathon-24h → craftcode in event_capacities
--    (safe to run even if already renamed — use upsert pattern)
insert into public.event_capacities (event_id, max_capacity)
  values ('craftcode', 30)
  on conflict (event_id) do nothing;

-- Remove old key if it exists (no-op if already gone)
delete from public.event_capacities where event_id = 'hackathon-24h';

-- 3. Update team_id_counters table to use craftcode key
--    (preserve any existing counter for hackathon-24h by re-keying)
insert into public.team_id_counters (event_id, counter)
  select 'craftcode', counter
  from public.team_id_counters
  where event_id = 'hackathon-24h'
  on conflict (event_id) do nothing;

delete from public.team_id_counters where event_id = 'hackathon-24h';

-- 4. Update slot-counting function to include 'pending_unstop_review'
--    (same capacity-consumption logic as 'submitted' for other events)
create or replace function public.get_event_slot_status(p_event_id text)
returns json
language plpgsql
as $$
declare
  v_max_capacity integer;
  v_consumed integer;
begin
  select max_capacity into v_max_capacity from public.event_capacities where event_id = p_event_id;
  if not found then v_max_capacity := 100; end if;

  -- 'pending', 'submitted', 'pending_unstop_review', 'verified' all count as consumed
  select count(*) into v_consumed
  from public.pending_payments
  where event_id = p_event_id
    and status in ('pending', 'submitted', 'pending_unstop_review', 'verified');

  return json_build_object(
    'max_capacity', v_max_capacity,
    'consumed', v_consumed,
    'available', greatest(0, v_max_capacity - v_consumed)
  );
end;
$$;

-- 5. Update hold_slot to include 'pending_unstop_review' in consumed count
create or replace function public.hold_slot(p_event_id text, p_team_data jsonb, p_amount integer)
returns json
language plpgsql
as $$
declare
  v_max integer;
  v_consumed integer;
  v_id uuid;
  v_order_id text;
  v_expires_at timestamptz;
begin
  -- Lock the capacities row to serialize access
  select max_capacity into v_max
  from public.event_capacities
  where event_id = p_event_id
  for update;

  if not found then v_max := 100; end if;

  select count(*) into v_consumed
  from public.pending_payments
  where event_id = p_event_id
    and status in ('pending', 'submitted', 'pending_unstop_review', 'verified');

  if v_consumed >= v_max then
    raise exception 'Event sold out';
  end if;

  v_order_id := 'ORD_' || upper(substr(md5(random()::text), 1, 8));
  v_expires_at := now() + interval '5 minutes';

  insert into public.pending_payments (order_id, event_id, team_data, amount_inr, status, expires_at)
  values (v_order_id, p_event_id, p_team_data, p_amount, 'pending', v_expires_at)
  returning id into v_id;

  return json_build_object(
    'id', v_id,
    'order_id', v_order_id,
    'expires_at', v_expires_at
  );
end;
$$;

-- 6. Update team_id trigger: craftcode event → CRAFT prefix
create or replace function public.handle_payment_confirmed()
returns trigger
language plpgsql
security definer
as $$
declare
  v_prefix    text;
  v_counter   integer;
  v_team_id   text;
  v_attempt   integer := 0;
begin
  -- Only fire on transitions to 'verified'
  if new.status <> 'verified' or old.status = 'verified' then
    return new;
  end if;

  v_prefix := case new.event_id
    when 'bgmi-lec'      then 'BGMI'
    when 'fflec'         then 'FFLEC'
    when 'craftcode'     then 'CRAFT'   -- renamed from hackathon-24h / HACK
    when 'ipl-auction'   then 'IPL'
    when 'startup-pitch' then 'PITCH'
    when 'money-makers'  then 'MONEY'
    else upper(left(new.event_id, 6))
  end;

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

    exit when not exists (
      select 1 from public.registrations where team_id = v_team_id
    );
  end loop;

  insert into public.registrations (
    team_id,
    event_id,
    order_id,
    team_data,
    status,
    screenshot_url,
    created_at,
    verified_at
  ) values (
    v_team_id,
    new.event_id,
    new.order_id,
    new.team_data,
    'confirmed',
    new.screenshot_url,
    now(),
    now()
  );

  return new;
end;
$$;

-- Re-create the trigger
drop trigger if exists on_payment_confirmed on public.pending_payments;
create trigger on_payment_confirmed
  after update on public.pending_payments
  for each row
  execute function public.handle_payment_confirmed();
