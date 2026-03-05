-- ==============================================================================
-- SEED NEW OPERATOR USERS (Mar 2026)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_id uuid;
BEGIN

  -- Andres (Serviexcavaciones)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'andres@serviexcavaciones.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'andres@serviexcavaciones.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Andres', 'andres@serviexcavaciones.co', 'operador', 'Serviexcavaciones');

  -- Cesas (Serviexcavaciones)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'cesas@serviexcavaciones.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'cesas@serviexcavaciones.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Cesas', 'cesas@serviexcavaciones.co', 'operador', 'Serviexcavaciones');

  -- Yeison (Serviexcavaciones)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'yeison@serviexcavaciones.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'yeison@serviexcavaciones.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Yeison', 'yeison@serviexcavaciones.co', 'operador', 'Serviexcavaciones');

  -- Yefferson (Serviexcavaciones)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'yefferson@serviexcavaciones.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'yefferson@serviexcavaciones.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Yefferson', 'yefferson@serviexcavaciones.co', 'operador', 'Serviexcavaciones');

  -- Saul (Serviretro)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'saul@serviretro.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'saul@serviretro.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Saul', 'saul@serviretro.co', 'operador', 'Serviretro');

  -- Felipe (Serviretro)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'felipe@serviretro.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'felipe@serviretro.co'), 'email', now(), now(), now());
  
  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Felipe', 'felipe@serviretro.co', 'operador', 'Serviretro');

END $$;

-- FIX NULL TOKEN COLUMNS for new users
UPDATE auth.users
SET
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE email IN (
  'andres@serviexcavaciones.co',
  'cesas@serviexcavaciones.co',
  'yeison@serviexcavaciones.co',
  'yefferson@serviexcavaciones.co',
  'saul@serviretro.co',
  'felipe@serviretro.co'
);
