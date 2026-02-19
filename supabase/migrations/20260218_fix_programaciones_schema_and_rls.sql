-- 20260218_programaciones_schema_fix.sql
-- Description: Updates programaciones constraints to allow 'PENDIENTE_APROBACION' and adds RLS policies.

-- 1. Update 'estado' Check Constraint
ALTER TABLE public.programaciones DROP CONSTRAINT IF EXISTS programaciones_estado_check;

ALTER TABLE public.programaciones 
ADD CONSTRAINT programaciones_estado_check 
CHECK (estado IN ('PENDIENTE', 'PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'PROGRAMADO', 'EN_EJECUCION', 'DETENIDO', 'FINALIZADO', 'CANCELADO'));

-- 2. Add RLS Policies
-- First, drop dev policy if it exists to clean up
DROP POLICY IF EXISTS "Dev: Public Access Programaciones" ON public.programaciones;

-- Technicians: Insert & Select Own
CREATE POLICY "Technicians can insert own programaciones" 
ON public.programaciones FOR INSERT 
WITH CHECK (auth.uid() = usuario_responsable_id);

CREATE POLICY "Technicians can select own programaciones" 
ON public.programaciones FOR SELECT 
USING (auth.uid() = usuario_responsable_id);

-- Staff: View All
CREATE POLICY "Staff can view all programaciones" 
ON public.programaciones FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'analista', 'jefe_zona', 'auxiliar')
  )
);

-- Staff: Update (Approve/Reject)
CREATE POLICY "Staff can update programaciones" 
ON public.programaciones FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'analista', 'jefe_zona', 'auxiliar')
  )
);
