-- ============================================================
-- 009_payment_receipt_verification.sql
-- Success Squad E-Fest '26: Payment Receipt & Gateway Verification
-- ============================================================

-- 1. Ensure registration columns exist for receipt details
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS receipt_number TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS amount_inr INTEGER DEFAULT 199;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS utr TEXT;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI / Online Payment Gateway';

-- 2. Ensure pending_payments columns exist for receipt details
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UPI / Online Payment Gateway';

-- 3. Update the handle_payment_confirmed trigger function to copy all receipt fields
CREATE OR REPLACE FUNCTION public.handle_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix    TEXT;
  v_counter   INTEGER;
  v_team_id   TEXT;
  v_rec_num   TEXT;
  v_attempt   INTEGER := 0;
BEGIN
  -- Only fire on transitions to 'verified'
  IF new.status <> 'verified' OR old.status = 'verified' THEN
    RETURN new;
  END IF;

  v_prefix := CASE new.event_id
    WHEN 'bgmi-lec'      THEN 'BGMI'
    WHEN 'fflec'         THEN 'FFLEC'
    WHEN 'craftcode'     THEN 'CRAFT'
    WHEN 'hackathon-24h' THEN 'HACK'
    WHEN 'ipl-auction'   THEN 'IPL'
    WHEN 'startup-pitch' THEN 'PITCH'
    WHEN 'money-makers'  THEN 'MONEY'
    ELSE UPPER(LEFT(new.event_id, 5))
  END;

  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt > 10 THEN
      RAISE EXCEPTION 'Could not generate unique team_id after 10 attempts';
    END IF;

    INSERT INTO public.team_id_counters (event_id, counter)
    VALUES (new.event_id, 1)
    ON CONFLICT (event_id)
    DO UPDATE SET counter = team_id_counters.counter + 1
    RETURNING counter INTO v_counter;

    v_team_id := v_prefix || '-' || LPAD(v_counter::text, 5, '0');

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.registrations WHERE team_id = v_team_id
    );
  END LOOP;

  v_rec_num := 'EF26-REC-' || COALESCE(REPLACE(new.order_id, 'ORD_', ''), LPAD(v_counter::text, 6, '0'));

  INSERT INTO public.registrations (
    team_id,
    event_id,
    order_id,
    team_data,
    status,
    screenshot_url,
    amount_inr,
    utr,
    payment_method,
    receipt_number,
    created_at,
    verified_at
  ) VALUES (
    v_team_id,
    new.event_id,
    new.order_id,
    new.team_data,
    'confirmed',
    new.screenshot_url,
    new.amount_inr,
    new.utr,
    COALESCE(new.payment_method, 'UPI / Online Payment Gateway'),
    v_rec_num,
    now(),
    COALESCE(new.verified_at, now())
  )
  ON CONFLICT (team_id) DO NOTHING;

  RETURN new;
END;
$$;
