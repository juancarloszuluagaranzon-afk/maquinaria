-- ==============================================================================
-- 20260304_RLS_CONTRACTOR_ISOLATION.sql
-- Enforces row level security for contractors based on contractor-data-isolation skill
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. FIX: PROGRAMACIONES
-- ------------------------------------------------------------------------------
-- First, drop the broad "Staff can view all programaciones" if we are redefining it,
-- or rather add a specific policy for contractors.
-- The existing policies allow Technicians to select their own and Staff to select all.
-- We must make sure Operators/Contractors can select their own.

DROP POLICY IF EXISTS "Contractors see own programaciones" ON public.programaciones;
CREATE POLICY "Contractors see own programaciones" 
ON public.programaciones FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contratistas c 
    WHERE c.usuario_id = auth.uid() 
    AND c.id = programaciones.contratista_id
  )
);

-- We also need to let Contractors UPDATE their own programaciones to change status to 'EN_EJECUCION' or 'FINALIZADO'
DROP POLICY IF EXISTS "Contractors can update own programaciones" ON public.programaciones;
CREATE POLICY "Contractors can update own programaciones" 
ON public.programaciones FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.contratistas c 
    WHERE c.usuario_id = auth.uid() 
    AND c.id = programaciones.contratista_id
  )
);


-- ------------------------------------------------------------------------------
-- 2. FIX: ROTURACION_ASIGNACIONES
-- ------------------------------------------------------------------------------
-- Current policy allows public access for authenticated users.
-- We will drop it and create a secure one.

DROP POLICY IF EXISTS "Todos pueden ver asignaciones" ON public.roturacion_asignaciones;

CREATE POLICY "Users can view roturacion asignaciones securely" 
ON public.roturacion_asignaciones FOR SELECT 
USING (
    -- Contractors only see their own assignments
    EXISTS (
        SELECT 1 FROM public.contratistas c
        WHERE c.usuario_id = auth.uid()
        AND c.id = roturacion_asignaciones.contratista_id
    )
    OR 
    -- Staff can see all
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() 
        AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
    )
);

COMMIT;
