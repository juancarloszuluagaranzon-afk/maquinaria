---
name: riopaila-seeder
description: Expert ETL skill for transforming raw CSV master data into clean SQL seed scripts for Supabase, handling data type conversions and automatic user provisioning.
---

# Riopaila Seeder

## Context
This skill handles the complex ETL (Extract, Transform, Load) process required to populate the database with real-world data from CSV files. It bridges the gap between raw operational data and the structured SQL schema, handling data type cleaning (commas to dots) and relational integrity (creating users from text fields).

## When to use this skill
- [ ] When the user provides a `maestro.csv` or similar data file.
- [ ] When the user asks to "populate the database" or "load initial data".
- [ ] When converting CSV data to SQL `INSERT` statements.
- [ ] When generating mock or real users for specific roles based on data.

## Instructions
1.  **Intelligent CSV Mapping:**
    Map the specific source columns to the `suertes` table schema as follows:
    *   `SUERTE` -> `codigo`
    *   `FINCA` -> `hacienda`
    *   `ZONA` -> `zona`
    *   `AREA` -> `area_neta` (**CRITICAL:** Replace decimal commas `,` with dots `.`)
    *   `EDAD` -> `edad` (**CRITICAL:** Replace decimal commas `,` with dots `.`)
    *   `NUMERO DE CORTE` -> `corte`

2.  **Automatic User Generation:**
    Scan the CSV for unique names in responsible columns and generate SQL to insert them into `usuarios` (or `auth.users` mock):
    *   `TECNICO AGRICOLA RESPONSABLE` -> create user with role `tecnico`.
    *   `RESPONSABLE ZONA` -> create user with role `jefe_zona`.
    *   **Default Password:** Use `'Riopaila2026'` for all generated users.

3.  **Fixed Catalogs:**
    *   Since the CSV doesn't contain `Labores` (Tasks) or `Maquinaria` (Machinery) master lists, generate generic SQL inserts for these tables (e.g., Tractor A, Harvester B, Pruning, Fertilizing) to ensure the system is usable.

4.  **Output Format:**
    *   Generate a single, transactional SQL file (checking for duplicates).
    *   Use `INSERT INTO table (...) VALUES (...) ON CONFLICT DO NOTHING;` pattern.

## Scripts & Tools
- Use `python` or `node` scripts if CSV parsing is too complex for direct LLM processing, but prefer generating the SQL directly if the dataset is small (<50 rows).
