-- 115_update_ejecuciones_operator.sql
-- Descripción: Actualiza la tabla ejecuciones para soportar flujo de Operador (GPS, Tipos, Programación Opcional)

-- 1. Hacer programacion_id opcional para permitir registros ad-hoc (Traslados/Emergencias)
ALTER TABLE public.ejecuciones ALTER COLUMN programacion_id DROP NOT NULL;

-- 2. Agregar columnas de GPS
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS lat_inicio NUMERIC(10, 7);
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS lon_inicio NUMERIC(10, 7);
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS lat_fin NUMERIC(10, 7);
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS lon_fin NUMERIC(10, 7);

-- 3. Agregar tipo de ejecución
ALTER TABLE public.ejecuciones ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'LABOR';
ALTER TABLE public.ejecuciones ADD CONSTRAINT check_tipo_ejecucion CHECK (tipo IN ('LABOR', 'TRASLADO', 'EMERGENCIA'));

-- 4. Indices para mejorar consultas
CREATE INDEX IF NOT EXISTS idx_ejecuciones_tipo ON public.ejecuciones(tipo);
