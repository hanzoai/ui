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

One family, ours. `@hanzo/font` publishes it, carries the binaries and declares the
`@font-face`, so a surface that imports `@hanzo/font/css` has the faces with nothing
further to do. No app self-hosts a face of its own.

| Role | Family | Notes |
|------|--------|-------|
| UI / body / display / heading (`sans`) | **Zen** | Variable weight; bound through `--font-sans`. |
| code / data / mono (`mono`) | **Zen Mono** | Bound through `--font-mono`. |
| Arabic / Hebrew (`--font-ar` / `--font-he`) | unchanged | i18n only — keep. |

**The token names the ROLE, not the face** — `--font-sans` / `--font-mono`. A token
spelled for a face goes stale the moment the face moves.

**The stack.** Zen first, then the native faces, then the generic:

```css
--font-sans: Zen, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: Zen Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
```

**Registers.** `@hanzo/font/presets.css` defines `.zen-air`, `.zen-book`,
`.zen-medium`, `.zen-wide`, `.zen-round`. Use the class; do not restate the numbers.

Per-app adoption:
- **Any React surface** → `import '@hanzo/font/css'` and bind nothing.
- **A host that loads Zen itself** binds `--font-sans` / `--font-mono` to its
  generated family. Ours are declared in `@layer hanzo.font`, so the host's
  unlayered binding wins whatever the source order.

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
