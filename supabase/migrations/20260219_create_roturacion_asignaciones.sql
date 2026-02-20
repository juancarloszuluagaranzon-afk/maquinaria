CREATE TABLE IF NOT EXISTS public.roturacion_asignaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roturacion_id UUID NOT NULL REFERENCES public.roturacion_seguimiento(id) ON DELETE CASCADE,
    contratista_id UUID NOT NULL REFERENCES public.contratistas(id),
    labor TEXT NOT NULL CHECK (labor IN ('1RA', '2DA', 'FER')),
    area_asignada NUMERIC(10, 2) NOT NULL DEFAULT 0,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.roturacion_asignaciones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Analistas pueden crear asignaciones"
ON public.roturacion_asignaciones FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE usuarios.id = auth.uid()
        AND usuarios.rol IN ('analista', 'admin')
    )
);

CREATE POLICY "Todos pueden ver asignaciones"
ON public.roturacion_asignaciones FOR SELECT
TO authenticated
USING (true);

-- Indexes
CREATE INDEX idx_roturacion_asignaciones_roturacion_id ON public.roturacion_asignaciones(roturacion_id);
CREATE INDEX idx_roturacion_asignaciones_contratista_id ON public.roturacion_asignaciones(contratista_id);
