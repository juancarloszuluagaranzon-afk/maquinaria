-- ==============================================================================
-- 6. ROTURACION RLS POLICIES
-- ==============================================================================

-- Enable RLS (Should be on, but safe to repeat)
ALTER TABLE public.roturacion_seguimiento ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- POLICIES
-- ------------------------------------------------------------------------------

-- 1. Admin / Analista / Auxiliar: SEE ALL
DROP POLICY IF EXISTS "Admins/Aux see all roturacion" ON public.roturacion_seguimiento;
CREATE POLICY "Admins/Aux see all roturacion" 
ON public.roturacion_seguimiento FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'analista', 'auxiliar')
  )
);

-- 2. Zone Managers: SEE ZONE
DROP POLICY IF EXISTS "Jefes see their zone roturacion" ON public.roturacion_seguimiento;
CREATE POLICY "Jefes see their zone roturacion" 
ON public.roturacion_seguimiento FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.suertes s ON s.id = roturacion_seguimiento.suerte_id
    WHERE u.id = auth.uid() 
    AND u.rol = 'jefe_zona'
    AND (u.zona IS NULL OR u.zona = s.zona)
  )
);

-- 3. Technicians: SEE ASSIGNED HACIENDAS
DROP POLICY IF EXISTS "Techs see their haciendas roturacion" ON public.roturacion_seguimiento;
CREATE POLICY "Techs see their haciendas roturacion" 
ON public.roturacion_seguimiento FOR ALL -- Allow update too? Yes, they report status.
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.suertes s ON s.id = roturacion_seguimiento.suerte_id
    WHERE u.id = auth.uid() 
    AND u.rol = 'tecnico'
    AND s.hacienda = ANY(u.hacienda_asignada)
  )
);
