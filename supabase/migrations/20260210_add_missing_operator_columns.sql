-- 20260210_add_missing_operator_columns.sql
-- Descripción: Agrega columnas faltantes para el flujo de operador (horometros y maquinaria_id)

ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS horometro_inicio NUMERIC(10, 1);
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS horometro_fin NUMERIC(10, 1);
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS maquinaria_id UUID REFERENCES public.maquinaria(id);
