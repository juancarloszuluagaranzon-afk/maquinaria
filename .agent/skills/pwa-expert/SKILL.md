---
name: pwa-expert
description: Expert guidance on Progressive Web App (PWA) implementation and best practices.
---

# PWA Expert Skill

This skill provides expertise in converting web applications into Progressive Web Apps (PWAs), ensuring offline capabilities, installability, and optimal performance.

## Core Principles
1.  **Reliability**: Load instantly and never show the "downasaur", even in uncertain network conditions.
2.  **Fast**: Respond quickly to user interactions with silky smooth animations and no janky scrolling.
3.  **Engaging**: Feel like a natural app on the device, with an immersive user experience.

## Best Practices (Vite + React)

### 1. Configuration (`vite-plugin-pwa`)
-   Always use `vite-plugin-pwa`.
-   **RegisterType**: Use `'autoUpdate'` for simple apps, or `'prompt'` for critical apps where data integrity matters (prevents version mismatch during use). **For this project, use 'prompt' to let users control updates.**
-   **Manifest**: Ensure all mandatory fields are present:
    -   `name` & `short_name`
    -   `description`
    -   `theme_color` & `background_color`
    -   `icons`: Must include 192x192 and 512x512 sizes. Maskable icons recommended.
    -   `display`: `standalone` or `fullscreen`.

### 2. Caching Strategies (Workbox)
-   **StaleWhileRevalidate**: For static resources (JS, CSS, Images, Fonts).
-   **NetworkFirst**: For API responses that *can* be cached but freshness is priority.
-   **NetworkOnly**: For critical mutations (POST/PUT/DELETE) and real-time data.

### 3. Update Handling
-   Implement a prominent "New content available" toast/prompt. The user must explicitly click "Reload" to activate the new Service Worker.
-   Do NOT silently update and reload, as this can lose user state (forms, etc.).

### 4. Field Usage Considerations
-   For apps used in "Campo" (Field):
    -   Assume flaky or no internet.
    -   Cache the "App Shell" aggressively.
    -   Graceful degradation: UI should clearly indicate offline status.

## Implementation Steps
1.  Install `vite-plugin-pwa`.
2.  Add plugin to `vite.config.ts`.
3.  Add `ReloadPrompt` component.
4.  Generate or verify `pwa-assets`.
5.  Build and test.

## Common Pitfalls
-   Missing `favicon.ico` or icons in `public/` causes build warnings or install failures.
-   `scope` and `start_url` misconfiguration preventing PWA installation.
-   Caching API responses without expiration, leading to stale data that never updates.

