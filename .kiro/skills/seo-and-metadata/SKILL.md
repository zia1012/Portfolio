---
name: seo-and-metadata
description: SEO and link-preview requirements for the portfolio, covering page titles, meta descriptions, canonical URLs, Open Graph and Twitter cards, sitemap, robots.txt, favicon, and Person structured data. Use when adding a page, editing the head or metadata, creating an og image, or auditing SEO.
---

# SEO and metadata

Every page has:
- `<title>`: `Page – Name` (home: `Name – Role`), ≤ 60 chars.
- `<meta name="description">`: 150–160 chars, unique.
- Canonical URL.
- Open Graph: `og:title`, `og:description`, `og:image` (1200×630, < 300 KB, absolute URL), `og:url`, `og:type`.
- `twitter:card` = `summary_large_image`.

Site-wide:
- `sitemap.xml` including every project page; `robots.txt` pointing to it.
- Favicon set (`favicon.ico`, `icon.svg`, `apple-touch-icon.png` 180×180).
- JSON-LD `Person` on the home page: `name`, `jobTitle`, `url`, `sameAs` (social profiles), `image`.
- Defaults (site name, base URL, default og image) live in `src/content/site.ts`; pages override them.

Do not:
- Do not use the same description on every page.
- Do not block crawlers in `robots.txt` on production.
