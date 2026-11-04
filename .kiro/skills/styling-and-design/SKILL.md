---
name: styling-and-design
description: Design tokens, colour, typography, spacing, responsive breakpoints, dark mode, and animation rules for the portfolio. Use when styling any component, adding colours or fonts, building responsive layout, implementing the theme toggle, adding animations or hover effects, or reviewing visual consistency.
---

# Styling and design

## Tokens

Define colours, font sizes, radii, and spacing once (Tailwind theme or CSS custom properties in
`src/styles/`). Components use tokens, never raw hex values or one-off pixel sizes.

Colour roles: `background`, `surface`, `text`, `text-muted`, `accent`, `accent-contrast`, `border`.
Each role has a light and a dark value. Every text/background pair must reach 4.5:1 contrast
(3:1 for text 24px+ or 18.66px+ bold).

## Typography

- At most two font families. Self-host or use the framework font loader with `font-display: swap`.
- Body text 16px minimum, line length about 60–75 characters (`max-w-prose`).

## Responsive

- Mobile first. Design at 360px, then `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- No horizontal scroll at any width. Tap targets at least 44×44px.

## Dark mode

- Default to the system preference (`prefers-color-scheme`), allow a manual toggle, persist the
  choice in `localStorage`.
- Set the theme class before first paint (inline script in `<head>`) to avoid a flash of the wrong theme.

## Animation

- Subtle: fades and short translations, 150–400ms.
- Wrap every non-essential animation in `@media (prefers-reduced-motion: no-preference)` or the
  equivalent check. Never animate layout-shifting properties on load.
- Do not add an animation library for effects CSS can do.

## Do not

- Do not use inline `style` for things tokens cover.
- Do not hide focus outlines without a visible replacement.
