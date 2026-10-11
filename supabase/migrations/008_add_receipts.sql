-- 008_add_receipts.sql

-- 1. Create sequence for receipt numbers
create sequence if not exists public.receipt_no_seq start 1000;

-- 2. Add columns to registrations
alter table public.registrations
add column if not exists receipt_no text unique,
add column if not exists receipt_path text,
add column if not exists receipt_generated_at timestamptz,
add column if not exists receipt_downloaded_at timestamptz;

-- 3. Create storage buckets
insert into storage.buckets (id, name, public) values 
  ('receipt-templates', 'receipt-templates', false),
  ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- 4. Enable RLS on storage buckets to ensure they are private
-- Service role (Edge Functions) can bypass RLS automatically.
-- Users cannot read or write to these buckets directly.
create policy "Private receipt-templates (service role only)"
on storage.objects for all
using (bucket_id = 'receipt-templates' and auth.role() = 'service_role');

create policy "Private receipts (service role only)"
on storage.objects for all
using (bucket_id = 'receipts' and auth.role() = 'service_role');

-- 5. Webhook function via pg_net (placeholder setup)
-- In production, replace 'http://host.docker.internal:54321' with your deployed edge function URL
-- and provide the correct Authorization header.
create extension if not exists pg_net;

create or replace function public.trigger_receipt_generation()
returns trigger
language plpgsql
security definer
as $$
declare
  v_url text := coalesce(
    current_setting('app.settings.receipt_function_url', true), 
    'http://host.docker.internal:54321/functions/v1/generate-receipt'
  );
  v_auth_header text := coalesce(
    current_setting('app.settings.service_role_key', true), 
    'Bearer YOUR_ANON_KEY'
  );
begin
  -- Optional: trigger logic utilizing pg_net
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', v_auth_header
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'type', TG_OP
    )
  );
  return NEW;
end;
$$;

drop trigger if exists on_registration_verified on public.registrations;
create trigger on_registration_verified
  after update on public.registrations
  for each row
  when (OLD.status is distinct from 'verified' and NEW.status = 'verified')
  execute function public.trigger_receipt_generation();

-- Note: We also handle the case where it might be inserted as 'verified'
drop trigger if exists on_registration_inserted_verified on public.registrations;
create trigger on_registration_inserted_verified
  after insert on public.registrations
  for each row
  when (NEW.status = 'verified')
  execute function public.trigger_receipt_generation();

-- 6. Helper RPC to get sequence securely via Edge Functions
create or replace function public.get_next_receipt_no()
returns text
language plpgsql
security definer
as $$
declare
  v_seq integer;
begin
  select nextval('public.receipt_no_seq') into v_seq;
  return v_seq::text;
end;
$$;

