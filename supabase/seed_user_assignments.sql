-- seed_user_assignments.sql
-- Assigns Haciendas and Contractors to test users for Financial Dashboard testing

DO $$
DECLARE
    -- Contractors
    cid_servi_ex UUID;
    cid_servi_retro UUID;
    cid_castor UUID;
    
    -- Users (Assuming emails from auth.users or created via previous seeds)
    -- We'll use email lookups to find IDs. 
    -- NOTE: In a real seed we might create users, but here we assume they exist 
    -- from previous steps or manual creation.
    -- For this script to work, ensure these emails exist in auth.users and public.usuarios
    
    uid_admin UUID;
    uid_jefe_zona UUID;
    uid_tecnico UUID;
    uid_analista UUID;
    uid_operador_servi UUID;
    uid_operador_castor UUID;
    
BEGIN
    -- 1. Get Contractor IDs
    SELECT id INTO cid_servi_ex FROM contratistas WHERE nombre = 'Serviexcavaciones';
    SELECT id INTO cid_servi_retro FROM contratistas WHERE nombre = 'Serviretro';
    SELECT id INTO cid_castor FROM contratistas WHERE nombre = 'Castor Amigo';

    -- 2. Update Technician (Castilla, Ríopaila)
    -- Assign specific haciendas to the technician
    UPDATE public.usuarios 
    SET haciendas = ARRAY['Castilla', 'Ríopaila'] 
    WHERE email = 'tecnico@riopaila.com'; -- Replace with actual test user email if different

    -- 3. Update Zone Manager (Zona Norte)
    -- No specific hacienda array needed if logic differs, but if using array filter:
    UPDATE public.usuarios 
    SET haciendas = ARRAY['Castilla', 'Ríopaila', 'La Paila', 'Zarzalamo'] 
    WHERE email = 'jefe@riopaila.com';

    -- 4. Update Operators with Contractor IDs
    -- Assign Operator 1 to Serviexcavaciones
    UPDATE public.usuarios 
    SET contratista_id = cid_servi_ex 
    WHERE email = 'operador@riopaila.com';

    -- Assign specific Operator for Castor if exists, or reuse
    -- For testing, maybe update another user or ensure 'operador@riopaila.com' is enough.

END $$;
