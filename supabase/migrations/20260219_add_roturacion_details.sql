-- 20260219_add_roturacion_details.sql
-- Description: Add programming details (date, soil condition) to roturacion_seguimiento

DO $$
BEGIN
    -- 1ra Labor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'fecha_programada_1ra') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN fecha_programada_1ra DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'condicion_terreno_1ra') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN condicion_terreno_1ra TEXT;
    END IF;

    -- 2da Labor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'fecha_programada_2da') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN fecha_programada_2da DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'condicion_terreno_2da') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN condicion_terreno_2da TEXT;
    END IF;

    -- Fertilizacion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'fecha_programada_fer') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN fecha_programada_fer DATE;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roturacion_seguimiento' AND column_name = 'condicion_terreno_fer') THEN
        ALTER TABLE public.roturacion_seguimiento ADD COLUMN condicion_terreno_fer TEXT;
    END IF;
END $$;
