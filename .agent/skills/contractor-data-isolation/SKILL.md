---
name: contractor-data-isolation
description: Gestiona y documenta las políticas de aislamiento de datos (RLS) para asegurar que los contratistas solo accedan a su propia información técnica y de roturación.
---

# Aislamiento de Datos por Contratista (RLS Guard)

## Contexto
Este skill fue creado para resolver la necesidad crítica de privacidad de datos entre contratistas externos (Serviretro, Serviexcavaciones, etc.). Garantiza que un usuario con rol de 'operador' solo pueda visualizar y gestionar las 'programaciones' y 'asignaciones de roturación' asociadas a su empresa específica.

## Cuándo usar este skill
- [ ] Cuando se agregan nuevas tablas que contienen información sensible por contratista.
- [ ] Cuando se detecta que un contratista puede ver registros que no le pertenecen.
- [ ] Al dar de alta nuevos contratistas para verificar que su `usuario_id` en la tabla `contratistas` esté correctamente vinculado.

## Instrucciones y Mejores Prácticas

### 1. Vincular Usuario con Contratista
Para que el aislamiento funcione, cada registro en `public.contratistas` debe tener un `usuario_id` válido que apunte a `auth.users`.
- Tabla: `public.contratistas`
- Columna: `usuario_id (UUID)`

### 2. Implementación de Políticas RLS
Siempre use el patrón `EXISTS` para validar la pertenencia del registro al usuario autenticado:

```sql
USING (
    EXISTS (
        SELECT 1 FROM public.contratistas c
        WHERE c.usuario_id = auth.uid()
        AND c.id = [tabla_objetivo].contratista_id
    )
    OR 
    EXISTS (
        SELECT 1 FROM public.usuarios u
        WHERE u.id = auth.uid() 
        AND u.rol IN ('admin', 'analista', 'jefe_zona', 'tecnico')
    )
)
```

### 3. Tablas Protegidas
- `public.programaciones`: Filtrado por `contratista_id`.
- `public.roturacion_asignaciones`: Filtrado por `contratista_id`.
- `public.roturacion_seguimiento`: Filtrado mediante join con `roturacion_asignaciones`.

## Verificación de Aislamiento
Para verificar el cumplimiento, use el comando `mcp_supabase-mcp-server_execute_sql` simulando el ID del contratista:

```sql
-- Simular sesión de usuario (Reemplazar UUID)
SET request.jwt.claims = '{"sub": "UUID-DEL-OPERADOR"}';
SELECT count(*) FROM public.programaciones;
-- El resultado debe ser >= 0 y solo incluir sus registros.
```

## Idioma
**IDIOMA: ESPAÑOL. Toda la documentación y comentarios deben mantenerse en español.**
