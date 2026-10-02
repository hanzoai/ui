# @hanzo/appearance

The one appearance panel: theme, text size, scale, density, face, width, corners
and accent, stored per person and applied to the whole product.

```tsx
import { Appearance } from '@hanzo/appearance'

<Appearance />
```

Add the boot script to `<head>` so the first paint is already correct — without
it the page paints at the defaults and jumps when JS runs:

```tsx
import { bootScript } from '@hanzo/appearance/state'

<script dangerouslySetInnerHTML={{ __html: bootScript() }} />
```

`<Hanzo>` from `@hanzo/ui` applies the person's choice on mount and hands gui the
theme the document shows. A host that mounts its own gui provider calls
`useAppearance()` once at its root and passes `useScheme()` as `defaultTheme`.

## Knobs, not themes

`@hanzo/design` publishes `--type-scale`, `--type-ratio`, `--density`,
`--radius-scale` and the `--primary` / `--accent` family, and every ramp in
`tokens/*.css` reads them. A preference sets a few numbers and one colour rather
than restating a scale, so rungs added later are covered for free.

An accent is a family: the fill, the ink that reads on it (design's black or
white, whichever contrasts more) and the hover that deepens it, all derived from
the one colour by `vars()`. The theme is a class, `light` / `t_light` or
`dark` / `t_dark`, painted on `<html>` in both vocabularies.

## First paint

`apply()` keeps what it painted under `hanzo.appearance.painted`, and
`bootScript()` replays exactly that before any bundle runs. It computes nothing,
so it cannot fall behind `vars()`. `bootScript({ base })` paints an install
default on a device that has never applied anything.

## Where a choice lives

Four layers, the narrowest that has an opinion winning axis by axis:
`install < org < person (everywhere) < person (this org)`. The person's layers
are kept in IAM (`/v1/iam/preferences`, member `appearance`) and cached on the
device, so a choice made on one Hanzo origin reaches the others.
