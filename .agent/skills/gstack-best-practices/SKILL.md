---
name: gstack-best-practices
description: >
  Derrotero de mejores prácticas para vibe coders que construyen productos reales con IA.
  Basado en la filosofía y workflow de gstack (garrytan/gstack). El agente debe aplicar
  estos principios en CADA conversación de construcción de producto, sin importar el tamaño
  del cambio. Idioma: ESPAÑOL.
---

# 🚀 Derrotero del Vibe Coder — Construir Productos con IA

> *"No he escrito prácticamente una línea de código desde diciembre."*
> — Andrej Karpathy, marzo 2026

Somos vibe coders: construimos productos reales, rápido, con IA como equipo completo.
No somos ingenieros de software tradicionales. Somos **product builders**. La diferencia es
que nosotros enviamos. El código es el medio, el producto es el fin.

---

## ⚡ La Mentalidad Fundamental

### Regla #1 — Hierve el Lago, No el Océano

Con IA, el costo de hacerlo **completo** es casi cero. El atajo ya no se justifica.

| Lo que antes tomaba | Ahora toma | Decisión |
|---------------------|-----------|----------|
| 2 días (boilerplate) | 15 min | Hazlo completo |
| 1 semana (feature) | 30 min | Hazlo completo |
| 4 horas (bug + test) | 15 min | Hazlo completo |
| 2 días (arquitectura) | 4 horas | Tómate el tiempo |

**Un "lago" es hervible:** tests, edge cases, manejo de errores, validaciones.
**Un "océano" no lo es:** reescribir todo el sistema desde cero.

> Cuando el agente proponga "hagamos el 80% por ahora" — rechaza. Pide el 100%.
> La única excepción válida es cuando el 20% restante es un océano real.

---

### Regla #2 — El Producto Primero, el Código Después

Antes de escribir una sola línea, define **QUÉ** y **PARA QUIÉN**.
El mejor código resolviendo el problema equivocado es basura cara.

**Preguntas obligatorias antes de cualquier feature:**
1. ¿Qué dolor específico resuelve esto?
2. ¿Quién lo usa, cuándo, en qué contexto?
3. ¿Es este el problema real o el síntoma de otro?
4. ¿Cuál es la versión más pequeña que demuestra valor?

---

### Regla #3 — Tú Decides, la IA Ejecuta

La IA recomienda. Tú decides. Siempre.

El agente tiene contexto técnico. Tú tienes contexto de negocio, usuarios y
visión de producto. Cuando entren en conflicto — tú ganas.

**El loop correcto:**
```
Tú describes el problema →
IA propone solución →
Tú apruebas, ajustas o rechazas →
IA ejecuta tu decisión →
Repite
```

Nunca permitas que el agente haga cambios significativos sin tu aprobación explícita.

---

## 🎯 El Flujo de Construcción de Producto

### Paso 0 — Reencuadra el Problema (siempre)

Antes de cualquier cosa, describe el problema con estas 3 cosas:
- **El dolor:** "El usuario tiene que..." / "Actualmente no se puede..."
- **El contexto:** ¿Quién lo usa? ¿En campo, oficina, móvil?
- **El éxito:** ¿Cómo sé que lo resolví?

El agente debe desafiar tu framing. Si dice "sí, perfecto, vamos" sin preguntar — insiste.
Las mejores ideas salen del cuestionamiento.

---

### Paso 1 — Define Antes de Codear

Para cualquier feature nuevo, pide al agente:
1. **Resumen del cambio** en 2 líneas (qué cambia para el usuario)
2. **Enfoque técnico** (qué archivos toca, qué lógica nueva)
3. **Riesgos** (qué puede romper, qué datos están en juego)
4. **Test mínimo** (cómo verificamos que funciona)

Solo cuando apruebas esto — el agente escribe código.

---

### Paso 2 — Construye en Iteraciones Visibles

Cada iteración debe:
- **Ser demostrable** — algo que puedas ver o probar
- **Ser atómica** — un cambio, un propósito
- **Estar verificada** — el agente debe probar su propio trabajo

**Secuencia de construcción saludable:**
```
1. Estructura de datos / schema
2. Lógica de negocio
3. UI / interfaz
4. Casos borde y errores
5. Verificación visual o funcional
```

No saltes pasos. Si el agente propone hacer todo a la vez — pide que lo divida.

---

### Paso 3 — Revisión de Producto (no de código)

Antes de dar por terminado cualquier feature, hazte estas preguntas:

**Funcional:**
- [ ] ¿Hace exactamente lo que el usuario necesita?
- [ ] ¿Qué pasa si el usuario hace algo inesperado?
- [ ] ¿Los mensajes de error son útiles o son jerga técnica?

**Visual:**
- [ ] ¿Se ve bien en móvil?
- [ ] ¿El flujo es obvio sin explicación?
- [ ] ¿Hay feedback visual para cada acción (loading, error, éxito)?

**Datos:**
- [ ] ¿Los datos que se guardan son los correctos?
- [ ] ¿Qué pasa si el dato llega vacío o malformado?
- [ ] ¿Hay validación antes de guardar?

---

### Paso 4 — Envía con Confianza

Solo envías cuando:
1. Lo probaste con datos reales (no solo con datos de prueba perfectos)
2. Los casos de error tienen manejo visible para el usuario
3. El feature hace UNA sola cosa bien (no tres cosas medianamentes)

---

## 🏗️ Estándares de Código del Vibe Coder

### Lo que no negociamos

**1. Siempre hay validación de entrada**
Antes de procesar cualquier dato del usuario, validar. Nunca asumir que el dato llega bien.

**2. Siempre hay manejo de errores visible**
El usuario debe saber qué salió mal, no ver una pantalla rota en silencio.

**3. El estado de carga existe**
Si algo tarda más de 200ms, hay un indicador de loading. Sin excepciones.

**4. Los datos sensibles no van al frontend**
Contraseñas, tokens, llaves de API — nunca en el código del cliente.

**5. Los formularios validan antes de enviar**
Evitar llamadas al servidor con datos inválidos. Feedback inmediato al usuario.

---

### Patrones que usamos siempre

**Para formularios:**
```
Validar localmente → Mostrar errores inline → Enviar → Estado de carga → Éxito o Error claro
```

**Para listas/tablas de datos:**
```
Estado vacío → Estado de carga → Datos → Paginación si > 50 items
```

**Para acciones destructivas (eliminar, reemplazar):**
```
Confirmar con el usuario → Ejecutar → Feedback → Opción de deshacer si es posible
```

**Para operaciones que fallan:**
```
Intentar → Error claro con qué falló → Opción de reintentar → No perder el trabajo del usuario
```

---

### Lo que nunca hacemos

- Mostrar errores técnicos crudos al usuario (`TypeError: cannot read...`)
- Guardar sin confirmación cuando la acción es irreversible
- Hacer llamadas al servidor en cada tecla (debounce siempre)
- Dejar el UI bloqueado sin feedback mientras carga
- Hardcodear valores que van a cambiar (URLs, IDs, textos de UI en el código)
- Ignorar el caso vacío (qué muestra la tabla cuando no hay datos)

---

## 📱 Para Apps de Campo (Mobile First)

Nuestros usuarios usan el producto en campo, con sol, con guantes, con señal intermitente.

**Reglas adicionales para apps de campo:**

| Elemento | Mínimo obligatorio |
|----------|-------------------|
| Botones táctiles | 48px × 48px de área de toque |
| Texto en tarjetas | 16px (nunca menos) |
| Títulos / códigos | 20px |
| Contraste de color | Alto contraste (legible con sol directo) |
| Feedback de éxito | Grande, claro, verde |
| Feedback de error | Grande, claro, rojo |

**Offline first:**
- La app debe indicar cuando no hay conexión
- Guardar progreso localmente cuando sea posible
- Al reconectar, sincronizar silenciosamente sin interrumpir al usuario

---

## 🔒 Seguridad sin Paranoia

No somos expertos en seguridad, pero seguimos estas reglas simples:

1. **Autenticación antes de todo** — Ninguna ruta/pantalla accesible sin login (excepto las explícitamente públicas)
2. **El backend valida, no solo el frontend** — Las validaciones del frontend son UX; las del backend son seguridad
3. **Cada usuario ve solo sus datos** — Nunca asumir que el ID en la URL pertenece al usuario logueado
4. **Variables de entorno para secretos** — Ninguna llave de API en el código fuente
5. **HTTPS siempre en producción** — Sin excepciones

Con Supabase:
- Habilitar RLS en CADA tabla nueva. Sin excepciones.
- Probar que un usuario no puede ver datos de otro antes de lanzar.

---

## 🗄️ Gestión de Datos

### Antes de crear cualquier tabla/estructura de datos:

1. **¿Qué datos necesita el usuario ver?** (diseña desde el output, no el input)
2. **¿Cómo crecen los datos?** (¿10 filas? ¿10,000? ¿10M?)
3. **¿Quién puede ver qué?** (define los permisos antes de escribir migraciones)
4. **¿Cómo se relacionan con lo que ya existe?** (evitar duplicar datos)

### Reglas de datos:

- IDs siempre UUID (nunca integers secuenciales expuestos)
- Fechas siempre en UTC (mostrar en la zona local del usuario)
- Campos de texto con longitud máxima definida
- Campos numéricos con tipo precisado (integer vs decimal y cuántos decimales)
- Nunca borrar datos de producción sin backup verificado

---

## 🚦 Antes de Lanzar a Usuarios Reales

Lista de verificación mínima:

**Funcional:**
- [ ] El flujo principal funciona de inicio a fin con datos reales
- [ ] Los errores más comunes tienen manejo visible
- [ ] Los formularios validan antes de enviar

**Visual:**
- [ ] Se ve bien en móvil (Chrome DevTools o teléfono físico)
- [ ] Los estados vacíos tienen mensaje útil (no pantalla en blanco)
- [ ] Los estados de carga existen en operaciones lentas

**Datos:**
- [ ] La migración/schema fue revisada
- [ ] RLS habilitado (si usas Supabase)
- [ ] Variables de entorno configuradas en producción (no en el código)

**Performance:**
- [ ] La página principal carga en menos de 3 segundos en 3G
- [ ] Las listas grandes tienen paginación o scroll virtual

---

## 🔁 Iteración Continua

El producto nunca está "terminado". El ciclo es:

```
Lanzar lo mínimo → Observar cómo lo usan → Identificar el dolor mayor → Iterar
```

**En cada iteración, la pregunta correcta no es "¿qué feature puedo agregar?"
sino "¿qué está frenando al usuario en este momento?"**

Señales de que algo anda mal:
- El usuario pregunta cómo usar algo que debería ser obvio
- El usuario prefiere Excel/WhatsApp en lugar de la app para una tarea específica
- Los datos guardados son incorrectos o incompletos con frecuencia

Estas señales son más valiosas que cualquier plan de features.

---

## 🤝 Trabajando con el Agente

### Cómo pedirle cosas al agente

**Bien:**
- "El operador necesita ver cuántas suertes tiene pendientes por labor, en total de hectáreas"
- "Cuando el usuario guarda sin seleccionar contratista, mostrar error claro debajo del campo"
- "La tabla de roturación tarda mucho en cargar, ¿por qué y cómo lo optimizamos?"

**Mal:**
- "Arregla el bug" (¿cuál bug? ¿qué debería pasar?)
- "Mejora el diseño" (¿qué aspecto? ¿para quién? ¿qué significa mejor?)
- "Hazlo más rápido" (¿qué parte? ¿cuánto es aceptable?)

### Cuando el agente propone algo que no entiendes

Pide siempre:
1. "Explícame en términos simples qué cambia y por qué"
2. "¿Qué riesgo tiene este cambio?"
3. "¿Hay una forma más simple?"

Si aún no lo entiendes — no lo apruebas. La complejidad innecesaria es deuda técnica.

### Cuando el agente se equivoca

Ocurre. El proceso correcto:
1. Describir exactamente qué está mal (qué esperabas, qué obtuviste)
2. Pedir que explique qué hará diferente esta vez
3. Aprobar el enfoque antes de que ejecute
4. Verificar que el fix realmente resuelve el problema (no solo que "parece que sí")

---

## 📊 Referencias de Velocidad Real

Lo que es posible con estas prácticas (un builder, tiempo parcial):
- 600,000+ líneas en producción en 60 días
- 10,000–20,000 líneas útiles por día
- De idea a PR en 8 comandos

La velocidad llega sola cuando el proceso es claro. Sin proceso, la velocidad es ruido.

---

## Idioma
**IDIOMA: ESPAÑOL. Toda comunicación, código, comentarios y documentación — en español.**
