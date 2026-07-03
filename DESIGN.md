# Hanzo Design System — Canonical Tokens

`@hanzo/ui` is the single source of truth for the shared Hanzo product look across
the **Tailwind** apps (hanzo.chat, hanzo.app, hanzo console, commerce, hanzo-desktop).
Change a value here; apps converge on it. This file is that source of truth for the
three things that must read as **one product**: typography, the sidebar/panel system,
and the dark-black palette.

> Two design systems, do not confuse them: **`@hanzo/ui`** = shadcn/ui + Tailwind +
> Radix (this repo). **`@hanzo/gui`** = the Tamagui/RN system (hanzo console). They
> share these *token values* (fonts, dark palette, the sidebar glyph), not code.

---

## 1. Typography — Basel Grotesk + Geist Mono

| Role | Family | Notes |
|------|--------|-------|
| UI / body / display / heading (`sans`) | **Basel Grotesk** | Self-hosted. Book = weight **400**, Medium = weight **500**. |
| code / data / mono (`mono`) | **Geist Mono** | `next/font/google` (`Geist_Mono`) or the geist CDN. |
| Arabic / Hebrew (`--font-ar` / `--font-he`) | unchanged | i18n only — keep. |

**Dropped as defaults:** Geist Sans, DM Sans, Figtree, Inter, PT Sans, Roboto Mono.

Basel is a **licensed, non-Google** face — **self-host** the woff2/woff, do NOT use
`next/font/google` for it. Canonical files (mirror lux.exchange):
`Basel-Grotesk-Book.woff2/.woff` (400), `Basel-Grotesk-Medium.woff2/.woff` (500).

`@font-face` (weights 400/500, `font-display: swap`, `font-style: normal`):

```css
@font-face {
  font-family: 'Basel';
  font-style: normal;
  font-weight: 400; /* Book; 500 = Medium */
  font-display: swap;
  src: url('.../Basel-Grotesk-Book.woff2') format('woff2'),
       url('.../Basel-Grotesk-Book.woff') format('woff');
}
```

Per-app adoption (converge the value, keep each app's own mechanism):
- **@hanzo/ui / Next apps** → `next/font/local` for Basel (`--font-basel-sans`) +
  `next/font/google` `Geist_Mono` (`--font-geist-mono`). See `app/lib/fonts.ts`;
  tailwind `sans → var(--font-basel-sans)`, `mono → var(--font-geist-mono)`.
- **Vite + Tailwind apps** (chat, launcher, desktop) → self-host Basel `@font-face`
  + geist-mono CDN import; tailwind `fontFamily.sans = ['Basel', …]`,
  `mono = ['Geist Mono', …]`.
- **Tamagui (console)** → Basel `@font-face` in globals + override the Tamagui
  `body`/`heading` font `family` to Basel; Geist Mono for `code`/`pre`.

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
