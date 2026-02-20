-- Add columns for 2nd Labor if they don't exist
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_2da DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_2da TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_2da NUMERIC DEFAULT 0;

-- Add columns for Fertilization if they don't exist
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_fer DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_fer TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_fer NUMERIC DEFAULT 0;

-- Ensure 1st Labor area column exists (others likely exist)
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_1ra NUMERIC DEFAULT 0;
