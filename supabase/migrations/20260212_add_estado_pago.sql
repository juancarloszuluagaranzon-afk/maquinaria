ALTER TABLE public.programaciones 
ADD COLUMN IF NOT EXISTS estado_pago TEXT DEFAULT 'PENDIENTE' 
CHECK (estado_pago IN ('PENDIENTE', 'PAGADO'));
