-- 20260211_financial_dashboard.sql
-- Description: Schema updates for Financial Control Dashboard
-- Adds Contractor ID and Hacienda assignments to Users
-- Adds Payment Status to Programaciones

-- 1. Add fields to usuarios table
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS contratista_id UUID REFERENCES public.contratistas(id),
ADD COLUMN IF NOT EXISTS haciendas TEXT[]; -- Array of Hacienda names/codes

-- 2. Add payment status to programaciones
ALTER TABLE public.programaciones
ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'PENDIENTE' 
CHECK (estado_pago IN ('PENDIENTE', 'PAGADO'));

-- 3. Policy updates (if needed, currently mostly permissive for dev)
-- Ensure users can read their own extended profile data
-- (Existing policies are "FOR ALL USING (true)", so we are good for dev)
