-- ==============================================================================
-- 20260305_FIX_OPERATOR_RLS.sql
-- Extiende las políticas RLS de programaciones y roturacion_asignaciones
-- para que los operadores (rol='operador') puedan ver las asignaciones
-- de su empresa, resolviendo el bloqueo total que experimentaban.
-- 
-- Lógica: los operadores se vinculan a contratistas via usuarios.empresa = contratistas.nombre
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. PROGRAMACIONES
--    Reemplaza la política "Contractors see own programaciones" para también
--    incluir a usuarios con rol='operador' cuya empresa coincide con el contratista.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Contractors see own programaciones" ON public.programaciones;

CREATE POLICY "Contractors and operators see own programaciones"
ON public.programaciones FOR SELECT
USING (
  -- Contratistas: tienen usuario_id en la tabla contratistas
  EXISTS (
    SELECT 1 FROM public.contratistas c
    WHERE c.usuario_id = auth.uid()
      AND c.id = programaciones.contratista_id
  )
  OR
  -- Operadores: se vinculan al contratista a través de usuarios.empresa = contratistas.nombre
  EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.contratistas c ON c.nombre = u.empresa
    WHERE u.id = auth.uid()
      AND u.rol = 'operador'
      AND c.id = programaciones.contratista_id
  )
  OR
  -- Personal interno (admin, analista, jefe_zona, tecnico) ve todo
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
  )
);

-- La política de UPDATE para contratistas se mantiene igual (no cambia para operadores)
-- Ya existe: "Contractors can update own programaciones"

-- ------------------------------------------------------------------------------
-- 2. ROTURACION_ASIGNACIONES
--    Reemplaza la política existente para incluir también a operadores.
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view roturacion asignaciones securely" ON public.roturacion_asignaciones;

CREATE POLICY "Contractors and operators view roturacion asignaciones"
ON public.roturacion_asignaciones FOR SELECT
USING (
  -- Contratistas
  EXISTS (
    SELECT 1 FROM public.contratistas c
    WHERE c.usuario_id = auth.uid()
      AND c.id = roturacion_asignaciones.contratista_id
  )
  OR
  -- Operadores
  EXISTS (
    SELECT 1
    FROM public.usuarios u
    JOIN public.contratistas c ON c.nombre = u.empresa
    WHERE u.id = auth.uid()
      AND u.rol = 'operador'
      AND c.id = roturacion_asignaciones.contratista_id
  )
  OR
  -- Personal interno ve todo
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid()
      AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
  )
);

COMMIT;
