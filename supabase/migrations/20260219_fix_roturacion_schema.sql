-- 20260219_fix_roturacion_schema.sql
-- Run this in the Supabase SQL Editor to fix the "Could not find column" error.

BEGIN;

-- 1. Add missing columns safely
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_1ra DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_1ra TEXT;

ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_2da DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_2da TEXT;

ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_fer DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_fer TEXT;

-- 2. Force specific type casting for existing data if needed (optional, just safety)
-- (No specific casting needed for new null columns)

COMMIT;

-- 3. Force PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload config';
