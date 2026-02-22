-- ==============================================================
-- FIX NOTIFICATION TRIGGERS - 20260220_2
-- Corrige el error de "null value in column usuario_id"
-- ==============================================================

BEGIN;

-- 1. Actualizar fn_notify_ejecucion_machinery
CREATE OR REPLACE FUNCTION public.fn_notify_ejecucion_machinery()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_equipo TEXT;
    v_codigo_suerte TEXT;
    v_user_name TEXT;
    v_duration INTERVAL;
BEGIN
    -- Obtener info extra
    SELECT nombre INTO v_nombre_equipo FROM public.maquinaria WHERE id = NEW.maquinaria_id;
    SELECT s.codigo INTO v_codigo_suerte 
    FROM public.programaciones p 
    JOIN public.suertes s ON p.suerte_id = s.id 
    WHERE p.id = NEW.programacion_id;
    SELECT nombre INTO v_user_name FROM public.usuarios WHERE id = NEW.operador_id;

    -- Detección de INICIO
    IF (OLD.inicio IS NULL OR OLD.inicio IS DISTINCT FROM NEW.inicio) AND NEW.inicio IS NOT NULL AND OLD.fin IS NULL AND NEW.fin IS NULL THEN
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id)
        VALUES (
            'Labor Iniciada',
            COALESCE(v_user_name, 'Un operador') || ' inició labor con ' || COALESCE(v_nombre_equipo, 'maquinaria') || ' en suerte ' || COALESCE(v_codigo_suerte, ''),
            'INICIO',
            jsonb_build_object('equipo', v_nombre_equipo, 'suerte', v_codigo_suerte, 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id -- Sincronizar usuario_id para cumplir constraint
        );
    END IF;

    -- Detección de FIN
    IF OLD.fin IS NULL AND NEW.fin IS NOT NULL THEN
        v_duration := NEW.fin - NEW.inicio;
        
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id)
        VALUES (
            'Labor Finalizada',
            COALESCE(v_user_name, 'Un operador') || ' terminó labor con ' || COALESCE(v_nombre_equipo, 'maquinaria') || ' en suerte ' || COALESCE(v_codigo_suerte, '') || '. Duración: ' || floor(extract(epoch from v_duration)/60) || ' min',
            'FIN',
            jsonb_build_object('equipo', v_nombre_equipo, 'suerte', v_codigo_suerte, 'duracion_min', floor(extract(epoch from v_duration)/60), 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id -- Sincronizar usuario_id para cumplir constraint
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Actualizar fn_notify_ejecucion_roturacion
CREATE OR REPLACE FUNCTION public.fn_notify_ejecucion_roturacion()
RETURNS TRIGGER AS $$
DECLARE
    v_nombre_contratista TEXT;
    v_codigo_suerte TEXT;
    v_labor_label TEXT;
    v_duration INTERVAL;
BEGIN
    -- Obtener info extra
    SELECT c.nombre INTO v_nombre_contratista 
    FROM public.roturacion_asignaciones ra
    JOIN public.contratistas c ON ra.contratista_id = c.id
    WHERE ra.id = NEW.asignacion_id;

    SELECT s.codigo INTO v_codigo_suerte 
    FROM public.roturacion_asignaciones ra
    JOIN public.roturacion_seguimiento rs ON ra.roturacion_id = rs.id
    JOIN public.suertes s ON rs.suerte_id = s.id
    WHERE ra.id = NEW.asignacion_id;

    SELECT labor INTO v_labor_label FROM public.roturacion_asignaciones WHERE id = NEW.asignacion_id;

    -- Detección de INICIO
    IF (OLD.inicio IS NULL OR OLD.inicio IS DISTINCT FROM NEW.inicio) AND NEW.inicio IS NOT NULL AND OLD.fin IS NULL AND NEW.fin IS NULL THEN
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id)
        VALUES (
            'Labor Roturación Iniciada',
            COALESCE(v_nombre_contratista, 'Un contratista') || ' inició ' || COALESCE(v_labor_label, 'labor') || ' en suerte ' || COALESCE(v_codigo_suerte, ''),
            'INICIO',
            jsonb_build_object('equipo', v_nombre_contratista, 'suerte', v_codigo_suerte, 'labor', v_labor_label, 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id -- Sincronizar usuario_id para cumplir constraint
        );
    END IF;

    -- Detección de FIN
    IF OLD.fin IS NULL AND NEW.fin IS NOT NULL THEN
        v_duration := NEW.fin - NEW.inicio;
        
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id)
        VALUES (
            'Labor Roturación Finalizada',
            COALESCE(v_nombre_contratista, 'Un contratista') || ' terminó ' || COALESCE(v_labor_label, 'labor') || ' en suerte ' || COALESCE(v_codigo_suerte, '') || '. Duración: ' || floor(extract(epoch from v_duration)/60) || ' min',
            'FIN',
            jsonb_build_object('equipo', v_nombre_contratista, 'suerte', v_codigo_suerte, 'labor', v_labor_label, 'duracion_min', floor(extract(epoch from v_duration)/60), 'operador_id', NEW.operador_id),
            NEW.operador_id,
            NEW.operador_id -- Sincronizar usuario_id para cumplir constraint
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
