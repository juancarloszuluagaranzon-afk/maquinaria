-- Migration to add CAMARO LABORES AGRICOLAS S.A.S.
DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_contratista_id UUID := gen_random_uuid();
BEGIN
    -- 1. Create User in auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'camaro@agricolas.co',
        crypt('Agro2024*', gen_salt('bf')), now(), '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
    );

    -- 2. Create Contratista in public.contratistas
    INSERT INTO public.contratistas (id, nombre, email)
    VALUES (v_contratista_id, 'CAMARO LABORES AGRICOLAS S.A.S.', 'camaro@agricolas.co');

    -- 3. Create Profile in public.usuarios
    INSERT INTO public.usuarios (id, email, nombre, rol, contratista_id)
    VALUES (v_user_id, 'camaro@agricolas.co', 'CAMARO LABORES AGRICOLAS S.A.S.', 'contratista', v_contratista_id);

END $$;
