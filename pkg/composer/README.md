# @hanzo/composer

The lit ring around anything you can type into — the same material on hanzo.ai,
hanzo.chat and hanzo.app.

```bash
pnpm add @hanzo/composer
```

```ts
import '@hanzo/composer/composer.css'
```

```html
<form class="hz-composer">
  <div><!-- your panel: field, controls, whatever this surface needs --></div>
</form>
```

The host wraps the surface's own panel. This package owns the ring, the halo and
the round controls; it owns nothing about what typing does — submitting is a
navigation on one surface, a stream on another, and an edit on a third.

## Tuning

Every number is a custom property whose fallback is the published value, so
setting none is the same as setting all of them to what they already are.

| | |
|---|---|
| `--hz-composer-radius` | `9999px`. A surface with a paragraph field overrides to a box radius; the halo stays concentric either way. |
| `--hz-composer-band` | `1px`. The host's padding and the ring's width — one property, read twice. |
| `--hz-composer-halo` · `--hz-composer-blur` | `5px` · `14px`. |
| `--hz-composer-rest` · `--hz-composer-lift` | `.5` → `.8`. The ring at rest and under attention. |
| `--hz-composer-glow` · `--hz-composer-glow-lift` | `.1` → `.16`. The halo, same pair. |
| `--hz-composer-spin` | `10s`. |
| `--hz-composer-control` | `30px`. The round controls' base box, before density. |
| `--hz-composer-edge` | The flat colour the ring becomes under `prefers-contrast`. |
| `--hz-spectrum` | The conic stops. Two alphas of white, closing on the stop they opened with. |

```css
/* a paragraph composer with its controls in a row underneath */
.my-composer {
  --hz-composer-radius: 1.5rem;
  --hz-composer-control: 36px;
}
```

## What it obeys

Reads `--density` and `--text-base` from [@hanzo/design], so a person's
appearance preference retunes the composer with the rest of the product. Both
carry fallbacks; the sheet stands alone.

Round controls are floored at 24px (WCAG 2.5.8 AA) so no density can shrink a
target under it. The 44px coarse-pointer floor deliberately does not apply: the
tap target in a composer is the field, which is the width of the column, and
these are its secondary chrome — stretching them makes a single line three lines
tall on a phone.

Four media queries answer for themselves: `prefers-reduced-motion` holds the
sweep still, `prefers-reduced-transparency` drops the halo and solidifies the
ring, `prefers-contrast: more` turns the ring into a flat edge, and
`forced-colors: active` removes both decorative layers for a system-coloured
border — a masked gradient survives a forced palette as a grey smear.

## Why a package of its own

Not a subpath of `@hanzo/ui`: hanzo.chat pins that library below 8.0.52 for an
unrelated jsdom reason, so a subpath would be unreachable for one of the three
surfaces this exists to keep identical. It also carries no dependency and no
React peer, which is what lets it load in a browser extension and an embedded
preview on the same terms.

[@hanzo/design]: https://www.npmjs.com/package/@hanzo/design
