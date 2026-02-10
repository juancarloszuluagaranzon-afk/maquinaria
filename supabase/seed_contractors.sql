-- Create Contractor Users
-- 1. SERVIEXCAVACIONES S.A.S
-- 2. SERVIRETRO S.A.S
-- 3. RETROEXCAVADORA MIXTA X8
-- 4. Agrícola Riopaila S.A.S.

DO $$
DECLARE
  v_uid uuid;
BEGIN
  -- 1. Serviexcavaciones
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'serviexcavaciones@riopaila.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'serviexcavaciones@riopaila.com', crypt('Riopaila2026', gen_salt('bf')), now(), null, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    RETURNING id INTO v_uid;
    
    INSERT INTO public.usuarios (id, nombre, rol, activo)
    VALUES (v_uid, 'SERVIEXCAVACIONES S.A.S', 'operador', true);
  END IF;

  -- 2. Serviretro
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'serviretro@riopaila.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'serviretro@riopaila.com', crypt('Riopaila2026', gen_salt('bf')), now(), null, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    RETURNING id INTO v_uid;
    
    INSERT INTO public.usuarios (id, nombre, rol, activo)
    VALUES (v_uid, 'SERVIRETRO S.A.S', 'operador', true);
  END IF;

  -- 3. Retroexcavadora Mixta
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'retromixta@riopaila.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'retromixta@riopaila.com', crypt('Riopaila2026', gen_salt('bf')), now(), null, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    RETURNING id INTO v_uid;
    
    INSERT INTO public.usuarios (id, nombre, rol, activo)
    VALUES (v_uid, 'RETROEXCAVADORA MIXTA X8', 'operador', true);
  END IF;

   -- 4. Agrícola Riopaila
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agricola@riopaila.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'agricola@riopaila.com', crypt('Riopaila2026', gen_salt('bf')), now(), null, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
    RETURNING id INTO v_uid;
    
    INSERT INTO public.usuarios (id, nombre, rol, activo)
    VALUES (v_uid, 'Agrícola Riopaila S.A.S.', 'operador', true);
  END IF;

END $$;
