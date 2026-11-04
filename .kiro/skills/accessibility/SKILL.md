---
name: accessibility
description: WCAG 2.2 AA checklist for the portfolio covering semantic HTML, landmarks, headings, keyboard navigation, focus, contrast, alt text, forms, theme toggle, and reduced motion. Use when building or reviewing any component, nav, modal, form, image, or animation, or when running an accessibility audit.
---

# Accessibility checklist (WCAG 2.2 AA)

## Structure
- `<html lang="...">` set. One `h1` per page; headings do not skip levels.
- Landmarks: `header`, `nav`, `main`, `footer`. A "Skip to content" link is the first focusable element.

## Keyboard
- Everything clickable is reachable and usable with Tab, Shift+Tab, Enter, Space, Escape.
- Clickable things are `<a>` (navigates) or `<button>` (acts). No `div onClick`.
- Visible focus indicator with 3:1 contrast (`:focus-visible`). Focus not hidden by sticky headers (2.4.11).
- Mobile menu: toggle is a button with `aria-expanded` and `aria-controls`; Escape closes it; focus returns to the toggle.

## Colour
- Text contrast 4.5:1 (large text 3:1), UI components and focus rings 3:1, in both themes.
- Information is never conveyed by colour alone.

## Images and media
- Meaningful images have descriptive `alt`; decorative images have `alt=""`.
- Icon-only links/buttons (GitHub, LinkedIn, theme toggle) have an accessible name.

## Forms
- Every input has a visible `<label>`. Errors are text, linked with `aria-describedby`, announced via `aria-live="polite"`.
- Success/failure of submit is announced.

## Motion
- Respect `prefers-reduced-motion`. No auto-playing motion longer than 5s without a pause control.

## Links
- Link text makes sense out of context ("View Project X source", not "click here").
- Links opening a new tab say so (visually or in the accessible name).
