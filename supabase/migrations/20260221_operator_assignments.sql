-- ==============================================================
-- OPERATOR ASSIGNMENT NOTIFICATIONS - 20260221
-- Triggers to notify contractors when they are assigned a labor
-- ==============================================================

BEGIN;

-- 1. Trigger for Machinery Assignment
CREATE OR REPLACE FUNCTION public.fn_notify_machinery_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_contractor_name TEXT;
    v_contractor_user_id UUID;
    v_codigo_suerte TEXT;
    v_hacienda TEXT;
    v_zona_text TEXT;
    v_labor_nombre TEXT;
BEGIN
    -- Check if status changed to ASIGNADO
    IF (OLD.estado IS DISTINCT FROM NEW.estado AND NEW.estado = 'ASIGNADO') THEN
        -- Get contractor name
        SELECT nombre INTO v_contractor_name FROM public.contratistas WHERE id = NEW.contratista_id;
        
        -- Get contractor user id
        SELECT id INTO v_contractor_user_id FROM public.usuarios WHERE empresa = v_contractor_name AND rol = 'operador' LIMIT 1;
        
        -- Get luck info
        SELECT codigo, hacienda, zona INTO v_codigo_suerte, v_hacienda, v_zona_text 
        FROM public.suertes WHERE id = NEW.suerte_id;
        
        -- Get labor info
        SELECT l.nombre INTO v_labor_nombre
        FROM public.actividades a
        JOIN public.labores l ON a.labor_id = l.id
        WHERE a.id = NEW.actividad_id;

        IF v_contractor_user_id IS NOT NULL THEN
            INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
            VALUES (
                'Nueva Asignación de Maquinaria',
                'Se le ha asignado la labor ' || COALESCE(v_labor_nombre, '') || ' en suerte ' || v_codigo_suerte || ' (' || v_hacienda || ')',
                'ASIGNACION',
                jsonb_build_object('programacion_id', NEW.id, 'suerte', v_codigo_suerte, 'hacienda', v_hacienda),
                COALESCE(auth.uid(), NEW.usuario_responsable_id),
                v_contractor_user_id,
                NULL, -- No zone filter needed for direct user notification
                v_hacienda
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_machinery_assignment ON public.programaciones;
CREATE TRIGGER tr_notify_machinery_assignment
AFTER UPDATE ON public.programaciones
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_machinery_assignment();

-- 2. Trigger for Roturacion Assignment
CREATE OR REPLACE FUNCTION public.fn_notify_roturacion_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_contractor_name TEXT;
    v_contractor_user_id UUID;
    v_codigo_suerte TEXT;
    v_hacienda TEXT;
    v_labor_label TEXT;
BEGIN
    -- Get contractor name
    SELECT nombre INTO v_contractor_name FROM public.contratistas WHERE id = NEW.contratista_id;
    
    -- Get contractor user id
    SELECT id INTO v_contractor_user_id FROM public.usuarios WHERE empresa = v_contractor_name AND rol = 'operador' LIMIT 1;
    
    -- Get luck info
    SELECT s.codigo, s.hacienda INTO v_codigo_suerte, v_hacienda 
    FROM public.roturacion_seguimiento rs
    JOIN public.suertes s ON rs.suerte_id = s.id
    WHERE rs.id = NEW.roturacion_id;
    
    v_labor_label := CASE 
        WHEN NEW.labor = '1RA' THEN '1ra Roturación'
        WHEN NEW.labor = '2DA' THEN '2da Roturación'
        WHEN NEW.labor = 'FER' THEN 'Fertilización'
        ELSE NEW.labor
    END;

    IF v_contractor_user_id IS NOT NULL THEN
        INSERT INTO public.notificaciones (titulo, mensaje, tipo, data, created_by, usuario_id, zona_id, hacienda)
        VALUES (
            'Nueva Asignación de Roturación',
            'Se le ha asignado la labor ' || v_labor_label || ' en suerte ' || v_codigo_suerte || ' (' || v_hacienda || ')',
            'ASIGNACION',
            jsonb_build_object('roturacion_id', NEW.roturacion_id, 'asignacion_id', NEW.id, 'suerte', v_codigo_suerte, 'hacienda', v_hacienda),
            COALESCE(auth.uid(), NEW.created_by),
            v_contractor_user_id,
            NULL,
            v_hacienda
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_roturacion_assignment ON public.roturacion_asignaciones;
CREATE TRIGGER tr_notify_roturacion_assignment
AFTER INSERT ON public.roturacion_asignaciones
FOR EACH ROW
EXECUTE FUNCTION public.fn_notify_roturacion_assignment();

COMMIT;
