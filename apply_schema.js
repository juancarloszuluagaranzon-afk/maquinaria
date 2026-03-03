import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
});

async function run() {
    await client.connect();
    try {
        await client.query(`
      ALTER TABLE public.roturacion_ejecuciones ADD COLUMN IF NOT EXISTS recibo_url TEXT;
      ALTER TABLE public.roturacion_ejecuciones ADD COLUMN IF NOT EXISTS firma_tecnico_url TEXT;
      ALTER TABLE public.roturacion_ejecuciones ADD COLUMN IF NOT EXISTS fecha_firma_tecnico TIMESTAMPTZ;
      
      CREATE OR REPLACE FUNCTION public.fn_sign_roturacion(
          p_execution_id UUID,
          p_signature_url TEXT
      ) RETURNS VOID AS $$
      DECLARE
          v_user_role TEXT;
          v_user_id UUID;
          v_estado_actual TEXT;
          v_labor TEXT;
          v_seguimiento_id UUID;
      BEGIN
          -- 1. Get calling user
          v_user_id := auth.uid();
          IF v_user_id IS NULL THEN
              RAISE EXCEPTION 'No autorizado. Debe iniciar sesión.';
          END IF;

          -- 2. Verify Role
          SELECT rol INTO v_user_role FROM public.usuarios WHERE id = v_user_id;
          IF v_user_role NOT IN ('tecnico', 'admin', 'analista') THEN
              RAISE EXCEPTION 'Acceso denegado: Se requiere rol de técnico para firmar.';
          END IF;

          -- 3. Get Execution Details and validate State
          SELECT 
              rs.id,
              ra.labor,
              CASE 
                  WHEN ra.labor = '1RA' THEN rs.estado_1ra_labor
                  WHEN ra.labor = '2DA' THEN rs.estado_2da_labor
                  WHEN ra.labor = 'FER' THEN rs.estado_fertilizacion
              END as estado_actual
          INTO 
              v_seguimiento_id, v_labor, v_estado_actual
          FROM 
              public.roturacion_ejecuciones re
          JOIN 
              public.roturacion_asignaciones ra ON re.asignacion_id = ra.id
          JOIN 
              public.roturacion_seguimiento rs ON ra.roturacion_id = rs.id
          WHERE 
              re.id = p_execution_id;

          -- Permiso corregido para firmar parcial o terminado
          IF v_estado_actual NOT IN ('TERMINADO', 'PARCIAL') THEN
              RAISE EXCEPTION 'La labor debe estar en estado TERMINADO o PARCIAL para ser firmada.';
          END IF;

          -- 4. Apply Signature
          UPDATE public.roturacion_ejecuciones
          SET 
              firma_tecnico_url = p_signature_url,
              fecha_firma_tecnico = NOW()
          WHERE 
              id = p_execution_id;

      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      
      NOTIFY pgrst, 'reload schema';
    `);
        console.log("Success: Database schema updated and cache reloaded.");
    } catch (err) {
        console.error("Error updating schema:", err);
    } finally {
        await client.end();
    }
}

run();
