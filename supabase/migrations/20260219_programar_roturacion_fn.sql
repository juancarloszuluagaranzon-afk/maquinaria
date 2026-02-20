-- 20260219_programar_roturacion_fn.sql
-- Creates a Postgres function to handle roturacion programming
-- This bypasses the PostgREST schema cache issue for new columns.
-- Run this in Supabase SQL Editor.

-- 1. Ensure columns exist (idempotent)
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_1ra DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_1ra TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_2da DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_2da TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_fer DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_fer TEXT;

-- 2. Create the RPC function
CREATE OR REPLACE FUNCTION public.programar_roturacion(
    p_suerte_id UUID,
    p_fecha_1ra TEXT DEFAULT NULL,
    p_condicion_1ra TEXT DEFAULT NULL,
    p_fecha_2da TEXT DEFAULT NULL,
    p_condicion_2da TEXT DEFAULT NULL,
    p_fecha_fer TEXT DEFAULT NULL,
    p_condicion_fer TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record_id UUID;
    v_result JSON;
BEGIN
    -- Check if a record exists for this suerte
    SELECT id INTO v_record_id
    FROM public.roturacion_seguimiento
    WHERE suerte_id = p_suerte_id
    LIMIT 1;

    IF v_record_id IS NOT NULL THEN
        -- Update existing record
        UPDATE public.roturacion_seguimiento SET
            fecha_programada_1ra  = COALESCE(p_fecha_1ra::DATE, fecha_programada_1ra),
            condicion_terreno_1ra = COALESCE(p_condicion_1ra, condicion_terreno_1ra),
            estado_1ra_labor      = CASE WHEN p_fecha_1ra IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE estado_1ra_labor END,
            fecha_programada_2da  = COALESCE(p_fecha_2da::DATE, fecha_programada_2da),
            condicion_terreno_2da = COALESCE(p_condicion_2da, condicion_terreno_2da),
            estado_2da_labor      = CASE WHEN p_fecha_2da IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE estado_2da_labor END,
            fecha_programada_fer  = COALESCE(p_fecha_fer::DATE, fecha_programada_fer),
            condicion_terreno_fer = COALESCE(p_condicion_fer, condicion_terreno_fer),
            estado_fertilizacion  = CASE WHEN p_fecha_fer IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE estado_fertilizacion END,
            updated_by            = auth.uid(),
            last_updated          = NOW()
        WHERE id = v_record_id;
    ELSE
        -- Insert new record
        INSERT INTO public.roturacion_seguimiento (
            suerte_id,
            fecha_programada_1ra, condicion_terreno_1ra, estado_1ra_labor,
            fecha_programada_2da, condicion_terreno_2da, estado_2da_labor,
            fecha_programada_fer, condicion_terreno_fer, estado_fertilizacion,
            updated_by, last_updated
        ) VALUES (
            p_suerte_id,
            p_fecha_1ra::DATE, p_condicion_1ra,
            CASE WHEN p_fecha_1ra IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE 'PENDIENTE'::public.estado_labor_roturacion END,
            p_fecha_2da::DATE, p_condicion_2da,
            CASE WHEN p_fecha_2da IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE 'PENDIENTE'::public.estado_labor_roturacion END,
            p_fecha_fer::DATE, p_condicion_fer,
            CASE WHEN p_fecha_fer IS NOT NULL THEN 'PROGRAMADO'::public.estado_labor_roturacion ELSE 'PENDIENTE'::public.estado_labor_roturacion END,
            auth.uid(), NOW()
        );
    END IF;

    SELECT json_build_object('success', true) INTO v_result;
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 3. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.programar_roturacion TO authenticated;

-- 4. Force cache reload
NOTIFY pgrst, 'reload schema';
