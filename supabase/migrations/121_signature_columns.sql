-- 121_signature_columns.sql
-- Add signature columns for technicians
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS firma_tecnico_url TEXT;
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS fecha_firma_tecnico TIMESTAMPTZ;

-- Ensure receipts bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for uploading signatures (Authenticated users) -> same as receipts
-- No new policy needed if we use the same 'receipts' bucket.
