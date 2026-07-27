# @hanzo/ui backends

`@hanzo/ui` is backend-flexible: one shared design core, many rendering
substrates. A "backend" is a directory under `src/backends/<name>/` that
implements components on one substrate. Every backend draws from the SAME core
(`src/core` + `theme.css`): the Hanzo dark-first identity, the standard design
tokens (sourced from `@hanzo/tokens`), and Geist Sans/Mono typography. Backends
differ ONLY in substrate — never in design language.

```
src/
  core/                one design core, backend-agnostic
    cn.ts              class-name composer (clsx + tailwind-merge)
    tokens.ts          re-export of @hanzo/tokens (the token source of truth)
    fonts.ts           Geist Sans / Geist Mono family variables
  theme.css            self-contained standard token vars + Geist (the identity)
  backends/
    shadcn/            Radix + Tailwind — the shadcn-compatible web API (default)
    gui/               @hanzo/gui (Tamagui) — cross-platform web + native + desktop
    <your-backend>/    e.g. svelte, solid, vue, react-native — add here
```

## Contract a backend implements

- Components use ONLY the standard design tokens (`bg-popover`, `border-border`,
  `bg-primary`, `text-muted-foreground`, …) or the gui token config — never
  app-private token names, never a hard-coded font family (inherit, or bind to
  `font-sans` / `font-mono`, which resolve to Geist through the theme).
- A backend exposes a barrel `index.ts` naming its component surface.
- Behaviour-heavy components (dialog, dropdown, select, popover, tooltip) keep an
  accessible primitive (Radix on the web) rather than reimplementing focus
  management, portalling, and keyboard handling.

## Adding a backend (e.g. svelte)

1. `src/backends/svelte/` with the component implementations on that substrate,
   styled from the shared tokens.
2. A barrel `src/backends/svelte/index.ts`.
3. A package `exports` subpath (`./svelte`) pointing at the barrel.

The gui + shadcn backends are what exist today; the structure is what makes the
next one drop-in.
