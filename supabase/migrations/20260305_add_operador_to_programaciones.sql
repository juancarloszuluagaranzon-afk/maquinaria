-- 20260305_add_operador_to_programaciones.sql
-- Adiciona la columna operador_id a la tabla programaciones

ALTER TABLE public.programaciones
ADD COLUMN IF NOT EXISTS operador_id UUID REFERENCES public.usuarios(id);
