# Guía de Despliegue en Vercel

Esta aplicación está construida con **Vital + React + TypeScript** y utiliza **Supabase** como backend. La opción más recomendada y sencilla para desplegarla es **Vercel**.

## 1. Preparación (Ya realizado)

Hemos creado un archivo `.gitignore` para asegurar que no se suban archivos sensibles (como `.env`) ni carpetas pesadas (`node_modules`) al repositorio.

## 2. Opción A: Despliegue Automático con GitHub (Recomendado)

Esta es la mejor opción para mantenimiento a largo plazo. Cada vez que hagas un "push" a GitHub, Vercel actualizará tu sitio automáticamente.

1.  **Sube tu código a GitHub**:
    *   Crea un nuevo repositorio en [GitHub](https://github.com/new).
    *   Ejecuta los siguientes comandos en tu terminal (en la carpeta del proyecto):
        ```bash
        git init
        git add .
        git commit -m "Primer commit"
        git branch -M main
        git remote add origin <URL_DE_TU_REPO_GITHUB>
        git push -u origin main
        ```

2.  **Conecta con Vercel**:
    *   Ve a [vercel.com](https://vercel.com) e inicia sesión (puedes usar tu cuenta de GitHub).
    *   Haz clic en **"Add New..."** -> **"Project"**.
    *   Selecciona tu repositorio de GitHub de la lista e importa.

3.  **Configura el Proyecto**:
    *   **Framework Preset**: Debería detectar automáticamente "Vite". Si no, selecciónalo.
    *   **Root Directory**: `./` (o déjalo en blanco si está en la raíz).

4.  **Variables de Entorno (IMPORTANTE)**:
    *   Despliega la sección **"Environment Variables"**.
    *   Debes copiar las variables de tu archivo `.env` local y pegarlas aquí.
    *   Asegúrate de agregar (por ejemplo):
        *   `VITE_SUPABASE_URL`: (Tu URL de Supabase)
        *   `VITE_SUPABASE_ANON_KEY`: (Tu clave anónima de Supabase)
        *   Cualquier otra variable que empiece con `VITE_` que uses en tu app.

5.  **Deploy**:
    *   Haz clic en **"Deploy"**. Espera unos minutos y tu sitio estará en línea.

## 3. Opción B: Despliegue Manual (Vercel CLI)

Si solo quieres probar rápido sin usar GitHub aún.

1.  Instala Vercel CLI:
    ```bash
    npm i -g vercel
    ```
2.  Ejecuta el comando en la raíz de tu proyecto:
    ```bash
    vercel
    ```
3.  Sigue las instrucciones en pantalla.
    *   Cuando te pregunte "Want to modify these settings?", responde `y` si necesitas configurar variables de entorno, o configúralas después en el dashboard web.
4.  Para producción:
    ```bash
    vercel --prod
    ```

## Notas Adicionales

*   **Rutas (Routing)**: Vercel maneja automáticamente la configuración para Single Page Apps (SPA) como React, así que si un usuario recarga la página en `/dashboard`, no dará error 404.
*   **Supabase**: Asegúrate de que en el panel de Supabase (Authentication -> URL Configuration -> Site URL) agregues la URL que te genere Vercel (ej: `https://tu-proyecto.vercel.app`) para que funcionen las redirecciones de login/auth si las usas.
