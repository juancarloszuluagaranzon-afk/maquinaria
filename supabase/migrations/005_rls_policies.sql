-- ==============================================================================
-- 5. RLS POLICIES (Data Visibility)
-- ==============================================================================

-- Enable RLS on key tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suertes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinaria ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- USUARIOS (Users)
-- ------------------------------------------------------------------------------

-- Policy: Users can see themselves
CREATE POLICY "Users can see their own profile" 
ON public.usuarios FOR SELECT 
USING (auth.uid() = id);

-- Policy: Admins, Analysts, Zone Managers can see all users (for assignment/management)
CREATE POLICY "Admins/Analysts/Jefes can view all users" 
ON public.usuarios FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'analista', 'jefe_zona', 'auxiliar')
  )
);

-- ------------------------------------------------------------------------------
-- SUERTES (Farms/Lots)
-- ------------------------------------------------------------------------------

-- Policy: Admins/Analysts/Auxiliars see all
CREATE POLICY "Admins/Analysts/Aux see all suertes" 
ON public.suertes FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE id = auth.uid() 
    AND rol IN ('admin', 'analista', 'auxiliar')
  )
);

-- Policy: Zone Managers see suertes in their ZONE (or all if zona is NULL)
CREATE POLICY "Zone Managers see their zone" 
ON public.suertes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() 
    AND u.rol = 'jefe_zona'
    AND (u.zona IS NULL OR u.zona = suertes.zona)
  )
);

-- Policy: Technicians see suertes in their ASSIGNED HACIENDAS
CREATE POLICY "Technicians see their haciendas" 
ON public.suertes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() 
    AND u.rol = 'tecnico'
    -- Check if suertes.hacienda is in the user's hacienda_asignada array
    AND suertes.hacienda = ANY(u.hacienda_asignada)
  )
);

-- ------------------------------------------------------------------------------
-- MAQUINARIA (Machinery)
-- ------------------------------------------------------------------------------

-- Policy: Operators only see their OWN machinery (linked via contratista_id?? OR just public for now?)
-- Ideally machinery has a 'propietario' field. 
-- Schema says `contratista_id` (uuid). Let's assume this links to auth.users.id
CREATE POLICY "Operators see own machinery" 
ON public.maquinaria FOR SELECT 
USING (
  -- If user is admin/analyst/jefe/tecnico, see all
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() 
    AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
  )
  OR
  -- If user is operator, see machinery where they are the contractor
  contratista_id = auth.uid()
);

-- ------------------------------------------------------------------------------
-- ASIGNACIONES (Job Assignments)
-- ------------------------------------------------------------------------------

-- Policy: Operators see assignments for their COMPANY (Empresa)
-- We need to link Asignacion -> Maquinaria -> Contratista(User) -> Empresa?
-- OR Asignacion -> Maquinaria -> Contratista_id = auth.uid() (Simpler)

CREATE POLICY "Operators see own assignments" 
ON public.asignaciones FOR SELECT 
USING (
  -- Asignacion has `maquina_id`. Maquinaria has `contratista_id`.
  EXISTS (
    SELECT 1 FROM public.maquinaria m
    WHERE m.id = asignaciones.maquina_id
    AND m.contratista_id = auth.uid()
  )
  OR
  -- Staff sees all
  EXISTS (
    SELECT 1 FROM public.usuarios u
    WHERE u.id = auth.uid() 
    AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
  )
);

-- Policy: Operators can UPDATE assignments (e.g. start/finish) if they own the machine
CREATE POLICY "Operators can update own assignments" 
ON public.asignaciones FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.maquinaria m
    WHERE m.id = asignaciones.maquina_id
    AND m.contratista_id = auth.uid()
  )
);
