---
name: workflow-guard
description: Audits and generates business logic for state transitions, ensuring safe and correct workflow execution via strict backend validation.
---

# Workflow Guard

## Context
This skill acts as the guardian of business logic, specifically preventing "spaghetti code" in state transitions. It forces a security-first approach where validations happen in the database layer (PL/pgSQL) rather than relying solely on the frontend.

## When to use this skill
- [ ] When implementing "Approval", "Rejection", or properties status changes.
- [ ] When the user asks to implement a new workflow step.
- [ ] When writing database functions for state manipulation.

## Instructions
1.  **Strict Validation:**
    *   Before ANY transition, generated code MUST verify:
        *   **Current State:** Is the transitioning record in the valid previous state?
        *   **User Role:** Does `auth.uid()` have the correct role (e.g., `jefe_zona`, `analista`)?
    *   Fail loudly with clear error messages if conditions aren't met.

2.  **Database-First Logic (Anti-Spaghetti):**
    *   **Prefer PL/pgSQL:** Encapsulate logic in Postgres functions (`RPC`).
    *   Do NOT perform complex state checks solely in JavaScript/TypeScript.
    *   Example: `CASE WHEN current_status != 'PENDIENTE' THEN RAISE EXCEPTION ... END;`

3.  **State Matrix Enforcement:**
    Adhere strictly to this flow. Do not allow shortcuts.

    | From State | To State | Required Role |
    | :--- | :--- | :--- |
    | `PENDIENTE` | `APROBADO` | **Jefe Zona** |
    | `APROBADO` | `PROGRAMADO` | **Analista** |
    | `PROGRAMADO` | `EN_EJECUCION` | **Operador** |
    | `EN_EJECUCION` | `FINALIZADO` | **Operador** |
    | `FINALIZADO` | `FIRMADO` | **Técnico** (via Signature) |

    *   Any transition outside this matrix is forbidden unless explicitly authorized by an admin override.

## Scripts & Tools
- No specific scripts. Use `supabase-architect` skill to write the resulting SQL.

## Language
**LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
