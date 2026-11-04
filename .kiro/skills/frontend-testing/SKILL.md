---
name: frontend-testing
description: Test strategy for the portfolio, covering Vitest and Testing Library component tests, Playwright end-to-end smoke tests, axe accessibility checks, file locations, and what to mock. Use when writing, fixing, or reviewing tests, setting up a test runner, or checking navigation, links, the contact form, or the theme toggle.
---

# Frontend testing

## Tools (recommended; confirm what is installed in package.json)
- Component: Vitest + @testing-library/react (or the framework's equivalent) + jsdom.
- E2E: Playwright, run against `npm run build` output.
- A11y: `@axe-core/playwright` on each page.

## Locations
- Component tests next to the component: `Hero.test.tsx`.
- E2E tests in `e2e/` (or `tests/e2e/`).

## What to test
- **Components:** renders content passed as props; empty or missing optional fields don't crash; theme toggle switches and persists.
- **E2E smoke:** home loads; every nav link scrolls/navigates to its section; every project page from content returns 200; no broken internal links; mobile menu opens and closes with keyboard; 360px viewport has no horizontal scroll.
- **Contact form:** required field errors show; submit success and failure states show; network call is mocked.
- **Axe:** zero serious or critical violations on each route, in light and dark theme.

## Rules
- Query by role and accessible name (`getByRole('link', { name: /projects/i })`), not CSS classes. Use `data-testid` only as a last resort.
- Mock network calls only. Do not mock your own components.
- Do not snapshot whole pages; they break on every copy change.
- Do not weaken an assertion to make it pass.
