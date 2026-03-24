-- ==============================================================================
-- 20260320_fix_roturacion_ejecuciones_rls.sql
-- Agrega políticas RLS a roturacion_ejecuciones para que los técnicos puedan
-- verlas y firmarlas, y los operadores/contratistas puedan ver sus propias ejecuciones.
-- ==============================================================================

BEGIN;

-- 1. Habilitar RLS si no está habilitado (por si acaso)
ALTER TABLE public.roturacion_ejecuciones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas previas si existieran
DROP POLICY IF EXISTS "Contractors, operators and staff view roturacion_ejecuciones" ON public.roturacion_ejecuciones;
DROP POLICY IF EXISTS "Operadores insert roturacion_ejecuciones" ON public.roturacion_ejecuciones;
DROP POLICY IF EXISTS "Operadores y tecnicos update roturacion_ejecuciones" ON public.roturacion_ejecuciones;

-- 3. SELECT: Contratistas, operadores y personal interno ven las ejecuciones
CREATE POLICY "Contractors, operators and staff view roturacion_ejecuciones"
ON public.roturacion_ejecuciones FOR SELECT
USING (
  -- Contratistas (tienen usuario_id en tabla contratistas)
  EXISTS (
    SELECT 1 FROM public.roturacion_asignaciones ra
    JOIN public.contratistas c ON c.id = ra.contratista_id
    WHERE ra.id = roturacion_ejecuciones.asignacion_id
      AND c.usuario_id = auth.uid()
  )
  OR
  -- Operadores (vinculados al contratista por empresa)
  EXISTS (
    SELECT 1 FROM public.usuarios u
    JOIN public.contratistas c ON c.nombre = u.empresa
    JOIN public.roturacion_asignaciones ra ON ra.contratista_id = c.id
    WHERE u.id = auth.uid()
      AND u.rol = 'operador'
      AND ra.id = roturacion_ejecuciones.asignacion_id
  )
  OR
  -- El operador mismo que creó la ejecución
  operador_id = auth.uid()
  OR
  -- Personal interno ve todo
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
  )
);

-- 4. INSERT: Operadores o personal interno pueden insertar
CREATE POLICY "Operadores insert roturacion_ejecuciones"
ON public.roturacion_ejecuciones FOR INSERT
WITH CHECK (
  operador_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.rol IN ('admin', 'analista', 'tecnico')
  )
);

-- 5. UPDATE: Operadores (para finalizar) o Técnicos (para firmar)
CREATE POLICY "Operadores y tecnicos update roturacion_ejecuciones"
ON public.roturacion_ejecuciones FOR UPDATE
USING (
  operador_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.rol IN ('admin', 'analista', 'tecnico')
  )
);

COMMIT;
