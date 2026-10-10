-- ============================================================
-- 006_submit_payment_proof_rpc.sql
-- ============================================================
-- Creates a SECURITY DEFINER RPC for submitting payment proof.
-- This bypasses RLS entirely — the client never touches the table directly.
-- Called by registrations.js → submitPaymentProof()
-- ============================================================

create or replace function public.submit_payment_proof(
  p_order_id       text,
  p_utr            text,
  p_screenshot_url text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.pending_payments
  set
    utr            = p_utr,
    screenshot_url = p_screenshot_url,
    status         = 'submitted'
  where order_id = p_order_id
    and status   = 'pending';

  if not found then
    raise exception 'Order not found or already submitted (id: %)', p_order_id;
  end if;
end;
$$;
