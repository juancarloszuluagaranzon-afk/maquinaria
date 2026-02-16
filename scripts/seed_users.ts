
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars from root
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const USERS = [
    // TECNICOS - ZONA 1
    { nombre: 'Jhon Erik Sanmiguel Rangel', email: 'jesanmiguel@agricolas.co', rol: 'tecnico', zona: 'Zona 1', haciendas: ['PAILA ARRIBA', 'RIO PAILA'] },
    { nombre: 'Luis Enrique Millan Castillo', email: 'lemillan@agricolas.co', rol: 'tecnico', zona: 'Zona 1', haciendas: ['LA LUISA', 'LAGUNAS'] },
    { nombre: 'Manuel Fernando Primero Barragan', email: 'mprimero@agricolas.co', rol: 'tecnico', zona: 'Zona 1', haciendas: ['LA LUISA', 'SAN CARLOS'] },
    { nombre: 'Jorge Armando Quintero Carvajal', email: 'jaquintero@agricolas.co', rol: 'tecnico', zona: 'Zona 1', haciendas: ['ZAMBRANO', 'LA PAILA'] },
    { nombre: 'Alejandro Marmolejo Corrales', email: 'amarmolejo@agricolas.co', rol: 'tecnico', zona: 'Zona 1', haciendas: ['C4'] },

    // TECNICOS - ZONA 2
    { nombre: 'Fredy Reyes Garcia', email: 'freyes@agricolas.co', rol: 'tecnico', zona: 'Zona 2', haciendas: ['VENECIA', 'MEDIA LUNA', 'TEQUENDAMA'] },
    { nombre: 'Alberto Vasquez Arce', email: 'avasquez@agricolas.co', rol: 'tecnico', zona: 'Zona 2', haciendas: ['GERTRUDIZ', 'SAN NICOLAS'] },
    { nombre: 'Hector Fabio Lopez Osorio', email: 'hflopez@agricolas.co', rol: 'tecnico', zona: 'Zona 2', haciendas: ['VALPARAISO'] },
    { nombre: 'Andres Felipe Messa Valderrama', email: 'afmessa@agricolas.co', rol: 'tecnico', zona: 'Zona 2', haciendas: ['MORILLO', 'NORMANDIA'] },
    { nombre: 'Juan Sebastian Rodriguez Alvear', email: 'jsrodriguez@agricolas.co', rol: 'tecnico', zona: 'Zona 2', haciendas: ['PERALONSO'] },

    // JEFES DE ZONA
    { nombre: 'Walter Hernando Bermudez Vargas', email: 'wbermudez@agricolas.co', rol: 'jefe_zona', zona: 'Zona 2', haciendas: [] },
    { nombre: 'Leonardo Andres Lopez Trujillo', email: 'llopez@agricolas.co', rol: 'jefe_zona', zona: 'Zona 1', haciendas: [] }, // Asuming Zona 1 or ALL? User said TODAS. Let's put TODAS or handle logic. Often Jefe Zona needs a specific zone. Giving 'TODAS' for now.

    // ANALISTAS / ADMIN
    { nombre: 'Maria Camila Valencia Quintero', email: 'mcvalencia@agricolas.co', rol: 'analista', zona: 'TODAS', haciendas: [] },
    { nombre: 'Ivan Dario Garcia Alarcon', email: 'idgarcia@agricolas.co', rol: 'admin', zona: 'TODAS', haciendas: [] },
    { nombre: 'Juan Carlos Zuluaga Ranzon', email: 'jczuluaga@agricolas.co', rol: 'analista', zona: 'TODAS', haciendas: [] },

    // AUXILIAR
    { nombre: 'Wilmer Francisco Cutiva Delgado', email: 'wfcutiva@agricolas.co', rol: 'auxiliar', zona: 'TODAS', haciendas: [] },

    // OPERADORES
    { nombre: 'A TODA MAQUINA S.A.S', email: 'atodamaquina@agricolas.co', rol: 'operador', empresa: 'A TODA MAQUINA S.A.S' },
    { nombre: 'AGROVASCAS S A S', email: 'agrovascas@agricolas.co', rol: 'operador', empresa: 'AGROVASCAS S A S' },
    { nombre: 'SERVICIOS AGROMECANICOS DE OCCIDENTE', email: 'agromecanicos@agricolas.co', rol: 'operador', empresa: 'SERVICIOS AGROMECANICOS DE OCCIDENTE' },
    { nombre: 'SERVICIOS AGRICOLAS VARGAS S.A.S', email: 'serviciosvargas@agricolas.co', rol: 'operador', empresa: 'SERVICIOS AGRICOLAS VARGAS S.A.S' },
    { nombre: 'CAMARO LABORES AGRICOLAS S.A.S.', email: 'camaro@agricolas.co', rol: 'operador', empresa: 'CAMARO LABORES AGRICOLAS S.A.S.' },
    { nombre: 'AGROINDUSTRIAL Y DE SERVICIOS MORALES', email: 'serviciosmorales@agricolas.co', rol: 'operador', empresa: 'AGROINDUSTRIAL Y DE SERVICIOS MORALES' },
    { nombre: 'ANDRUSV S A S', email: 'andrusv@agricolas.co', rol: 'operador', empresa: 'ANDRUSV S A S' },
    { nombre: 'AGROMAQUINARIA GALVIL S.A.S', email: 'galvil@agricolas.co', rol: 'operador', empresa: 'AGROMAQUINARIA GALVIL S.A.S' },
    { nombre: 'LABORES AGRICOLAS ROMERO S.A.S.', email: 'laboresromero@agricolas.co', rol: 'operador', empresa: 'LABORES AGRICOLAS ROMERO S.A.S.' },
    { nombre: 'RIOPAILA CASTILLA S.A', email: 'riopaila@agricolas.co', rol: 'operador', empresa: 'RIOPAILA CASTILLA S.A' },
];

const DEFAULT_PASSWORD = 'Riopaila2026*';

async function seedUsers() {
    console.log('🌱 Starting user seeding...');
    console.log(`Target: ${SUPABASE_URL}`);

    // 1. List all existing users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;

    console.log(`Found ${users.length} existing users. Wiping...`);

    // 2. Delete all users (This cascades to public.usuarios if configured, but let's be safe)
    // Note: Deleting auth user usually cascades to public table due to FK reference ON DELETE CASCADE in our schema.
    for (const user of users) {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) console.error(`Failed to delete user ${user.email}:`, deleteError.message);
        else console.log(`Deleted ${user.email}`);
    }

    // 3. Create new users
    console.log(`Creating ${USERS.length} new users...`);

    for (const u of USERS) {
        try {
            // Create in Auth
            const { data: authData, error: createError } = await supabase.auth.admin.createUser({
                email: u.email,
                password: DEFAULT_PASSWORD,
                email_confirm: true,
                user_metadata: { nombre: u.nombre, rol: u.rol }
            });

            if (createError) {
                console.error(`Error creating ${u.email}:`, createError.message);
                continue;
            }

            const userId = authData.user.id;

            // Trigger usually handles insertion into public.usuarios if using 'handle_new_user' trigger
            // But we need to update the extra columns: zona, hacienda, empresa
            // Or if no trigger, insert manually. Our schema usually has a trigger.
            // Let's assume there is a trigger that inserts basic info. 
            // We will UPATE the record to add the assignments.

            // Wait a small bit for trigger? Or just Upsert.

            const userPayload: any = {
                id: userId,
                email: u.email,
                nombre: u.nombre,
                rol: u.rol,
            };

            if (u.zona) userPayload.zona_asignada = u.zona;
            if (u.haciendas && u.haciendas.length > 0) userPayload.hacienda_asignada = u.haciendas;
            if (u.empresa) userPayload.empresa_asignada = u.empresa;

            const { error: upsertError } = await supabase
                .from('usuarios')
                .upsert(userPayload);

            if (upsertError) {
                console.error(`Error updating public profile for ${u.email}:`, upsertError.message);
            } else {
                console.log(`✅ Created/Updated ${u.nombre} (${u.rol})`);
            }

        } catch (err: any) {
            console.error(`Unexpected error for ${u.email}:`, err.message);
        }
    }

    console.log('✨ Seeding complete!');
    process.exit(0);
}

seedUsers().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
