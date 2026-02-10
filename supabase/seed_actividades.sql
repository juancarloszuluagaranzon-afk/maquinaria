DO $$
DECLARE
    -- Activity UUIDs (from user image)
    aid_obras UUID := '2cabe693-7a4f-453e-b383-aaa3b5a2cf4e';
    aid_canales UUID := '95527ea3-a368-4b17-9812-39612c5c751e';
    aid_mecanica UUID := '4b2fb506-33fc-427e-901a-5c7d61ceaf73';
    aid_vias UUID := '00f2abb6-fd58-4734-b4fc-e3868f73c602';
    aid_tapada UUID := '62d8a287-46bd-481a-b736-25416c1d613e';
    -- Generated UUIDs for those missing in image view
    aid_riego UUID := gen_random_uuid(); 
    aid_drenaje UUID := gen_random_uuid();

    -- Labor IDs
    lid UUID;
BEGIN
    -- 1. Clean data (Cascade will clean actividad_labores)
    TRUNCATE TABLE actividades CASCADE;

    -- 2. Insert Activities
    INSERT INTO actividades (id, codigo, nombre) VALUES
    (aid_obras, '747', 'MANTENIMIENTO DE OBRAS CIVILES'),
    (aid_canales, '842', 'MANTO DE CANALES CON RETROEXCAVADORA'),
    (aid_mecanica, '142', 'CONSTRUCCION MECANICA DE CANALES'),
    (aid_vias, '523', 'MANTTO DE VIAS TERCIARIAS'),
    (aid_tapada, '513', 'TAPADA DE ACEQUIAS'),
    (aid_riego, '790', 'RIEGO ARROZ'),
    (aid_drenaje, '890', 'DRENAJE PARA ARROZ');

    -- 3. Insert Relationships (Mapping from image)
    
    -- 747 MANTENIMIENTO DE OBRAS CIVILES
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Construcción de Acequia', 'Rectificación de Acequia', 'Destape de pases', 'Instalación de Pases Ingeniería', 'Instalación de Motobombas') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_obras, lid);
    END LOOP;

    -- 842 MANTO DE CANALES CON RETROEXCAVADORA
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Construcción de Acequia', 'Rectificación de Acequia', 'Destape de pases', 'Instalación de Pases Ingeniería', 'Instalación de Motobombas', 'Construcción de Acequia + Boq', 'Rectificación de Acequia + Boq') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_canales, lid);
    END LOOP;

    -- 142 CONSTRUCCION MECANICA DE CANALES
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Construcción de Acequia', 'Rectificación de Acequia', 'Instalación de Pases Ingeniería', 'Construcción de Acequia + Boq', 'Rectificación de Acequia + Boq', 'Destape de pases') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_mecanica, lid);
    END LOOP;

    -- 523 MANTTO DE VIAS TERCIARIAS
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Acond. Perímetros', 'Reborda para tubería') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_vias, lid);
    END LOOP;

    -- 513 TAPADA DE ACEQUIAS
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Tape de Acequias') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_tapada, lid);
    END LOOP;

    -- 790 RIEGO ARROZ
    -- Assumed similar to Obras Civiles/Canales based on visual pattern in image (merged cells?) - Image shows same columns checked as for others?
    -- Looking at image: RIEGO ARROZ has checks in: Const Acequia, Rect Acequia, Destape, Inst Pases, Inst Motobombas. (Same as 747)
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Construcción de Acequia', 'Rectificación de Acequia', 'Destape de pases', 'Instalación de Pases Ingeniería', 'Instalación de Motobombas') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_riego, lid);
    END LOOP;
    
     -- 890 DRENAJE PARA ARROZ
    -- Visual check: Looks like 842 (Manto Canales)
    FOR lid IN SELECT id FROM labores WHERE nombre IN ('Construcción de Acequia', 'Rectificación de Acequia', 'Destape de pases', 'Instalación de Pases Ingeniería', 'Instalación de Motobombas', 'Construcción de Acequia + Boq', 'Rectificación de Acequia + Boq') LOOP
        INSERT INTO actividad_labores (actividad_id, labor_id) VALUES (aid_drenaje, lid);
    END LOOP;

END $$;
