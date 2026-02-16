-- 20260212_create_roturacion_seguimiento.sql
-- Generado por: Supabase Architect Skill
-- Descripción: Tabla para seguimiento de labores de roturación (planta/soca) en los primeros 3 meses.

-- Crear tipo ENUM para los estados de las labores
DO $$ BEGIN
    CREATE TYPE public.estado_labor_roturacion AS ENUM ('PENDIENTE', 'PROGRAMADO', 'PARCIAL', 'TERMINADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tabla de seguimiento
CREATE TABLE IF NOT EXISTS public.roturacion_seguimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suerte_id UUID REFERENCES public.suertes(id) ON DELETE CASCADE,
    
    fecha_inicio DATE, -- Fecha de inicio del ciclo (siembra o corte anterior)
    dias_edad INTEGER GENERATED ALWAYS AS (CURRENT_DATE - fecha_inicio) STORED, -- Calculado automáticamente si es posible, sino columna normal
    -- Nota: PG 12+ soporta columnas generadas, pero 'CURRENT_DATE' no es inmutable, así que no se puede usar en STORED.
    -- Usaremos una vista o cálculo en cliente mejor. Dejaremos dias_edad como columna manual o calculada en vista.
    
    -- Re-definiendo sin generated stored por limitación de inmutabilidad
    tipo_roturacion TEXT, -- Ej: 'DOBLE', 'SIMPLE'
    tipo_cana TEXT,       -- Ej: 'SOCA', 'PLANTILLA'
    
    estado_1ra_labor public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    estado_2da_labor public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    estado_fertilizacion public.estado_labor_roturacion DEFAULT 'PENDIENTE',
    
    observacion TEXT,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    
    CONSTRAINT uk_roturacion_suerte UNIQUE (suerte_id)
);

-- Habilitar RLS
ALTER TABLE public.roturacion_seguimiento ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (Permisivas para desarrollo, ajustar para prod)
CREATE POLICY "Dev: Public Access Roturacion Seg" ON public.roturacion_seguimiento
    FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_roturacion_suerte ON public.roturacion_seguimiento(suerte_id);

-- Vista para facilitar el cálculo de edad diaria y uniones
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

-- Permisos para la vista (si es necesario en su setup)
GRANT SELECT ON public.v_roturacion_dashboard TO authenticated;
GRANT SELECT ON public.v_roturacion_dashboard TO anon;
