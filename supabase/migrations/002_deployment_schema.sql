-- ==============================================================================
-- 2. DEPLOYMENT SCHEMA UPDATE
-- ==============================================================================

-- A. Update USUARIOS Table
-- ------------------------------------------------------------------------------
-- 1. Add 'empresa' and 'hacienda_asignada' columns
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS empresa TEXT,
ADD COLUMN IF NOT EXISTS hacienda_asignada TEXT[]; -- Array of strings for assigned haciendas

-- 2. Update 'rol' check constraint to include 'auxiliar'
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('admin', 'jefe_zona', 'tecnico', 'analista', 'operador', 'contratista', 'auxiliar'));

-- B. Security Policies (RLS)
-- ------------------------------------------------------------------------------
-- (Optional: Add specific RLS here if not already handled by generic role policies)
-- For now, enforcing the schema structure is the priority.
-- Granular RLS will be applied in a separate secure migration if needed, 
-- or we rely on the application logic + basic row ownership for now (as requested to 'bypass sensitive keys' using the tool).

-- C. Indexes for Performance (Filtering by new columns)
CREATE INDEX IF NOT EXISTS idx_usuarios_empresa ON public.usuarios(empresa);
CREATE INDEX IF NOT EXISTS idx_usuarios_hacienda_asignada ON public.usuarios USING GIN(hacienda_asignada);

-- D. Comments
COMMENT ON COLUMN public.usuarios.empresa IS 'Empresa contratista a la que pertenece el usuario (ej: Serviretro)';
COMMENT ON COLUMN public.usuarios.hacienda_asignada IS 'Lista de haciendas específicas que el técnico puede gestionar';
