---
name: glass-ui-designer
description: Generates React/Tailwind frontend code for Machinery Management applications with a strict "Liquid Glass" aesthetic.
---

# Glass UI Designer

## Context
This skill specializes in creating high-fidelity, premium frontend components for machinery management. It strictly enforces a "Liquid Glass" design language, ensuring 2026-standard aesthetics with deep glassmorphism, organic fluid gradients, and mobile-first responsiveness.

## When to use this skill
- [ ] When the user asks to generate UI components for the "Castilla Agrícola" or similar machinery apps.
- [ ] When the user requests "Liquid Glass" or "Glassmorphism" styles.
- [ ] When creating dashboards, machine status cards, or operator interfaces.

## Instructions
1.  **Enforce Stack:** Always use React, Tailwind CSS, and Framer Motion.
2.  **Apply Visual Core Principles:**
    *   **Backgrounds:** Use transparency and blur strongly. Example: `backdrop-blur-xl bg-white/10` (or dark equivalent).
    *   **Borders:** Subtle, semi-transparent white borders. Example: `border border-white/20`.
    *   **Shadows:** Soft, diffuse shadows for depth. Example: `shadow-lg shadow-black/5`.
    *   **Gradients:** Use organic, fluid background gradients (e.g., mixing deep blues, cyans, and purples for dark mode).
3.  **Implement Interactions:**
    *   Add hover states that increase brightness or slight elevation (`hover:scale-105`, `hover:bg-white/20`).
    *   Use Framer Motion for smooth entry animations and state changes.
4.  **Prioritize Mobile-First:**
    *   Ensure large touch targets (min 44px).
    *   Use responsive classes (`md:`, `lg:`) to scale up, but start with mobile layouts.
5.  **Domain Specificity:**
    *   When creating cards for machinery, include indicators for Fuel, Status (Active/Maintenance), and Alerts.
    *   Use color coding (Green/Yellow/Red) but keep it "glassy" (e.g., `bg-green-500/20 text-green-100`).

## Scripts & Tools
- No specific scripts currently. Use standard `write_to_file` to generate `.tsx` and `.css` files.
