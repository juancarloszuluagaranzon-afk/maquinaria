-- ==============================================================
-- SELECTIVE NOTIFICATIONS - 20260221
-- Añade soporte para filtrado por zona y hacienda
-- ==============================================================

BEGIN;

-- 1. Actualizar tabla notificaciones
ALTER TABLE public.notificaciones 
ADD COLUMN IF NOT EXISTS zona_id INTEGER,
ADD COLUMN IF NOT EXISTS hacienda TEXT;

-- 2. Actualizar fn_notify_ejecucion_machinery
CREATE OR REPLACE FUNCTION public.fn_notify_ejecucion_machinery()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_equipo TEXT;
    v_codigo_suerte TEXT;
    v_hacienda TEXT;
    v_zona_text TEXT;
    v_zona_id INTEGER;
    v_user_name TEXT;
    v_duration INTERVAL;
BEGIN
    -- Obtener info extra de la maquinaria y la suerte
    SELECT nombre INTO v_nombre_equipo FROM public.maquinaria WHERE id = NEW.maquinaria_id;
    
    SELECT s.codigo, s.hacienda, s.zona 
    INTO v_codigo_suerte, v_hacienda, v_zona_text
    FROM public.programaciones p 
    JOIN public.suertes s ON p.suerte_id = s.id 
    WHERE p.id = NEW.programacion_id;
    
    SELECT nombre INTO v_user_name FROM public.usuarios WHERE id = NEW.operador_id;

    -- Convertir zona de texto a ID si es posible (ej: 'ZONA 1' -> 1)
    -- Si el campo ya es un número o tiene formato 'ZONA X', intentamos extraerlo.
    BEGIN
        v_zona_id := CASE 
            WHEN v_zona_text ~ '^\d+$' THEN v_zona_text::INTEGER
            WHEN v_zona_text ~* 'zona\s+\d+' THEN (regexp_replace(v_zona_text, '[^0-9]', '', 'g'))::INTEGER
            ELSE NULL
        END;
    EXCEPTION WHEN OTHERS THEN
        v_zona_id := NULL;
    END;

    -- Detección de INICIO
    IF (OLD.inicio IS NULL OR OLD.inicio IS DISTINCT FROM NEW.inicio) AND NEW.inicio IS NOT NULL AND OLD.fin IS NULL AND NEW.fin IS NULL THEN
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
        VALUES (
            'Labor Iniciada',
            COALESCE(v_user_name, 'Un operador') || ' inició labor con ' || COALESCE(v_nombre_equipo, 'maquinaria') || ' en suerte ' || COALESCE(v_codigo_suerte, ''),
            'INICIO',
            jsonb_build_object('equipo', v_nombre_equipo, 'suerte', v_codigo_suerte, 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id,
            v_zona_id,
            v_hacienda
        );
    END IF;

    -- Detección de FIN
    IF OLD.fin IS NULL AND NEW.fin IS NOT NULL THEN
        v_duration := NEW.fin - NEW.inicio;
        
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
        VALUES (
            'Labor Finalizada',
            COALESCE(v_user_name, 'Un operador') || ' terminó labor con ' || COALESCE(v_nombre_equipo, 'maquinaria') || ' en suerte ' || COALESCE(v_codigo_suerte, '') || '. Duración: ' || floor(extract(epoch from v_duration)/60) || ' min',
            'FIN',
            jsonb_build_object('equipo', v_nombre_equipo, 'suerte', v_codigo_suerte, 'duracion_min', floor(extract(epoch from v_duration)/60), 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id,
            v_zona_id,
            v_hacienda
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Actualizar fn_notify_ejecucion_roturacion
CREATE OR REPLACE FUNCTION public.fn_notify_ejecucion_roturacion()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_contratista TEXT;
    v_codigo_suerte TEXT;
    v_hacienda TEXT;
    v_zona_text TEXT;
    v_zona_id INTEGER;
    v_labor_label TEXT;
    v_duration INTERVAL;
BEGIN
    -- Obtener info extra
    SELECT c.nombre, ra.labor INTO v_nombre_contratista, v_labor_label
    FROM public.roturacion_asignaciones ra
    JOIN public.contratistas c ON ra.contratista_id = c.id
    WHERE ra.id = NEW.asignacion_id;

    SELECT s.codigo, s.hacienda, s.zona 
    INTO v_codigo_suerte, v_hacienda, v_zona_text
    FROM public.roturacion_asignaciones ra
    JOIN public.roturacion_seguimiento rs ON ra.roturacion_id = rs.id
    JOIN public.suertes s ON rs.suerte_id = s.id
    WHERE ra.id = NEW.asignacion_id;

    -- Conversión de zona
    BEGIN
        v_zona_id := CASE 
            WHEN v_zona_text ~ '^\d+$' THEN v_zona_text::INTEGER
            WHEN v_zona_text ~* 'zona\s+\d+' THEN (regexp_replace(v_zona_text, '[^0-9]', '', 'g'))::INTEGER
            ELSE NULL
        END;
    EXCEPTION WHEN OTHERS THEN
        v_zona_id := NULL;
    END;

    -- Detección de INICIO
    IF (OLD.inicio IS NULL OR OLD.inicio IS DISTINCT FROM NEW.inicio) AND NEW.inicio IS NOT NULL AND OLD.fin IS NULL AND NEW.fin IS NULL THEN
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
        VALUES (
            'Labor Roturación Iniciada',
            COALESCE(v_nombre_contratista, 'Un contratista') || ' inició ' || COALESCE(v_labor_label, 'labor') || ' en suerte ' || COALESCE(v_codigo_suerte, ''),
            'INICIO',
            jsonb_build_object('equipo', v_nombre_contratista, 'suerte', v_codigo_suerte, 'labor', v_labor_label, 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id,
            v_zona_id,
            v_hacienda
        );
    END IF;

    -- Detección de FIN
    IF OLD.fin IS NULL AND NEW.fin IS NOT NULL THEN
        v_duration := NEW.fin - NEW.inicio;
        
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
        VALUES (
            'Labor Roturación Finalizada',
            COALESCE(v_nombre_contratista, 'Un contratista') || ' terminó ' || COALESCE(v_labor_label, 'labor') || ' en suerte ' || COALESCE(v_codigo_suerte, '') || '. Duración: ' || floor(extract(epoch from v_duration)/60) || ' min',
            'FIN',
            jsonb_build_object('equipo', v_nombre_contratista, 'suerte', v_codigo_suerte, 'labor', v_labor_label, 'duracion_min', floor(extract(epoch from v_duration)/60), 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id,
            v_zona_id,
            v_hacienda
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
