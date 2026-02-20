-- 20260219_fix_asignado_status_constraints.sql

BEGIN;

-- 1. Drop old constraints
ALTER TABLE public.roturacion_seguimiento DROP CONSTRAINT IF EXISTS roturacion_seguimiento_estado_1ra_labor_check;
ALTER TABLE public.roturacion_seguimiento DROP CONSTRAINT IF EXISTS roturacion_seguimiento_estado_2da_labor_check;
ALTER TABLE public.roturacion_seguimiento DROP CONSTRAINT IF EXISTS roturacion_seguimiento_estado_fertilizacion_check;

-- 2. Add new constraints including 'ASIGNADO'
ALTER TABLE public.roturacion_seguimiento
    ADD CONSTRAINT roturacion_seguimiento_estado_1ra_labor_check 
    CHECK (estado_1ra_labor IN ('PENDIENTE', 'PROGRAMADO', 'ASIGNADO', 'PARCIAL', 'TERMINADO'));

ALTER TABLE public.roturacion_seguimiento
    ADD CONSTRAINT roturacion_seguimiento_estado_2da_labor_check 
    CHECK (estado_2da_labor IN ('PENDIENTE', 'PROGRAMADO', 'ASIGNADO', 'PARCIAL', 'TERMINADO'));

ALTER TABLE public.roturacion_seguimiento
    ADD CONSTRAINT roturacion_seguimiento_estado_fertilizacion_check 
    CHECK (estado_fertilizacion IN ('PENDIENTE', 'PROGRAMADO', 'ASIGNADO', 'PARCIAL', 'TERMINADO'));

COMMIT;

-- Force schema reload
NOTIFY pgrst, 'reload config';
