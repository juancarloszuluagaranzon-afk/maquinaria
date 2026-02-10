DO $$
BEGIN
    -- Clean existing data
    TRUNCATE TABLE labores CASCADE;

    -- Insert Labors with consolidated Machine Types
    INSERT INTO labores (nombre, tipo_maquinaria) VALUES
    ('Construcción de Acequia', 'Enllantada, Retro 130, Retro X8'),
    ('Rectificación de Acequia', 'Enllantada, Retro 130, Retro X8'),
    ('Destape de pases', 'Enllantada, Retro 130, Retro X8'),
    ('Instalación de Motobombas', 'Enllantada, Retro 130, Retro X8'),
    ('Instalación de Pases Ingeniería', 'Enllantada, Retro 130, Retro X8'),
    ('Descargue Pilotes', 'Enllantada'),
    ('Tape de Acequias', 'Motoniveladora'),
    ('Acond. Perímetros', 'Motoniveladora'),
    ('Reborda para tubería', 'Motoniveladora'),
    ('Construcción de Acequia + Boq', 'Retro 130'),
    ('Rectificación de Acequia + Boq', 'Retro 130'),
    ('Limpieza de Colectores', 'Retro Dossan, Retro 130');

END $$;
