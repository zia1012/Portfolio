---
name: deployment
description: Hosting and CI setup for the portfolio on Vercel, Netlify, or GitHub Pages, including GitHub Actions build and test workflow, environment variables, security headers, redirects, and custom domain steps. Use when deploying, writing CI workflows, configuring hosting, adding environment variables, or connecting a domain.
---

# Deployment

## CI (GitHub Actions) — `.github/workflows/ci.yml`
On push and pull request to `main`: checkout → setup Node (LTS, with npm cache) → `npm ci` →
`npm run build` → `npm test` (if present) → Playwright (if present). Pin action major versions.

## Hosting options
- **Vercel / Netlify:** connect the repo in their dashboard; they build on push. Config only needed
  for headers/redirects (`vercel.json` / `netlify.toml`).
- **GitHub Pages:** needs a static export (Next.js `output: 'export'`, or Astro default) and a base
  path if not on a custom domain. Deploy with `actions/upload-pages-artifact` + `actions/deploy-pages`.
  Framework config changes are frontend-dev's job.

## Environment variables
- Only the contact-form service key (if any) should exist. Document it in `.env.example` with an empty value.
- Browser-exposed prefixes (`NEXT_PUBLIC_`, `PUBLIC_`) are visible to everyone. Never put secrets behind them.
- Real values go in the hosting dashboard or GitHub repository secrets.

## Security headers
`Content-Security-Policy` (start strict, allow only what is used), `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disabling unused features,
`Strict-Transport-Security` once HTTPS on the domain is confirmed.

## Custom domain
Write the DNS records needed (A/ALIAS or CNAME) in `DEPLOY.md`. The user changes DNS; agents never do.
