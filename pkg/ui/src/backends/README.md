# @hanzo/ui — the component surface

There is ONE substrate. `gui/` implements every component on @hanzo/gui
(Tamagui) primitives, so the same import renders on web, native (expo) and
desktop (Tauri). The Radix + Tailwind surface that used to live beside it has
moved out to its own package; nothing here depends on it.

```
src/
  core/                design core, runtime-free
    cn.ts              class-name composer (clsx)
    tokens.ts          re-export of @hanzo/design (the token source of truth)
    fonts.ts           Geist Sans / Geist Mono family variables
  theme.css            self-contained token vars + Geist (the identity)
  backends/gui/        the component surface — index.ts is its manifest
  product/             the product/app layer, same substrate (@hanzo/ui/product)
  primitives/          GENERATED per-member entrypoints (see below)
```

## Rules a component follows

- Style through gui props and theme tokens (`$background`, `$color12`,
  `$borderColor`) — never a utility class string, never a hard-coded font
  family. Typography inherits Geist through the token config.
- Touch targets meet the 44px floor via `hitSlop`, never via padding: visual
  density and hit area are two concerns.
- Behaviour (focus management, portalling, keyboard, a11y) comes from the
  matching `@hanzogui/*` primitive. Nothing here reimplements it.
- Free-form text children go through `ink()` so a bare string renders on native.
- `data-slot` markers go through `slot()`. One helper each, one place.

## The manifest

`gui/index.ts` is the SINGLE source of truth for the surface. `scripts/gen-primitives.mjs`
reads it and emits `src/primitives/<Member>.tsx`, one per exported value, for hosts
that modularize `@hanzo/ui` imports. Change the barrel, then re-run:

    node scripts/gen-primitives.mjs
