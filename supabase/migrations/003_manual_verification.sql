-- ============================================================
-- 003_manual_verification.sql
-- ============================================================

-- 1. Remove Razorpay specific columns
alter table public.pending_payments drop column if exists razorpay_payment_id;
alter table public.pending_payments drop column if exists qr_code_id;
alter table public.registrations drop column if exists razorpay_payment_id;

-- 2. Add manual verification columns
alter table public.pending_payments add column if not exists utr text;
alter table public.pending_payments add column if not exists screenshot_url text;
alter table public.pending_payments add column if not exists rejection_reason text;

-- 3. Update pending_payments status constraints
alter table public.pending_payments drop constraint if exists pending_payments_status_check;
alter table public.pending_payments add constraint pending_payments_status_check
  check (status in ('pending', 'submitted', 'verified', 'rejected', 'expired'));

-- 4. Event Capacities for slot tracking
create table if not exists public.event_capacities (
  event_id text primary key,
  max_capacity integer not null
);

insert into public.event_capacities (event_id, max_capacity) values
  ('bgmi-lec', 50),
  ('fflec', 50),
  ('hackathon-24h', 30),
  ('ipl-auction', 40),
  ('startup-pitch', 30),
  ('money-makers', 40)
on conflict do nothing;

-- 5. RPC: Get Event Slot Status
create or replace function public.get_event_slot_status(p_event_id text)
returns json
language plpgsql
as $$
declare
  v_max_capacity integer;
  v_consumed integer;
begin
  select max_capacity into v_max_capacity from public.event_capacities where event_id = p_event_id;
  if not found then v_max_capacity := 100; end if; -- Default if not set

  -- 'pending', 'submitted', 'verified' all count as consumed
  select count(*) into v_consumed
  from public.pending_payments
  where event_id = p_event_id
    and status in ('pending', 'submitted', 'verified');

  return json_build_object(
    'max_capacity', v_max_capacity,
    'consumed', v_consumed,
    'available', greatest(0, v_max_capacity - v_consumed)
  );
end;
$$;

-- 6. RPC: Atomic Slot Hold
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
    and status in ('pending', 'submitted', 'verified');

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

-- 7. Update trigger for auto-creating registrations on 'verified'
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
    when 'hackathon-24h' then 'HACK'
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

-- Re-create the trigger to use the updated function
drop trigger if exists on_payment_confirmed on public.pending_payments;
create trigger on_payment_confirmed
  after update on public.pending_payments
  for each row
  execute function public.handle_payment_confirmed();

-- 8. Helper to check duplicate UTRs
create or replace view public.duplicate_utrs as
select utr, count(*) as usage_count, string_agg(id::text, ', ') as payment_ids
from public.pending_payments
where utr is not null and utr <> ''
group by utr
having count(*) > 1;
