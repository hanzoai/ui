# Hanzo Design System — Canonical Tokens

`@hanzo/ui` is the single source of truth for the shared Hanzo product look across
the **Tailwind** apps (hanzo.chat, hanzo.app, hanzo console, commerce, hanzo-desktop).
Change a value here; apps converge on it. This file is that source of truth for the
three things that must read as **one product**: typography, the sidebar/panel system,
and the dark-black palette.

> One library: **`@hanzo/ui@8`** (`pkg/ui`, on **`@hanzo/gui`**) IS the component
> library — the cross-platform product/record layer every surface consumes.
> **`@hanzo/ui-shadcn`** (`pkgs/ui`) is the legacy shadcn/Tailwind/Radix kit, kept
> only for existing v5 consumers (pin `@hanzo/ui-shadcn@^5`; no new adoptions).
> This file stays the source of truth for the *token values* (fonts, dark palette,
> the sidebar glyph) both render.

---

## 1. Typography — Zen

One family, ours. `@hanzo/font` publishes it — the binaries and the `@font-face`,
under the SIL Open Font License — and it is the ONLY place they live. `@hanzo/ui`
names the two roles and delivers no bytes: `scripts/compose-theme.mjs` strips every
`@font-face` and rejects every `url()` it would have to carry, because this package
ships `dist` alone and a relative asset reference in a composed sheet resolves to
nothing. So a surface spends one import on the faces and one on the tokens. No app
self-hosts a licensed third-party face any more.

| Role | Family | Notes |
|------|--------|-------|
| UI / body / display / heading (`sans`) | **Zen** | Variable weight; bound through `--font-sans`. |
| code / data / mono (`mono`) | **Zen Mono** | Bound through `--font-mono`. |
| Arabic / Hebrew (`--font-ar` / `--font-he`) | unchanged | i18n only — keep. |

**The token names the ROLE, not the face** — `--font-sans` / `--font-mono`. A token
that carries a family's own name goes stale the next time the face moves, which is
exactly what the previous one did; `--font-zen-sans` would repeat it with our own
family. Ours were renamed for that reason, and the rename is why ~40 surfaces that
were only obeying this package can now be corrected in one place.

**Dropped as defaults:** every third-party face this repo used to name — grotesks,
display faces and the two the token names used to be spelled after. Zen and Zen Mono
are the whole list now.

### Where the old faces land

`@hanzo/font/presets.css` (≥ 1.8.1) defines these as real classes — `.zen-air`,
`.zen-book`, `.zen-medium`, `.zen-wide`, `.zen-round`. Use the class; do not restate
the numbers. Nothing in this repo needs one: every face replaced here shared Zen's
lineage, so it is a plain family swap with no register to reconstruct.

| Was | Now | Class |
|-----|-----|-------|
| a grotesk at book weight | Zen wght **497** | `.zen-book` |
| the same grotesk at medium | Zen wght **606** | `.zen-medium` |
| a wide display face | Zen wght **845** + `scaleX(1.56)` + `-0.04em` | `.zen-wide` |
| the previous sans | Zen | plain family swap |
| the previous mono | Zen Mono | plain family swap |

**x-height.** The grotesk's x-height is 0.718 of its cap and Zen's is 0.746, so at one
font-size Zen's lowercase renders ~4% larger. Where Zen REPLACES that grotesk, multiply
the font-size by **0.962** at the one place the size is stated. It does NOT apply to the
sans and mono the token names used to be spelled after: those share Zen's lineage and
their x-heights agree, and they are the only faces this repo ever named — so no size
moved here.

Per-app adoption:
- **Any React surface** → two imports at the root, in this order, and bind nothing:

  ```ts
  import '@hanzo/font/css'      // the faces — @font-face, and nothing else
  import '@hanzo/ui/theme.css'  // the tokens — names --font-sans / --font-mono
  ```

  `@hanzo/font` is a dependency of `@hanzo/ui`, so the specifier resolves without
  the surface adding it. theme.css alone names the families and loads no bytes.
- **A host that loads Zen itself** (next/font, @fontsource) binds `--font-sans` /
  `--font-mono` to its generated family. Ours are declared in `@layer hanzo.font`,
  so the host's unlayered binding wins whatever the source order.
- **A host that wants a different face entirely** binds `--font-sans-provided` /
  `--font-mono-provided`.

---

## 2. Sidebar toggle icon — lucide `PanelLeft`

One glyph everywhere: lucide **`PanelLeft`** (the shadcn `SidebarTrigger` default).
Where a directional open/close affordance is wanted, use the pair
**`PanelLeftClose`** (expanded) / **`PanelLeft`** (collapsed). Never a hamburger,
a magnifier, a directional arrow, or a bespoke panel SVG for the sidebar toggle.

- Icon: stroke-2, ~16–20px, `currentColor`.
- Button: ghost/outline, square (`size-7`/`h-6 w-6`), subtle hover.

---

## 3. Sidebar + panels

| Spec | Value |
|------|-------|
| Sidebar width (expanded) | **16rem / 256px** (`SIDEBAR_WIDTH`) |
| Sidebar width (collapsed / icon rail) | **3rem / 48px** (apps vary 48–70px) |
| Sidebar / panel surface | resting **#0a0a0a** over the true-black page |
| Border / separation | `border-border` — subtle white-alpha ~10% in dark (`border-r` / `border-l`) |
| Item hover | subtle `white/5` |
| Item active | monochrome `white/10` — **no colored accent** (the house style is monochrome) |
| Right panel rail | `border-l border-border`, same surface, collapsible |

Prefer the `@hanzo/ui` `Sidebar` primitive (`pkgs/ui/primitives/sidebar.tsx`,
`SidebarTrigger` → `PanelLeft`) where the app can consume it; otherwise match these
classes/tokens.

---

## 4. Dark-black palette (true-black OLED)

The house dark theme is a **true-black** canvas (matches hanzo.ai marketing +
hanzo.chat OLED), with a shallow surface-depth ladder for cards/panels and quiet
hairline borders — never harsh pure-white on pure-black.

| Token | Value | Use |
|-------|-------|-----|
| Page background | **#000000** (`oklch(0 0 0)`) | body / canvas |
| Surface / sidebar / panel (resting) | **#0a0a0a** | sidebars, panels, cards |
| Press | **#050505** | pressed surface |
| Elevated / hover | **#171717** | hover, raised card |
| Border / divider | **rgba(255,255,255,0.10)** (≈ `#171717` opaque on black) | hairlines |
| Foreground (primary text) | near-white **#ededf1** (`oklch(0.985)`) — not pure `#fff` | body text |
| Muted / secondary text | `white/70` (≈ `#a1a1aa`) | secondary |

Keep each app's theme-token engine (CSS vars / Tailwind tokens / Tamagui `$color*`);
converge the **values/usage** to the table above, don't rip the engine.

Reference: `pkgs/ui/style/hanzo-default-colors.css` (`.dark` / `.hanzo-ui-dark-theme`).
