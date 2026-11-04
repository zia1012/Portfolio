---
name: portfolio-structure
description: Stack choice, folder layout, section list, and where content lives for this portfolio site. Use when scaffolding the project, adding a page or section, creating a component, deciding where a file goes, wiring content into the UI, or reviewing project structure.
---

# Portfolio structure

## Stack

No project exists yet at the time this skill was written. Default proposal, to be confirmed with the
user before scaffolding:

- **Framework:** Astro or Next.js (App Router) with TypeScript. Astro if the site is mostly static
  content; Next.js if the user wants React-heavy interactivity or API routes.
- **Styling:** Tailwind CSS.
- **Tests:** Vitest + Testing Library for components, Playwright for e2e.
- **Hosting:** Vercel, Netlify, or GitHub Pages (static export).

Once the user picks, update this section with the actual choice so every agent sees it.

## Folder layout (target)

```
src/
  app/ or pages/        routes: home (/), projects/[slug], optional /blog
  components/
    layout/             Header, Footer, Nav, ThemeToggle
    sections/           Hero, About, Projects, Experience, Skills, Contact
    ui/                 Button, Card, Tag, Link — small reusable pieces
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
