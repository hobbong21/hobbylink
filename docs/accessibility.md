# Accessibility Guidelines

This project targets **WCAG 2.1 AA** compliance. The rules below are enforced
by code review, not tooling alone — `@axe-core/playwright` runs against key
pages in CI, but we still catch most issues in PRs.

## Focus visibility

- All interactive elements (`<a>`, `<button>`, `<input>`, `<select>`,
  `<textarea>`, `<summary>`, `[role="button"]`, `[tabindex]`) get a
  **2px solid `var(--ring)` outline with 2px offset** on `:focus-visible`.
  See the safety-net in `app/globals.css`.
- Components with custom focus rings (Button, Input, etc.) opt out by setting
  their own `focus-visible:ring-*` classes, which take priority because the
  safety-net uses `:where()` (specificity 0).
- Outlines should **never** be suppressed with `outline: none` on focused
  elements. The `:focus:not(:focus-visible)` reset only removes rings for
  mouse clicks.

## Skip links

`components/layout/skip-link.tsx` renders "메인 콘텐츠로 바로가기" at the top
of every `(main)` route. It's visually hidden until keyboard focus lands on
it. The target `#main-content` has `tabindex="-1"` so it receives focus
after activation.

## Reduced motion

Users with `prefers-reduced-motion: reduce` at the OS level get all
transitions and animations collapsed to `0.001ms` via the global rule. Hero
spotlights and hover transforms still render correctly — only the motion is
removed. Never add `transition` inline without wrapping it in
`@media (prefers-reduced-motion: no-preference)` for elaborate animations.

## Labels & ARIA

- Icon-only buttons always have `aria-label` (e.g. ThemeToggle, MobileNav
  FAB). Lucide icons carry `aria-hidden="true"` because the visible label
  supplies meaning.
- Status messages use `role="status"` (non-critical) or `role="alert"`
  (interrupting) with `aria-live="polite"`.
- Dialogs (`Dialog` from shadcn) already handle focus-trap and escape;
  never hand-roll modals.

## Color contrast

The Trust/Pro palette is tuned so:

- `--foreground` on `--background` ≥ **7:1** (both modes, AAA)
- `--muted-foreground` on `--background` ≥ **4.5:1** (AA)
- `--primary` on `--primary-foreground` ≥ **4.5:1**
- Chart colors selected to be distinguishable with deuteranopia (cool-to-warm
  ramp rather than red-green)

## Screen reader order

- `<main id="main-content" tabindex="-1">` wraps page content.
- Headings follow `h1` per page → `h2` for major sections → `h3` for cards.
- `aria-current="page"` on active nav items.

## Mobile tap targets

- Minimum 44×44 px (iOS HIG). Enforced on the bottom nav (`min-h-[56px]`
  per item) and all primary buttons (`h-10` default, `h-12` for large).
- Central FAB on bottom nav is 48×48 to match Material guidance for raised
  actions.

## CI checks

- `test:a11y` runs Playwright + `@axe-core/playwright` against:
  - `/` — landing
  - `/events`
  - `/events/[id]` — sample
  - `/home` — dashboard
  - `/settings`
- Violations with impact ≥ `serious` fail the build.

## Known gaps

- `/admin/*` is not in the a11y CI suite (internal tool — manual review).
- Rich text posts in `/community/[postId]` don't enforce heading order
  inside user content. We sanitize HTML but don't rewrite heading levels.
