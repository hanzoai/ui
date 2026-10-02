# @hanzo/composer

The lit ring around anything you can type into, as @hanzo/gui components. The
same material on hanzo.ai, hanzo.chat and hanzo.app.

```bash
pnpm add @hanzo/composer
```

```tsx
import { Composer, Control, Field } from '@hanzo/composer'

<Composer render="form" onSubmit={send} width="100%" maxW={576} mx="auto">
  <XStack items="center" gap="$1.5" p="$1" rounded="$10">{/* your panel */}
    <Field value={draft} onChangeText={setDraft} placeholder="Ask anything" />
    <Control asChild>
      <Voice voice={voice} />
    </Control>
    <Control type="submit" aria-label="Send" fill>
      <ArrowUp size={15} />
    </Control>
  </XStack>
</Composer>
```

The host wraps the surface's own panel. This package owns the ring, the halo,
the round controls and the field's reset; it owns nothing about what typing
does. A host writes no CSS against it: every paint is a gui prop reading a
@hanzo/design token.

## Composer

| prop | | |
|---|---|---|
| `band` | `1.5` | The ring's width, px. Also the host's padding: one number, read twice. |
| `halo` | `6` | How far the halo reaches past the box, px. |
| `control` | `34` | The round controls' box, px, before `--density`. |

Any gui View prop rides along (`render`, `width`, `maxW`, `mx`, …). The corner is
`--radius-composer`, with the pill as the floor. The ring rests at `.5` and lifts
to `.8` under a pointer; focus keeps the rest value, because the caret already
says where focus is. The halo holds still at `.22`, blurred 16px.

## Control

A circle at the size its `Composer` names, scaled by `--density` and floored at
24px (WCAG 2.5.8 AA). `size` names its own box outside a composer. `fill` is the
send: `--primary` on `--primary-foreground`. At rest it is `--muted` on
`--text-secondary`, and it lifts to `--primary` under a pointer. A control another
package draws wears the shape through `asChild`.

## Field

A gui `Input` with its chrome off: no border, surface, native appearance or
outline, on `--text-base`, taking the row's spare width down to zero so a long
prompt never pushes the controls out of the pill. Any Input prop overrides.

## What it obeys

Reads `--radius-composer`, `--density`, `--text-base`, `--muted`,
`--text-secondary`, `--primary`, `--primary-foreground`, `--foreground` and
`--muted-foreground` from [@hanzo/design], each with a fallback.

The sweep is the one stylesheet: a conic angle animates only through `@property`
and `@keyframes`. It is hoisted once through React's `<style>`, keyed on the
`data-slot`s `prism`, `prism-ring` and `prism-halo`, never a class. Four media
queries answer there: `prefers-reduced-motion` holds the sweep still,
`prefers-reduced-transparency` drops the halo and solidifies the ring,
`prefers-contrast: more` turns the ring into a flat white edge, and
`forced-colors: active` removes both layers for a system-coloured outline.

[@hanzo/design]: https://www.npmjs.com/package/@hanzo/design
