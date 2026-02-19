-- 20260218_add_partial_area_columns.sql
-- Descripción: Agrega columnas para registrar el avance de área cuando la labor es PARCIAL

ALTER TABLE public.roturacion_seguimiento
ADD COLUMN IF NOT EXISTS area_avance_1ra NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS area_avance_2da NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS area_avance_fertilizacion NUMERIC DEFAULT 0;

-- Actualizar la vista para incluir estas nuevas columnas
DROP VIEW IF EXISTS public.v_roturacion_dashboard;

CREATE OR REPLACE VIEW public.v_roturacion_dashboard AS
SELECT 
    rs.id,
    rs.suerte_id,
    rs.fecha_inicio,
    rs.tipo_roturacion,
    rs.tipo_cana,
    rs.estado_1ra_labor,
    rs.estado_2da_labor,
    rs.estado_fertilizacion,
    rs.observacion,
    rs.last_updated,
    rs.updated_by,
    -- Nuevas columnas
    rs.area_avance_1ra,
    rs.area_avance_2da,
    rs.area_avance_fertilizacion,
    -- Calculados
    (CURRENT_DATE - rs.fecha_inicio) as edad_calculada_dias,
    s.codigo as suerte_codigo,
    s.hacienda,
    s.zona,
    s.area_neta
FROM 
    public.roturacion_seguimiento rs
JOIN 
    public.suertes s ON rs.suerte_id = s.id;

-- Re-aplicar permisos a la vista
GRANT SELECT ON public.v_roturacion_dashboard TO authenticated;
GRANT SELECT ON public.v_roturacion_dashboard TO anon;
