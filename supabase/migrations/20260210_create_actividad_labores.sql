-- Create Junction Table
CREATE TABLE IF NOT EXISTS actividad_labores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actividad_id UUID REFERENCES actividades(id) ON DELETE CASCADE,
    labor_id UUID REFERENCES labores(id) ON DELETE CASCADE,
    UNIQUE(actividad_id, labor_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_actividad_labores_actividad ON actividad_labores(actividad_id);
CREATE INDEX IF NOT EXISTS idx_actividad_labores_labor ON actividad_labores(labor_id);

-- Ensure Actividades has necessary columns (assuming they exist from previous check, but being safe)
-- ALTER TABLE actividades ADD COLUMN IF NOT EXISTS codigo INTEGER;
-- ALTER TABLE actividades ADD COLUMN IF NOT EXISTS nombre TEXT;
