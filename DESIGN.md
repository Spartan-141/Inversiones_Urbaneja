# DESIGN.md: Inversiones Urbaneja Design System

## Core Aesthetic
- **Style**: Soft UI Evolution / Dimensional Layering (Dark Mode).
- **Theme**: Premium Dark (OKLCH based). Depth through surface lightness, not shadows.

## Color Palette (OKLCH)
- **Primary (Accent)**: `oklch(65% 0.18 250)` (Vibrant Blue/Indigo for CTAs).
- **Background**: `oklch(15% 0.01 250)` (Deep Charcoal, tinted with brand hue).
- **Surface (L1)**: `oklch(20% 0.01 250)` (Cards).
- **Surface (L2)**: `oklch(25% 0.01 250)` (Modals).
- **Success**: `oklch(75% 0.15 150)` (Emerald).
- **Error**: `oklch(65% 0.2 25)` (Coral/Red).
- **Warning**: `oklch(80% 0.15 85)` (Amber).

## Typography
- **Primary**: Inter / Sans-serif (Clean, readable).
- **Monospaced**: JetBrains Mono (For prices and numeric codes).
- **Body Text**: Light weight (350/400) for dark mode readability.

## Spacing & Layout
- **Grid**: 8px modular scale.
- **Rhythm**: Varied padding to avoid monotony.
- **Line Length**: 65-75ch for description texts.

## Interaction Laws
- **CTAs**: Solid background, high contrast, smooth hover transition (200ms).
- **Inputs**: Focus state with high-chroma border (`oklch(65% 0.18 250)`).
- **Motion**: No bounce. Use `ease-out-quart`.

## Absolute Bans
1. No side-stripe borders on callouts.
2. No gradient text.
3. No pure black (#000) or pure gray. Always tint.
4. No modals as first thought (prefer slide-overs or inline expands).
