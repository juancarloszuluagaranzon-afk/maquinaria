-- ==============================================================================
-- 4. FIX SCHEMA (Add Email)
-- ==============================================================================

ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
