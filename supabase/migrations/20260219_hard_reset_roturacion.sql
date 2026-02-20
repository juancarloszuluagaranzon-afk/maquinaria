-- 20260219_hard_reset_roturacion.sql
-- WARNING: This will delete data in 'roturacion_seguimiento'.
-- Since the table is currently broken (missing columns), this is necessary to fix it.

BEGIN;

-- 1. Drop dependencies
DROP VIEW IF EXISTS public.v_roturacion_dashboard;
DROP FUNCTION IF EXISTS public.programar_roturacion;
DROP TABLE IF EXISTS public.roturacion_seguimiento;

-- 2. Create ENUM if not exists
DO $$ BEGIN
    CREATE TYPE public.estado_labor_roturacion AS ENUM ('PENDIENTE', 'PROGRAMADO', 'PARCIAL', 'TERMINADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Recreate Table with FULL Schema
CREATE TABLE public.roturacion_seguimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suerte_id UUID REFERENCES public.suertes(id) ON DELETE CASCADE,
    
    fecha_inicio DATE,
    tipo_roturacion TEXT,
    tipo_cana TEXT,
    
    -- Statuses
    estado_1ra_labor public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    estado_2da_labor public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    estado_fertilizacion public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    
    -- Programming Columns (The ones that were missing)
    fecha_programada_1ra DATE,
    condicion_terreno_1ra TEXT,
    fecha_programada_2da DATE,
    condicion_terreno_2da TEXT,
    fecha_programada_fer DATE,
    condicion_terreno_fer TEXT,

    -- Audit
    observacion TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uk_roturacion_suerte UNIQUE (suerte_id)
);

-- 4. Enable RLS
ALTER TABLE public.roturacion_seguimiento ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Technicians All Access" ON public.roturacion_seguimiento FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins All Access" ON public.roturacion_seguimiento FOR ALL USING (true) WITH CHECK (true);

-- 6. Recreate View
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

-- 7. Grant Permissions on View
GRANT SELECT ON public.v_roturacion_dashboard TO authenticated;
GRANT SELECT ON public.v_roturacion_dashboard TO anon;

-- 8. Recreate RPC Function (Updated to match table)
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
BEGIN
    SELECT id INTO v_record_id FROM public.roturacion_seguimiento WHERE suerte_id = p_suerte_id LIMIT 1;

    IF v_record_id IS NOT NULL THEN
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

    RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.programar_roturacion TO authenticated;

COMMIT;

NOTIFY pgrst, 'reload config';
