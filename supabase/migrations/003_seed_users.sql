-- ==============================================================================
-- 3. SEED USERS & CLEANUP (DEFINITIVE LIST - FROM EXCEL)
-- ==============================================================================

-- Enable pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CLEANUP (Dependent Data)
TRUNCATE TABLE public.ejecuciones, public.programaciones, public.roturacion_seguimiento, public.asignaciones CASCADE;

-- 2. CLEAR USERS
-- Deleting users should cascade to identities, but let's be safe
DELETE FROM public.usuarios;
DELETE FROM auth.identities WHERE email LIKE '%@agricolas.co' OR email LIKE '%@riopaila.com';
DELETE FROM auth.users WHERE email LIKE '%@agricolas.co' OR email LIKE '%@riopaila.com';

-- 3. INSERT USERS
DO $$
DECLARE
  new_id uuid;
BEGIN

  -- ============================================================================
  -- TÉCNICOS (ZONA 1)
  -- ============================================================================
  
  -- Jhon Erik Sanmiguel Rangel
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'jesanmiguel@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'jesanmiguel@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Jhon Erik Sanmiguel Rangel', 'jesanmiguel@agricolas.co', 'tecnico', 1, ARRAY['PAILA ARRIBA', 'RIOPAILA']);

  -- Luis Enrique Millan Castillo
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'lemillan@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());
  
  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'lemillan@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Luis Enrique Millan Castillo', 'lemillan@agricolas.co', 'tecnico', 1, ARRAY['LA LUISA', 'LAGUNAS']);

  -- Manuel Fernando Primero Barragan
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'mprimero@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'mprimero@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Manuel Fernando Primero Barragan', 'mprimero@agricolas.co', 'tecnico', 1, ARRAY['LA LUISA', 'SAN CARLOS']);

  -- Jorge Armando Quintero Carvajal
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'jaquintero@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'jaquintero@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Jorge Armando Quintero Carvajal', 'jaquintero@agricolas.co', 'tecnico', 1, ARRAY['ZAMBRANO', 'LA PAILA']);

  -- Alejandro Marmolejo Corrales
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'amarmolejo@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'amarmolejo@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Alejandro Marmolejo Corrales', 'amarmolejo@agricolas.co', 'tecnico', 1, ARRAY['C4']);


  -- ============================================================================
  -- TÉCNICOS (ZONA 2)
  -- ============================================================================

  -- Fredy Reyes Garcia
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'freyes@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'freyes@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Fredy Reyes Garcia', 'freyes@agricolas.co', 'tecnico', 2, ARRAY['VENECIA', 'MEDIA LUNA', 'TEQUENDAMA']);

  -- Alberto Vasquez Arce
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'avasquez@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'avasquez@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Alberto Vasquez Arce', 'avasquez@agricolas.co', 'tecnico', 2, ARRAY['GERTRUDIZ', 'SAN NICOLAS']);

  -- Hector Fabio Lopez Osorio
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'hflopez@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'hflopez@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Hector Fabio Lopez Osorio', 'hflopez@agricolas.co', 'tecnico', 2, ARRAY['VALPARAISO']);

  -- Andres Felipe Messa Valderrama
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'afmessa@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'afmessa@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Andres Felipe Messa Valderrama', 'afmessa@agricolas.co', 'tecnico', 2, ARRAY['MORILLO', 'NORMANDIA']);

  -- Juan Sebastian Rodriguez Alvear
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'jsrodriguez@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'jsrodriguez@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona, hacienda_asignada)
  VALUES (new_id, 'Juan Sebastian Rodriguez Alvear', 'jsrodriguez@agricolas.co', 'tecnico', 2, ARRAY['PERALONSO']);


  -- ============================================================================
  -- JEFES DE ZONA
  -- ============================================================================

  -- Walter Hernando Bermudez Vargas (Zona 2)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'wbermudez@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'wbermudez@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Walter Hernando Bermudez Vargas', 'wbermudez@agricolas.co', 'jefe_zona', 2);

  -- Leonardo Andres Lopez Trujillo (Zona TODAS -> NULL)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'llopez@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'llopez@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Leonardo Andres Lopez Trujillo', 'llopez@agricolas.co', 'jefe_zona', NULL);


  -- ============================================================================
  -- ADMINISTRATIVOS
  -- ============================================================================

  -- Maria Camila Valencia Quintero (Analista)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'mcvalencia@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'mcvalencia@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Maria Camila Valencia Quintero', 'mcvalencia@agricolas.co', 'analista', NULL);

  -- Ivan Dario Garcia Alarcon (Administrador -> Admin)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'idgarcia@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'idgarcia@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Ivan Dario Garcia Alarcon', 'idgarcia@agricolas.co', 'admin', NULL);

  -- Juan Carlos Zuluaga Ranzon (Analista)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'jczuluaga@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'jczuluaga@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Juan Carlos Zuluaga Ranzon', 'jczuluaga@agricolas.co', 'analista', NULL);

  -- Wilmer Francisco Cutiva Delgado (Auxiliar)
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'wfcutiva@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'wfcutiva@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, zona)
  VALUES (new_id, 'Wilmer Francisco Cutiva Delgado', 'wfcutiva@agricolas.co', 'auxiliar', NULL);


  -- ============================================================================
  -- OPERADORES (Empresas)
  -- ============================================================================

  -- A TODA MAQUINA S.A.S
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'atodamaquina@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'atodamaquina@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'A TODA MAQUINA S.A.S', 'atodamaquina@agricolas.co', 'operador', 'A TODA MAQUINA S.A.S');

  -- AGROVASCAS S A S
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'agrovascas@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'agrovascas@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'AGROVASCAS S A S', 'agrovascas@agricolas.co', 'operador', 'AGROVASCAS S A S');

  -- SERVICIOS AGROMECANICOS DE OCCIDENTE
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'agromecanicos@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'agromecanicos@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'SERVICIOS AGROMECANICOS DE OCCIDENTE', 'agromecanicos@agricolas.co', 'operador', 'SERVICIOS AGROMECANICOS DE OCCIDENTE');

  -- SERVICIOS AGRICOLAS VARGAS S.A.S
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'serviciosvargas@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'serviciosvargas@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'SERVICIOS AGRICOLAS VARGAS S.A.S', 'serviciosvargas@agricolas.co', 'operador', 'SERVICIOS AGRICOLAS VARGAS S.A.S');

  -- CAMARO LABORES AGRICOLAS S.A.S.
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'camaro@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'camaro@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'CAMARO LABORES AGRICOLAS S.A.S.', 'camaro@agricolas.co', 'operador', 'CAMARO LABORES AGRICOLAS S.A.S.');

  -- AGROINDUSTRIAL Y DE SERVICIOS MORALES
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'serviciosmorales@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'serviciosmorales@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'AGROINDUSTRIAL Y DE SERVICIOS MORALES', 'serviciosmorales@agricolas.co', 'operador', 'AGROINDUSTRIAL Y DE SERVICIOS MORALES');

  -- ANDRUSV S A S
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'andrusv@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'andrusv@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'ANDRUSV S A S', 'andrusv@agricolas.co', 'operador', 'ANDRUSV S A S');

  -- AGROMAQUINARIA GALVIL S.A.S
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'galvil@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'galvil@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'AGROMAQUINARIA GALVIL S.A.S', 'galvil@agricolas.co', 'operador', 'AGROMAQUINARIA GALVIL S.A.S');

  -- LABORES AGRICOLAS ROMERO S.A.S.
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'laboresromero@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'laboresromero@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'LABORES AGRICOLAS ROMERO S.A.S.', 'laboresromero@agricolas.co', 'operador', 'LABORES AGRICOLAS ROMERO S.A.S.');

  -- RIOPAILA CASTILLA S.A
  new_id := gen_random_uuid();
  INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES ('00000000-0000-0000-0000-000000000000', new_id, 'riopaila@agricolas.co', crypt('Riopaila2026*', gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now());

  INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES (gen_random_uuid(), new_id, new_id::text, jsonb_build_object('sub', new_id, 'email', 'riopaila@agricolas.co'), 'email', now(), now(), now());

  INSERT INTO public.usuarios (id, nombre, email, rol, empresa)
  VALUES (new_id, 'RIOPAILA CASTILLA S.A', 'riopaila@agricolas.co', 'operador', 'RIOPAILA CASTILLA S.A');

END $$;
