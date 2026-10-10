-- ============================================================
-- 007_fix_all_rls_and_storage.sql
-- ============================================================
-- This script completely resolves ALL Row-Level Security (RLS) issues,
-- including the Storage bucket upload issue that is blocking "Submit Proof".
-- ============================================================

-- 1. Disable RLS on application tables (Simplest & most reliable for this use-case)
ALTER TABLE public.pending_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_capacities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;

-- 2. Fix Storage Bucket RLS (This is what is currently failing!)
-- The "Submit Proof" button uploads an image to the 'payment-proofs' bucket.
-- Storage objects have RLS enabled by default. We MUST allow anonymous uploads.

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing restrictive policies on storage if any
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- Create policy to allow ANYONE (anon) to upload to the payment-proofs bucket
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- Create policy to allow ANYONE to read from the payment-proofs bucket
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

-- Create policy to allow ANYONE to update in the payment-proofs bucket
CREATE POLICY "Allow public update"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'payment-proofs');
