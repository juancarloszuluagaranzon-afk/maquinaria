-- ==============================================================================
-- 7. SEED NEW OPERATOR USERS (Feb 2026)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_id uuid;
BEGIN

  -- ============================================================================
  -- NUEVOS OPERADORES
  -- ============================================================================

  -- Serviexcavaciones
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'serviexcavaciones@agricolas.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'serviexcavaciones@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Serviexcavaciones', 'serviexcavaciones@agricolas.co', 'operador', 'Serviexcavaciones');

  -- Serviretro
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'serviretro@agricolas.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'serviretro@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Serviretro', 'serviretro@agricolas.co', 'operador', 'Serviretro');

  -- Castor Amigo
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'castoramigo@agricolas.co', crypt('Riopaila2026*', gen_salt('bf', 10)), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'castoramigo@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'Castor Amigo', 'castoramigo@agricolas.co', 'operador', 'Castor Amigo');

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
WHERE email IN ('serviexcavaciones@agricolas.co', 'serviretro@agricolas.co', 'castoramigo@agricolas.co');
