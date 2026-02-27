import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const { data: rs } = await supabase.from('roturacion_seguimiento').select('id').limit(1);
        const rot_id = rs[0].id;

        const { data: cntrs } = await supabase.from('contratistas').select('id').limit(2);

        const records = [
            { roturacion_id: rot_id, contratista_id: cntrs[0].id, labor: '2DA', area_asignada: 2.5 },
            { roturacion_id: rot_id, contratista_id: cntrs[1].id, labor: '2DA', area_asignada: 2.5 }
        ];

        console.log("Inserting");
        // Using service key for direct insert would be better but we only have anon. Let's see if RLS blocks.
        const { data, error } = await supabase.from('roturacion_asignaciones').insert(records);
        console.log(error ? "Error: " + JSON.stringify(error) : "Success");
    } catch (e) {
        console.log("Fatal:", e);
    }
}
run();
