-- ==============================================================================
-- 5. CREATE ASIGNACIONES & RLS
-- ==============================================================================

-- 1. Create ASIGNACIONES table (Missing)
CREATE TABLE IF NOT EXISTS public.asignaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programacion_id UUID REFERENCES public.programaciones(id) ON DELETE CASCADE,
    maquina_id UUID REFERENCES public.maquinaria(id) ON DELETE SET NULL,
    estado TEXT CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'TERMINADO', 'CANCELADO')) DEFAULT 'PENDIENTE',
    fecha_asignacion TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_asignaciones_maquina_id ON public.asignaciones(maquina_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_programacion_id ON public.asignaciones(programacion_id);

-- Enable RLS
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinaria ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES
-- ------------------------------------------------------------------------------

-- USUARIOS
DROP POLICY IF EXISTS "Users can see their own profile" ON public.usuarios;
CREATE POLICY "Users can see their own profile" ON public.usuarios FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins/Analysts/Jefes/Aux can view all users" ON public.usuarios;
CREATE POLICY "Admins/Analysts/Jefes/Aux can view all users" ON public.usuarios FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'analista', 'jefe_zona', 'auxiliar'))
);

-- SUERTES
DROP POLICY IF EXISTS "Admins/Analysts/Aux see all suertes" ON public.suertes;
CREATE POLICY "Admins/Analysts/Aux see all suertes" ON public.suertes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol IN ('admin', 'analista', 'auxiliar'))
);

DROP POLICY IF EXISTS "Zone Managers see their zone" ON public.suertes;
CREATE POLICY "Zone Managers see their zone" ON public.suertes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol = 'jefe_zona' AND (u.zona IS NULL OR u.zona = suertes.zona))
);

DROP POLICY IF EXISTS "Technicians see their haciendas" ON public.suertes;
CREATE POLICY "Technicians see their haciendas" ON public.suertes FOR SELECT USING (
  EXISTS (
      SELECT 1 FROM public.usuarios u 
      WHERE u.id = auth.uid() 
      AND u.rol = 'tecnico' 
      AND suertes.hacienda = ANY(u.hacienda_asignada)
  )
);

-- MAQUINARIA
DROP POLICY IF EXISTS "Operators see own machinery" ON public.maquinaria;
CREATE POLICY "Operators see own machinery" ON public.maquinaria FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico'))
  OR contratista_id = auth.uid()
);

-- ASIGNACIONES
DROP POLICY IF EXISTS "Operators see own assignments" ON public.asignaciones;
CREATE POLICY "Operators see own assignments" ON public.asignaciones FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.maquinaria m
    WHERE m.id = asignaciones.maquina_id
    AND m.contratista_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = auth.uid() AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico'))
);

DROP POLICY IF EXISTS "Operators can update own assignments" ON public.asignaciones;
CREATE POLICY "Operators can update own assignments" ON public.asignaciones FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.maquinaria m
    WHERE m.id = asignaciones.maquina_id
    AND m.contratista_id = auth.uid()
  )
);
