---
name: performance
description: Performance budget and rules for the portfolio covering Core Web Vitals (LCP, CLS, INP), image formats and sizes, font loading, JavaScript bundle size, lazy loading, and the 3D scene (R3F canvas, particles, models, fallbacks). Use when adding images, fonts, libraries, animations, or 3D work, or when auditing load speed.
---

# Performance

## Budget
- LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-range mobile.
- Initial home page JS (compressed, before the 3D chunk loads) < 150 KB. Lighthouse performance ≥ 90.
- Total 3D payload (three/R3F/drei chunks, models, textures) ≤ 3–5 MB.

## 3D scene
- All text is server-rendered and readable without the 3D scene. The LCP element is text, never the canvas.
- Load the R3F canvas with `next/dynamic` and `ssr: false`, after first paint. It must not block or
  delay the text.
- The canvas sits in a fixed, pre-sized layer so loading it causes no layout shift.
- Mobile: fewer particles and simpler geometry. Cap device pixel ratio at 1.5 (`dpr={[1, 1.5]}`).
- `prefers-reduced-motion: reduce` or no WebGL support → render a static fallback (no canvas, no
  scroll-driven motion).
- Models are compressed `.glb` (Draco or Meshopt). Prefer code-generated geometry over models.
- Pause rendering when the canvas is off screen or the tab is hidden (`frameloop="demand"` or equivalent).
- Import only the drei helpers you use.

## Images
- Use `next/image` with explicit width/height.
- AVIF/WebP. Hero image < 200 KB, project thumbnails < 100 KB. Source files no wider than 2× display size.
- Hero/LCP image loads eagerly with high priority; everything below the fold is lazy.

## Fonts
- ≤ 2 families, ≤ 4 weights total, WOFF2, subset, `font-display: swap`, preload the main one.

## JavaScript
- Static by default; hydrate only interactive parts (theme toggle, menu, form, 3D scene).
- `gsap` (ScrollTrigger) and `lenis` are the confirmed scroll libraries. Do not add others; use CSS
  for simple effects.
- Third-party scripts (analytics, embeds) load deferred, and only if the user asked for them.

## Layout stability
- Reserve space for images, embeds, and the canvas. No content injected above existing content after load.
