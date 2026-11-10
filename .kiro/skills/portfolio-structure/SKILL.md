---
name: portfolio-structure
description: Stack choice, folder layout, section list, and where content lives for this portfolio site. Use when scaffolding the project, adding a page or section, creating a component, deciding where a file goes, wiring content into the UI, or reviewing project structure.
---

# Portfolio structure

## Stack

Confirmed with the user. This is final; do not propose alternatives.

- **Framework:** Next.js 16 (App Router) with TypeScript. Next.js 16 has breaking changes from
  older versions: per `AGENTS.md`, read the relevant guide in `node_modules/next/dist/docs/` before
  writing code, and heed deprecation notices.
- **Styling:** Tailwind CSS v4 via `@tailwindcss/turbopack` (no PostCSS config). Tokens live in
  `src/app/globals.css` (`@theme`, `dark` class variant).
- **3D:** `three`, `@react-three/fiber`, `@react-three/drei`.
- **Scroll and animation:** `gsap` (ScrollTrigger) and `lenis` for smooth scroll.
- **Fonts:** `next/font/google`: Space Grotesk (headings), Inter (body).
- **Tests:** Vitest + Testing Library for components, Playwright for e2e.
- **Hosting:** Vercel.

No other UI, state, or animation libraries.

## Theme

One floating, code-generated 3D object (a stylised laptop/terminal) moves through scroll-driven
chapters, one per section, while a particle field behind it changes shape per section. All of this
sits behind a clean, readable text layout; the text never depends on the 3D. Use code-generated
shapes and free models only.

## Folder layout (target)

```
src/
  app/ or pages/        routes: home (/), projects/[slug], optional /blog
  components/
    layout/             Header, Footer, Nav, ThemeToggle
    sections/           Hero, About, Projects, Experience, Skills, Contact
    ui/                 Button, Card, Tag, Link — small reusable pieces
    three/              R3F canvas, floating laptop/terminal, particle field, scroll chapters
  content/
    site.ts             name, role, tagline, social links, SEO defaults
    projects/           one file per project (Markdown/MDX or TS object)
    experience.ts       jobs / education entries
    skills.ts           grouped skill list
  styles/               global CSS, design tokens
public/                 images, resume PDF, favicon, og image
tests/ or e2e/          tests
```

## Sections on the home page, in order

Hero → About → Projects (featured) → Experience → Skills → Contact. Each section is one component
in `components/sections/` with an `id` matching its nav anchor (`#about`, `#projects`, ...).

## Rules

- All visible copy comes from `src/content/`. Components receive it as props or import it.
  No sentences hard-coded in JSX.
- One component per file, PascalCase file names.
- A project page is generated from its content file; adding a project must not require a new component.
- Keep dependencies small. No UI kit, CMS, or state library unless the user asks.
