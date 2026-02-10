DO $$
BEGIN
    -- Clean existing data
    TRUNCATE TABLE prioridades CASCADE;

    -- Insert Priorities
    INSERT INTO prioridades (nivel, asunto, descripcion) VALUES
    (1, 'Emergencia', 'Emergencia'),
    (2, 'Plantilla', 'Plantilla'),
    (3, 'Suerte fertilizada', 'Suerte fertilizada'),
    (4, 'Suerte para cosecha', 'Suerte para cosecha'),
    (5, 'Ing Agricola - R Hidricos', 'Ing Agricola - R Hidricos');

END $$;
