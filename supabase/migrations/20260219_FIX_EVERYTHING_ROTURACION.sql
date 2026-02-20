-- 20260219_FIX_EVERYTHING_ROTURACION.sql
-- Run this in Supabase SQL Editor to forcefully update everything.

BEGIN;

-- 1. DROP dependent view first (to unlock schema changes if needed)
DROP VIEW IF EXISTS public.v_roturacion_dashboard;

-- 2. Add columns to the table
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_1ra DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_1ra TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_2da DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_2da TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_fer DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_fer TEXT;

-- 3. Recreate the view (this refreshes the 'SELECT *' expansion to include new columns)
CREATE OR REPLACE VIEW public.v_roturacion_dashboard AS
SELECT 
    rs.*,
    (CURRENT_DATE - rs.fecha_inicio) as edad_calculada_dias,
    s.codigo as suerte_codigo,
    s.hacienda,
    s.zona,
    s.area_neta
FROM 
    public.roturacion_seguimiento rs
JOIN 
    public.suertes s ON rs.suerte_id = s.id;

-- 4. Grant permissions again (just in case)
GRANT SELECT ON public.v_roturacion_dashboard TO authenticated;
GRANT SELECT ON public.v_roturacion_dashboard TO anon;

COMMIT;

-- 5. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';
