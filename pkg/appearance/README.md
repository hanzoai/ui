# @hanzo/appearance

The one appearance panel: text size, density and accent, stored per person and
applied to the whole product.

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

## Why three knobs and not a theme

`@hanzo/design` publishes `--type-scale`, `--density` and `--primary`/`--accent`,
and every ramp in `tokens/*.css` multiplies by them. So a preference sets three
numbers rather than restating a scale, and rungs added later are covered for
free. `@hanzo/design`'s own history is the argument: the first version kept a
copy of the type ramp so it could recompute each rung, and the copy had already
drifted two rungs before anyone used it.

Requires `@hanzo/design >= 0.4.11` (the knobs) and `@hanzo/ui >= 8.0.69` (the
`$n` ladder resolving through `var(--text-*)`). On older versions the controls
render and store, and move almost nothing.
