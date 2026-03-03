-- Migration to allow direct Suerte imputation on Ejecuciones without a programacion
ALTER TABLE ejecuciones ADD COLUMN suerte_id UUID REFERENCES suertes(id) ON DELETE SET NULL;
