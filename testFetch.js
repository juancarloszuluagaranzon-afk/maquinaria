import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    const { data, error } = await supabase
        .from('roturacion_asignaciones')
        .select(`
            *,
            contratista:contratistas!roturacion_asignaciones_contratista_id_fkey (nombre),
            roturacion_seguimiento (
                id,
                estado_1ra_labor,
                estado_2da_labor,
                estado_fertilizacion,
                area_avance_1ra,
                area_avance_2da,
                area_avance_fertilizacion,
                area_programada_1ra,
                area_programada_2da,
                area_programada_fer,
                suertes (codigo, hacienda, area_neta, zona)
            )
        `)
        .order('created_at', { ascending: false });

    console.log("Error:", error);
    console.log("Data count:", data ? data.length : 0);
    if (data && data.length > 0) {
        console.log("Sample:", JSON.stringify(data[0], null, 2));
    }
}
testFetch();
