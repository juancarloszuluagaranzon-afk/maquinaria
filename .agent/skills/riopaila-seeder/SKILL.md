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
    *   **Default Password:** Use `'Riopaila2026*'` for all generated users. Hash with `crypt('Riopaila2026*', gen_salt('bf', 10))`.
    *   **Auth Pattern:** For each user, insert into `auth.users`, `auth.identities`, AND `public.usuarios`. Always fix NULL tokens (see `supabase-architect` skill).

3.  **Fixed Catalogs (Updated Feb 2026):**
    *   **Contractors & Machinery:** Use the following specific data for seeding:
        *   **Serviexcavaciones** (`serviexcavaciones@agricolas.co`): Motoniveladora (155,000), Retro 130 (185,200), Enllantada (119,400).
        *   **Serviretro** (`serviretro@agricolas.co`): Enllantada (119,400), Retro X8 (137,100).
        *   **Castor Amigo** (`castoramigo@agricolas.co`): Retro Dossan (206,200).
        *   **Riopaila Castilla** (`riopaila@agricolas.co`): Retro 320 (233,356).
        *   **ANDRUSV S A S** (`andrusv@agricolas.co`)
        *   **AGROMAQUINARIA GALVIL S.A.S** (`galvil@agricolas.co`)
        *   **LABORES AGRICOLAS ROMERO S.A.S.** (`laboresromero@agricolas.co`)
        *   **Labores (Tasks):** Generate generic SQL inserts if not provided (e.g., Preparation, Planting, Harvest).
    *   **Operator usuarios pattern:** Use `empresa` column (not `zona`/`hacienda_asignada`) for operator role.

4.  **Output Format:**
    *   Generate a single, transactional SQL file (checking for duplicates).
    *   Use `INSERT INTO table (...) VALUES (...) ON CONFLICT DO NOTHING;` pattern.

## Scripts & Tools
- Use `python` or `node` scripts if CSV parsing is too complex for direct LLM processing, but prefer generating the SQL directly if the dataset is small (<50 rows).

## Language
**LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
