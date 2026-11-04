---
name: performance
description: Performance budget and rules for the portfolio covering Core Web Vitals (LCP, CLS, INP), image formats and sizes, font loading, JavaScript bundle size, and lazy loading. Use when adding images, fonts, libraries, or animations, or when auditing load speed.
---

# Performance

## Budget
- LCP < 2.5s, CLS < 0.1, INP < 200ms on mid-range mobile.
- Home page JS (compressed) < 150 KB. Lighthouse performance ≥ 90.

## Images
- Use the framework image component (`next/image`, Astro `<Image>`) with explicit width/height.
- AVIF/WebP. Hero image < 200 KB, project thumbnails < 100 KB. Source files no wider than 2× display size.
- Hero/LCP image loads eagerly with high priority; everything below the fold is lazy.

## Fonts
- ≤ 2 families, ≤ 4 weights total, WOFF2, subset, `font-display: swap`, preload the main one.

## JavaScript
- Static by default; hydrate only interactive parts (theme toggle, menu, form).
- No library for something CSS or ~20 lines of code can do (scroll animations, smooth scroll, carousels).
- Third-party scripts (analytics, embeds) load deferred, and only if the user asked for them.

## Layout stability
- Reserve space for images and embeds. No content injected above existing content after load.
