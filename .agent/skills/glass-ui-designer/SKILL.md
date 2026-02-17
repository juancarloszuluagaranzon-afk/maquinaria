---
name: glass-ui-designer
description: Enforces the "Premium Glass Dark" design language. Strict adherence to specific Tailwind classes for gradients, blobs, and glassmorphism is MANDATORY.
---

# Glass UI Designer (Premium Dark Edition)

## Context
This skill protects the application's "Premium Glass Dark" aesthetic. It is not just a style guide; it is a **strict compliance standard**. You must use the exact classes defined below. Deviating from these core tokens is considered a regression ("hallucination").

## When to use this skill
- [x] ALWAYS when creating or modifying ANY frontend component (`.tsx`, `.jsx`).
- [x] When a user asks to "restore the design" or complains about "old design".
- [x] When creating dashboards, login screens, or forms.

## IMMUTABLE VISUAL CONSTANTS
You **MUST** use these exact structures and classes. Do not reinvent them.

### 1. Global Page Layout (The Container)
Every page root must look exactly like this:
```tsx
<div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  {/* Ambient Light Blobs - FIXED, POINTER-EVENTS-NONE */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>
    <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl"></div>
  </div>
  
  {/* Content */}
  <div className="relative z-10">
    {children}
  </div>
</div>
```

### 2. Glass Cards (Containers)
For dashboards, forms, and cards:
```tsx
<div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10">
  {content}
</div>
```

### 3. Headers / Navbars
```tsx
<header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 px-4 py-4 backdrop-blur-xl">
  {content}
</header>
```

### 4. Primary Action Buttons
```tsx
<button className="rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-purple-500/25 active:scale-95">
  {label}
</button>
```

### 5. Secondary / Ghost Buttons
```tsx
<button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10">
  {label}
</button>
```

### 6. Text Hierarchy
- **Headings**: `text-white font-bold`
- **Body**: `text-white/70`
- **Muted**: `text-white/40`
- **Accents**: `text-purple-400` or `text-blue-400`

### 7. Field Readability (Card Content) — MANDATORY MINIMUMS
This app is used by **field workers on mobile devices**. Small text is unacceptable.

| Element | Minimum Class | Pixels |
|---------|--------------|--------|
| Card titles / codes | `text-xl` | 20px |
| Card body text | `text-base` | 16px |
| Status badges / tags | `text-sm` | 14px |
| Timestamps / micro-labels | `text-sm` | 14px |
| Action buttons text | `text-sm` | 14px |

**NEVER** use `text-xs` (12px) or `text-[10px]` inside cards. Those sizes are only acceptable for non-essential decorative elements.

## Strict Anti-Regression Rules
1.  **NEVER** use plain `bg-slate-900` without the gradient.
2.  **NEVER** forget the ambient light blobs (`fixed inset-0`).
3.  **NEVER** use opaque backgrounds (e.g., `bg-white`, `bg-gray-800`). ALWAYS use `bg-white/5` or `bg-white/10` with `backdrop-blur`.
4.  **NEVER** remove the `border-white/10`. It is crucial for the "Glass" effect.
5.  **NEVER** use `text-xs` or smaller inside dashboard cards. Field workers can't read it.

## How to Check Your Work
Before outputting code, ask yourself:
1.  "Did I include the purple/blue blobs?"
2.  "Is the background a gradient?"
3.  "Is the header sticky and translucent?"
4.  "Are the cards using `backdrop-blur-xl`?"

If the answer to any is NO, you are breaking the design system. **FIX IT.**

## Language
**LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
