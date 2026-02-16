-- 120_receipts_storage.sql
-- Create receipts bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for uploading receipts (Authenticated users)
CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'receipts' );

-- Policy for viewing receipts (Public or Authenticated)
CREATE POLICY "Public Select" 
ON storage.objects FOR SELECT 
TO authenticated 
USING ( bucket_id = 'receipts' );

-- Add received_url to ejecuciones
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS recibo_url TEXT;
