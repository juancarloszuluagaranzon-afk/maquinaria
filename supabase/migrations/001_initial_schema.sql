-- 001_initial_schema.sql
-- Generado por: Supabase Architect Skill
-- Descripción: Esquema inicial para el Proyecto Riopaila (Gestión de Maquinaria)
-- Seguridad: RLS habilitado en todas las tablas. Políticas permisivas para desarrollo.

-- Asegurar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USUARIOS (Extensión de auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL CHECK (rol IN ('admin', 'jefe_zona', 'tecnico', 'analista', 'operador', 'contratista')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: Public Access Usuarios" ON public.usuarios
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 2. SUERTES (Mapeo CSV Compatibility)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suertes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE, -- Mapped from SUERTE
    hacienda TEXT NOT NULL,      -- Mapped from FINCA
    zona TEXT NOT NULL,          -- Mapped from ZONA
    area_neta NUMERIC(10, 2),    -- Mapped from AREA
    edad NUMERIC(10, 2),         -- Mapped from EDAD
    corte TEXT,                  -- Mapped from NUMERO DE CORTE
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.suertes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dev: Public Access Suertes" ON public.suertes
    FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 3. CATALOGOS (Labores, Actividades, Prioridades, Maquinaria, Contratistas)
-- ==============================================================================

-- Labores (Macro-actividades)
CREATE TABLE IF NOT EXISTS public.labores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.labores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Labores" ON public.labores FOR ALL USING (true) WITH CHECK (true);

-- Actividades (Detalle)
CREATE TABLE IF NOT EXISTS public.actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    labor_id UUID REFERENCES public.labores(id),
    nombre TEXT NOT NULL,
    codigo_nomina TEXT, -- Para integración futura
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Actividades" ON public.actividades FOR ALL USING (true) WITH CHECK (true);

-- Prioridades
CREATE TABLE IF NOT EXISTS public.prioridades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL UNIQUE, -- Alta, Media, Baja, Emergencia
    nivel INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.prioridades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Prioridades" ON public.prioridades FOR ALL USING (true) WITH CHECK (true);

-- Maquinaria
CREATE TABLE IF NOT EXISTS public.maquinaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL, -- Tractor, Cosechadora, Implemento
    estado TEXT DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'MANTENIMIENTO', 'BAJA')),
    horometro_actual NUMERIC(10, 1) DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.maquinaria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Maquinaria" ON public.maquinaria FOR ALL USING (true) WITH CHECK (true);

-- Contratistas
CREATE TABLE IF NOT EXISTS public.contratistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    nit TEXT,
    activo BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contratistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Contratistas" ON public.contratistas FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 4. TRANSACCIONALES (Programaciones, Ejecuciones, Notificaciones)
-- ==============================================================================

-- Programaciones (La Orden de Trabajo)
CREATE TABLE IF NOT EXISTS public.programaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suerte_id UUID REFERENCES public.suertes(id) NOT NULL,
    labor_id UUID REFERENCES public.labores(id) NOT NULL,
    actividad_id UUID REFERENCES public.actividades(id),
    prioridad_id UUID REFERENCES public.prioridades(id),
    
    usuario_responsable_id UUID REFERENCES public.usuarios(id), -- Quien solicita/supervisa
    
    fecha_programada DATE NOT NULL,
    fecha_limite DATE,
    
    estado TEXT NOT NULL DEFAULT 'PENDIENTE' 
        CHECK (estado IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'PROGRAMADO', 'EN_EJECUCION', 'DETENIDO', 'FINALIZADO', 'CANCELADO')),
    
    -- Audit
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.programaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Programaciones" ON public.programaciones FOR ALL USING (true) WITH CHECK (true);

-- Ejecuciones (El registro real del trabajo)
CREATE TABLE IF NOT EXISTS public.ejecuciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programacion_id UUID REFERENCES public.programaciones(id) NOT NULL,
    
    maquinaria_id UUID REFERENCES public.maquinaria(id),
    operador_id UUID REFERENCES public.usuarios(id),
    
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ,
    
    horometro_inicio NUMERIC(10, 1),
    horometro_fin NUMERIC(10, 1),
    
    observaciones TEXT,
    
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ejecuciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Ejecuciones" ON public.ejecuciones FOR ALL USING (true) WITH CHECK (true);

-- Notificaciones
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.usuarios(id) NOT NULL,
    titulo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    tipo TEXT DEFAULT 'INFO', -- INFO, ALERT, WARNING, SUCCESS
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dev: Public Access Notificaciones" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. AUDITORIA BASICA (Trigger para updated_at)
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_programaciones_modtime BEFORE UPDATE ON public.programaciones FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
