-- =============================================================
-- MASTER MIGRATION - 20260220
-- Ejecutar este script completo en el SQL Editor de Supabase.
-- Es idempotente (seguro de ejecutar múltiples veces).
-- =============================================================

BEGIN;

-- ---------------------------------------------------------------
-- PASO 0: Asegurar columnas en tabla programaciones
-- (Fix para schema cache de PostgREST y columnas faltantes)
-- ---------------------------------------------------------------
ALTER TABLE public.programaciones
    ADD COLUMN IF NOT EXISTS usuario_responsable_id UUID REFERENCES public.usuarios(id),
    ADD COLUMN IF NOT EXISTS horas_estimadas        NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS observaciones           TEXT,
    ADD COLUMN IF NOT EXISTS maquinaria_id          UUID REFERENCES public.maquinaria(id);

-- Reactivar la política pública para que técnicos puedan insertar
-- (La migración 20260218 eliminó el "Dev: Public Access" pero las
--  nuevas políticas referencian usuario_responsable_id, lo que
--  ahora sí existe. Habilitamos también la política pública como
--  fallback hasta que se ajusten los roles.)
DROP POLICY IF EXISTS "Dev: Public Access Programaciones" ON public.programaciones;
CREATE POLICY "Authenticated can insert programaciones"
    ON public.programaciones FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ---------------------------------------------------------------
-- PASO 1: Columnas de Programación en roturacion_seguimiento
-- ---------------------------------------------------------------
DROP VIEW IF EXISTS public.v_roturacion_dashboard;

ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_1ra DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_1ra TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_2da DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_2da TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS fecha_programada_fer DATE;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS condicion_terreno_fer TEXT;
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_1ra NUMERIC(10,2);
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_2da NUMERIC(10,2);
ALTER TABLE public.roturacion_seguimiento ADD COLUMN IF NOT EXISTS area_programada_fer NUMERIC(10,2);

-- ---------------------------------------------------------------
-- PASO 2: Recrear la Vista v_roturacion_dashboard
-- ---------------------------------------------------------------
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

GRANT SELECT ON public.v_roturacion_dashboard TO authenticated;
GRANT SELECT ON public.v_roturacion_dashboard TO anon;

-- ---------------------------------------------------------------
-- PASO 3: Función RPC programar_roturacion
-- ---------------------------------------------------------------
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
    SELECT id INTO v_record_id
    FROM public.roturacion_seguimiento
    WHERE suerte_id = p_suerte_id
    LIMIT 1;

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

    SELECT json_build_object('success', true) INTO v_result;
    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.programar_roturacion TO authenticated;

-- ---------------------------------------------------------------
-- PASO 4: Tabla roturacion_asignaciones
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roturacion_asignaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roturacion_id UUID NOT NULL REFERENCES public.roturacion_seguimiento(id) ON DELETE CASCADE,
    contratista_id UUID NOT NULL REFERENCES public.contratistas(id),
    labor TEXT NOT NULL CHECK (labor IN ('1RA', '2DA', 'FER')),
    area_asignada NUMERIC(10, 2) NOT NULL DEFAULT 0,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.roturacion_asignaciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'roturacion_asignaciones' AND policyname = 'Analistas pueden crear asignaciones'
    ) THEN
        CREATE POLICY "Analistas pueden crear asignaciones"
        ON public.roturacion_asignaciones FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.usuarios
                WHERE usuarios.id = auth.uid()
                AND usuarios.rol IN ('analista', 'admin')
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'roturacion_asignaciones' AND policyname = 'Todos pueden ver asignaciones'
    ) THEN
        CREATE POLICY "Todos pueden ver asignaciones"
        ON public.roturacion_asignaciones FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_roturacion_asignaciones_roturacion_id ON public.roturacion_asignaciones(roturacion_id);
CREATE INDEX IF NOT EXISTS idx_roturacion_asignaciones_contratista_id ON public.roturacion_asignaciones(contratista_id);

-- ---------------------------------------------------------------
-- PASO 5: Seed Contratistas
-- ---------------------------------------------------------------
INSERT INTO public.contratistas (nombre)
SELECT v.nombre FROM (VALUES
    ('AGROVASCAS S A S'),
    ('SERVICIOS AGROMECANICOS DE OCCIDENTES S.A.S.'),
    ('SERVICIOS AGRICOLAS VARGAS S.A.S'),
    ('ANDRUSV S A S'),
    ('AGROMAQUINARIA GALVIL S.A.S'),
    ('LABORES AGRICOLAS ROMERO S.A.S.'),
    ('RIOPAILA CASTILLA S.A'),
    ('BIENES Y MAQUINARIA SAS'),
    ('SERVI AGRICOLAS DIAGO S.A.S.'),
    ('AGROPECAM APOYO PARA EL CAMPO S.A.S.')
) AS v(nombre)
WHERE NOT EXISTS (
    SELECT 1 FROM public.contratistas c WHERE c.nombre = v.nombre
);


COMMIT;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
