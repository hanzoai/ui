'use client'

/**
 * Switch — a 36×20 pill, 16px thumb, `touch()` to the 44px floor everywhere.
 *
 * `minHeight` is NOT redundant beside `height`, and omitting it was the bug.
 * gui's own `size` variant returns `{ height, minHeight, width }` for the
 * default `$true` size, and setting `height` here overrode only two of the
 * three — min-height beats height, always — so the 29px floor survived and
 * every switch in every app rendered 36×29 instead of 36×20. At that ratio the
 * browser clamps `borderRadius: 1000` to 10px, so it was not even a pill: a
 * rounded rectangle with a small dot adrift inside it.
 *
 * State is carried by COLOUR, not by the thumb's 14px of travel alone. gui's
 * default checked treatment is `$backgroundActive`, which in this theme resolves
 * to the same value the unchecked track already has — measured live, on and off
 * were pixel-identical apart from that translation. A state expressed only as
 * position is one a screenshot, a narrow column and a low-vision reader all fail
 * to read. `activeStyle` is the hook gui honours for exactly this: it is pulled
 * out of props before Tamagui can mistake it for the press pseudo-style, and it
 * REPLACES `$backgroundActive` rather than layering over it.
 *
 * The white is spent on ON and nowhere else. A resting page is mostly switches
 * that are off, and a near-white thumb on every one of them is a field of lights
 * with no signal in it — which is what a full page of these actually looked
 * like. Off is muted, on is filled, and the loudest treatment is the one that
 * means something.
 *
 * THE THUMB TAKES THE SAME TOKEN AS ITS TRACK, and that is not a copy-paste
 * slip. gui wraps the thumb in a `t_SwitchThumb` sub-theme that INVERTS the
 * whole ramp — measured live, `$color3` is rgb(26,26,26) at the frame and
 * rgb(171,171,171) inside the thumb; `$color12` is rgb(250,250,250) and
 * rgb(10,10,10). So naming one token paints both sides of the pair and the
 * contrast is structural: the thumb cannot come out the same colour as the
 * track it sits on, in either state, whatever the palette does later.
 *
 * Picking the tokens by eye instead shipped once, in 8.0.57-8.0.59, and it
 * shipped INVISIBLE: `$color10` under the thumb resolved to the off track's own
 * rgb(26,26,26) and `$color1` to the on track's rgb(255,255,255). The tests
 * passed, because they asked whether the two states DIFFER from each other and
 * never whether either one differs from the thing behind it.
 *
 * THE SEMANTIC ALIASES DO NOT WORK HERE, and this is the only component where
 * that is true. `$panel`, `$ink` and the rest are declared on the two ROOT
 * themes, so each resolves to one value wherever it is read. The ramp does not:
 * `t_SwitchThumb` INVERTS it, which is the entire mechanism above. Migrating
 * this file was measured — both thumbs came out the same colour as the track
 * behind them, off and on, exactly as 8.0.57 did. A flat name cannot say "and
 * the opposite of that, one level down", so this file names rungs on purpose.
 *
 * THREE SIZES, and the record two are the source kit's (MIT, NOTICE): `md` a 32×20
 * pill with a 16px thumb, `sm` 24×16 with a 12px thumb, each with no edge and
 * the thumb 2px in. `default` stays the 36×20 pill with its hairline; under
 * `<Density value="compact">` a switch that names no size is `md`. The tokens do
 * not change with the size — the inverting thumb works on every one.
 */
import { Switch as GuiSwitch } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'
import { useDensity } from './density'

export type SwitchSize = 'default' | 'md' | 'sm'

/** Each size's track, thumb and edge. The edge is what keeps the UA's button border off. */
const SIZE: Record<SwitchSize, { w: number; h: number; thumb: number; edge: number }> = {
  default: { w: 36, h: 20, thumb: 16, edge: 1 },
  md: { w: 32, h: 20, thumb: 16, edge: 0 },
  sm: { w: 24, h: 16, thumb: 12, edge: 0 },
}

export type SwitchProps = Omit<ComponentProps<typeof GuiSwitch>, 'size'> & {
  /** `default` 36×20; `md` 32×20 and `sm` 24×16, the record pair. Unset, the nearest `<Density>` decides. */
  size?: SwitchSize
}

const Switch = ({ disabled, size, ...props }: SwitchProps) => {
  const compact = useDensity() === 'compact'
  const box = SIZE[size ?? (compact ? 'md' : 'default')]
  return (
  <GuiSwitch
    {...slot('switch')}
    data-size={size ?? (compact ? 'md' : 'default')}
    width={box.w}
    height={box.h}
    minHeight={box.h}
    padding={2}
    flexShrink={0}
    backgroundColor="$color3"
    // Without an explicit border the UA's 2px outset button border shows; the
    // record sizes draw none and say so with a zero.
    borderWidth={box.edge}
    borderColor="$borderColor"
    activeStyle={{ backgroundColor: '$color12', borderColor: '$color12' }}
    // Stated rather than left to a `disabledStyle` this backend uses nowhere
    // else: a control that ignores its own disabled prop looks identical to a
    // live one, and the page this was found on had a disabled switch sitting
    // beside eight enabled ones with nothing to tell them apart.
    disabled={disabled}
    opacity={disabled ? 0.5 : 1}
    cursor={disabled ? 'not-allowed' : 'pointer'}
    {...touch(box.h, 44, 'y')}
    {...props}
  >
    <GuiSwitch.Thumb
      {...slot('switch-thumb')}
      width={box.thumb}
      height={box.thumb}
      backgroundColor="$color3"
      // `bg`, and it is the only one of the three spellings that is both typed
      // and correct. The Thumb's activeStyle is typed as the SHORTHAND style set:
      // `backgroundColor` paints but is not in that type; `background` is in it
      // and compiles to a SEPARATE `_background-` class that races the base
      // `_bg-` one on load order rather than replacing it; `bg` replaces it.
      // Consumers build with ignoreBuildErrors, so the first would have shipped
      // an error nobody sees and the second a colour that lands or does not
      // depending on stylesheet order.
      activeStyle={{ bg: '$color12' }}
    />
  </GuiSwitch>
  )
}

export { Switch }
