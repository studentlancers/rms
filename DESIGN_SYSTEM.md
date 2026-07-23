# Design System

Minimalist Modern is the project design setup for HMS. It uses a warm off-white canvas, deep slate text, and a single electric-blue accent to keep the UI restrained but distinctive.

## Core Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--background` | `#fafafa` | Primary page background |
| `--foreground` | `#0f172a` | Main text and inverted section background |
| `--muted` | `#f1f5f9` | Subtle surfaces and secondary fills |
| `--muted-foreground` | `#64748b` | Secondary text and helper copy |
| `--accent` | `#0052ff` | Primary action color and highlights |
| `--accent-secondary` | `#4d7cff` | Gradient endpoint for accent treatments |
| `--accent-foreground` | `#ffffff` | Text on accent backgrounds |
| `--border` | `#e2e8f0` | Card borders and dividers |
| `--card` | `#ffffff` | Elevated surfaces |
| `--ring` | `#0052ff` | Focus ring color |

## Typography

The app loads three fonts through `next/font/google`:

- `Inter` for UI copy and body text
- `Calistoga` for display headlines
- `JetBrains Mono` for labels, badges, and technical UI accents

## Reusable Styles

The setup file in [src/app/design-system.css](src/app/design-system.css) defines a small set of reusable utilities:

- `.design-gradient-text` for gradient headline accents
- `.design-section-label` for section badges with a pulsing-dot feel
- `.design-surface` for standard cards and panels
- `.design-surface-elevated` for featured cards or emphasized surfaces
- `.design-inverted-section` for dark contrast sections
- `.design-dot-grid` for subtle textured backgrounds
- `.design-float` for slow vertical floating motion

## Usage Rules

- Keep the palette tight: background, foreground, muted, and accent should do most of the work.
- Use `design-gradient-text` and the accent gradient sparingly so they stay meaningful.
- Prefer `design-surface` and `design-surface-elevated` over one-off shadows and borders.
- Keep motion slow and purposeful, and respect reduced-motion preferences.
- Use `design-inverted-section` for spotlight sections, stats bands, or final CTA areas.

## Files

- [src/app/design-system.css](src/app/design-system.css)
- [src/app/globals.css](src/app/globals.css)
- [src/app/layout.tsx](src/app/layout.tsx)