-- 002_add_qr_code_id.sql
-- Adds qr_code_id to pending_payments so we can link Razorpay QR codes
-- back to our orders via the qr_code.credited webhook event.

alter table public.pending_payments
  add column if not exists qr_code_id text;
