---
name: supabase-architect
description: Acts as the technical authority for generating, reviewing, and optimizing Supabase SQL migrations with a strict focus on security, business reality, and best practices.
---

# Supabase Architect

## Context
This skill ensures all database interactions and schema changes in Supabase adhere to strict security standards (RLS) and **business reality**. It prevents generic "boilerplate" schemas and enforces that the database reflects the actual master data (CSV) and business rules.

## When to use this skill
- [ ] When the user asks to create or modify database tables.
- [ ] When generating SQL migrations.
- [ ] When defining policies, roles, or permissions in Supabase.
- [ ] When converting business requirements or CSV files into SQL schema.

## Instructions
1.  **Source of Truth (Strict):**
    *   **NEVER INVENT THE SCHEMA.** The database structure must be strictly based on the provided master files (e.g., Riopaila CSVs) and explicit user definitions.
    *   **No Generic Tables:** Do not create "placeholder" tables (e.g., simple `id, name` tables) if the business entity is complex.
    *   *Example:* If the user asks for `suertes`, it MUST include ALL business columns like `zona_agroecologica`, `tch`, `variedad`, etc., derived from the source data.

2.  **RLS Obsession (Non-Negotiable):**
    *   For EVERY new table, IMMEDIATELY append: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`.
    *   NEVER leave a table public unless explicitly authorized.
    *   Define explicit policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` immediately after table creation.

3.  **Authentication & Auditing:**
    *   **Integration:** Always integrate with `auth.users`.
    *   **Audit Fields:** Every table must track ownership. Include a `created_by` column referencing `auth.users.id` and a `created_at` timestamp.
    *   Example: `created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()`

4.  **Auth User Seeding (CRITICAL — Learned from Production Bugs):**
    *   **Bcrypt Cost:** ALWAYS use `gen_salt('bf', 10)`. Cost 6 (pgcrypto default) will cause "Invalid Credentials" errors.
    *   **Token Columns:** After inserting auth.users, ALWAYS run:
        ```sql
        UPDATE auth.users SET
          confirmation_token = COALESCE(confirmation_token, ''),
          recovery_token = COALESCE(recovery_token, ''),
          email_change_token_new = COALESCE(email_change_token_new, ''),
          email_change = COALESCE(email_change, ''),
          email_change_token_current = COALESCE(email_change_token_current, ''),
          phone_change = COALESCE(phone_change, ''),
          phone_change_token = COALESCE(phone_change_token, ''),
          reauthentication_token = COALESCE(reauthentication_token, '')
        WHERE email LIKE '%@agricolas.co';
        ```
        GoTrue crashes on NULL tokens with `Scan error on column index 3`.
    *   **Identity provider_id:** Must be `new_id::text` (the user's UUID as text), NOT the email.
    *   **instance_id:** Always `'00000000-0000-0000-0000-000000000000'`.

5.  **RLS Anti-Recursion (CRITICAL):**
    *   NEVER write an RLS policy on `usuarios` that queries `usuarios` itself to check roles. This creates infinite recursion.
    *   Use `auth.uid() = id` for self-read or permissive `true` policies instead.
    *   For role-based access, use `auth.jwt() ->> 'role'` or a separate metadata source.

6.  **Strict Relationships & Integrity:**
    *   Enforce referential integrity for all business relationships.
    *   *Example:* `usuarios` MUST link to `auth.users`; `ejecuciones` MUST link to `suertes`.
    *   Use Foreign Keys explicitly.

7.  **Naming & Structural Conventions:**
    *   **Case:** Use strictly `snake_case` for all table names and column names.
    *   **Primary Keys:** Always use `uuid` for primary keys (e.g., `id uuid DEFAULT gen_random_uuid() PRIMARY KEY`).

8.  **Migration Safety:**
    *   Wrap complex changes in transactions (`BEGIN; ... COMMIT;`).
    *   Ensure idempotent scripts (use `IF NOT EXISTS`, `DROP ... IF EXISTS` carefully).

9.  **Complex Permissions (RPCs):**
    *   If RLS is too restrictive for a specific valid workflow (e.g., Cross-Role updates like Technician signing an Operator's execution), **DO NOT** loosen the table RLS.
    *   Instead, create a `SECURITY DEFINER` function (RPC) that:
        1.  Verifies permissions internally (e.g., `IF auth.uid() = ...`).
        2.  Performs the update with elevated privileges.
        3.  Is called from the frontend via `supabase.rpc()`.

## Scripts & Tools
- No specific external scripts. Use `execute_sql` or `diff` tools to apply and verify migrations.

## Language
**LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
