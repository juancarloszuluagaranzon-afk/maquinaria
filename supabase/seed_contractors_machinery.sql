DO $$
DECLARE
    cid_servi_ex UUID;
    cid_servi_retro UUID;
    cid_castor UUID;
    cid_riopaila UUID;
BEGIN
    -- 0. Clean existing data
    TRUNCATE TABLE maquinaria, contratistas CASCADE;

    -- 1. Insert/Get Contractors
    -- Serviexcavaciones
    SELECT id INTO cid_servi_ex FROM contratistas WHERE nombre = 'Serviexcavaciones';
    IF cid_servi_ex IS NULL THEN
        INSERT INTO contratistas (nombre) VALUES ('Serviexcavaciones') RETURNING id INTO cid_servi_ex;
    END IF;

    -- Serviretro
    SELECT id INTO cid_servi_retro FROM contratistas WHERE nombre = 'Serviretro';
    IF cid_servi_retro IS NULL THEN
        INSERT INTO contratistas (nombre) VALUES ('Serviretro') RETURNING id INTO cid_servi_retro;
    END IF;

    -- Castor Amigo
    SELECT id INTO cid_castor FROM contratistas WHERE nombre = 'Castor Amigo';
    IF cid_castor IS NULL THEN
        INSERT INTO contratistas (nombre) VALUES ('Castor Amigo') RETURNING id INTO cid_castor;
    END IF;

    -- Riopaila Castilla
    SELECT id INTO cid_riopaila FROM contratistas WHERE nombre = 'Riopaila Castilla';
    IF cid_riopaila IS NULL THEN
        INSERT INTO contratistas (nombre) VALUES ('Riopaila Castilla') RETURNING id INTO cid_riopaila;
    END IF;

    -- 2. Insert Machinery
    -- Serviexcavaciones
    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Motoniveladora', cid_servi_ex, 155000 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Motoniveladora' AND contratista_id = cid_servi_ex);
    
    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Retro 130', cid_servi_ex, 185200 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Retro 130' AND contratista_id = cid_servi_ex);

    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Enllantada', cid_servi_ex, 119400 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Enllantada' AND contratista_id = cid_servi_ex);

    -- Serviretro
    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Enllantada', cid_servi_retro, 119400 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Enllantada' AND contratista_id = cid_servi_retro);

    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Retro X8', cid_servi_retro, 137100 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Retro X8' AND contratista_id = cid_servi_retro);

    -- Castor Amigo
    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Retro Dossan', cid_castor, 206200 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Retro Dossan' AND contratista_id = cid_castor);

    -- Riopaila Castilla
    INSERT INTO maquinaria (nombre, contratista_id, tarifa_hora)
    SELECT 'Retro 320', cid_riopaila, 233356 WHERE NOT EXISTS (SELECT 1 FROM maquinaria WHERE nombre = 'Retro 320' AND contratista_id = cid_riopaila);

END $$;
