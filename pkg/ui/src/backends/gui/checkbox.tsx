'use client'

/**
 * Checkbox — 16px box, `touch()` to the 44px floor on web and native alike.
 * @hanzogui/checkbox owns the checked/indeterminate state and a11y.
 *
 * Two looks, one control.
 *
 * `plain` is the box every Hanzo surface has drawn: a 16px well with a control
 * edge and an `$ink` tick, never filled. It is what a Checkbox renders when it
 * names nothing else, so no existing caller moves.
 *
 * The record look is twenty-ui's (MIT, NOTICE), asked for by naming any of
 * `variant` (solid | outline | soft), `size` (sm 12px | md 18px box), `shape`
 * (square | round), `color` (accent | success | warning) or `hoverable`, or by a
 * `<Density value="compact">` around it. The box FILLS when checked — the
 * monochrome accent (`--primary`, which an org's accent restates) under its own
 * foreground for the glyph — and `hoverable` (on by default there) widens the
 * hit area by 5px (sm) or 6px (md) round the box with a hover halo, so a row's
 * select column is a 24px target drawn as a 14px box.
 */
import { Checkbox as GuiCheckbox, CheckboxContext, XStack } from '@hanzo/gui'
import { Check, Minus } from '@hanzogui/lucide-icons-2'
import { useContext, type ComponentProps } from 'react'
import { slot } from './slot'
import { touch } from './gesture'
import { useDensity } from './density'

const BOX = 16

export type CheckboxVariant = 'plain' | 'solid' | 'outline' | 'soft'
export type CheckboxSize = 'sm' | 'md'
export type CheckboxShape = 'square' | 'round'
export type CheckboxColor = 'accent' | 'success' | 'warning'

export type CheckboxProps = Omit<ComponentProps<typeof GuiCheckbox>, 'size' | 'color'> & {
  /** `plain` (the default outside a compact density) or the record looks. */
  variant?: CheckboxVariant
  /** The record box: `sm` 12px (the default there) or `md` 18px, plus its edge. */
  size?: CheckboxSize
  shape?: CheckboxShape
  color?: CheckboxColor
  /** The halo round the box that widens the hit area. On by default in the record look. */
  hoverable?: boolean
}

/**
 * The mark: a tick when checked, a dash when indeterminate. `$ink` on the
 * transparent well, as the RadioGroup dot, so it reads on either theme's ground.
 * Stroke 3 of lucide's 24-unit box is 1.6px at 13px.
 */
const Mark = () => {
  const Icon = useContext(CheckboxContext).checked === 'indeterminate' ? Minus : Check
  return <Icon size={BOX - 3} color="$ink" strokeWidth={3} />
}

/** The record box per size: the box, its edge, the glyph drawn over it, and the halo's reach. */
const DIM = {
  sm: { box: 12, edge: 1, glyph: 14, pad: 5 },
  md: { box: 18, edge: 1.5, glyph: 20, pad: 6 },
} as const

/** The unchecked edge per variant (twenty-ui: inverted, secondary-inverted, medium). */
const EDGE: Record<Exclude<CheckboxVariant, 'plain'>, string> = {
  solid: '$ink',
  outline: '$quiet',
  soft: '$borderColor',
}

/** Per colour: the checked fill, the glyph on it, and the halo a checked box takes under the pointer. */
const TONE: Record<CheckboxColor, { fill: string; glyph: string; tint: string }> = {
  accent: { fill: 'var(--primary)', glyph: 'var(--primary-foreground)', tint: '$raised' },
  success: { fill: '$good', glyph: '$background', tint: 'var(--state-success-bg)' },
  warning: { fill: 'var(--state-warning)', glyph: '$background', tint: 'var(--state-warning-bg)' },
}

type Look = {
  dim: (typeof DIM)[CheckboxSize]
  variant: Exclude<CheckboxVariant, 'plain'>
  tone: (typeof TONE)[CheckboxColor]
  round: boolean
  hoverable: boolean
  disabled: boolean
}

/**
 * The visible box, inside the button. It reads the checked state from the
 * control's context, so the fill follows a controlled AND an uncontrolled
 * checkbox; the halo behind it does the same for its hover tint.
 */
const RecordBox = ({ look }: { look: Look }) => {
  const checked = useContext(CheckboxContext).checked
  const on = checked === true || checked === 'indeterminate'
  const Icon = checked === 'indeterminate' ? Minus : Check
  const { dim, tone } = look
  return (
    <>
      {look.hoverable ? (
        <XStack
          {...slot('checkbox-halo')}
          position="absolute"
          inset={0}
          rounded={look.round ? '$10' : '$3'}
          {...(look.disabled ? null : { hoverStyle: { bg: on ? tone.tint : '$hover' } })}
        />
      ) : null}
      <XStack
        {...slot('checkbox-box')}
        position="relative"
        width={dim.box + 2 * dim.edge}
        height={dim.box + 2 * dim.edge}
        rounded={look.round ? '$10' : '$xs'}
        borderWidth={dim.edge}
        borderColor={on ? tone.fill : look.disabled ? '$rim' : EDGE[look.variant]}
        bg={on ? tone.fill : 'transparent'}
        opacity={look.disabled && on ? 0.5 : 1}
        items="center"
        justify="center"
        pointerEvents="none"
      >
        {on ? <Icon size={dim.glyph} color={tone.glyph as never} strokeWidth={2.5} /> : null}
      </XStack>
    </>
  )
}

const Checkbox = ({ variant, size, shape, color, hoverable, ...props }: CheckboxProps) => {
  const compact = useDensity() === 'compact'
  const named = size !== undefined || shape !== undefined || color !== undefined || hoverable !== undefined
  const resolved: CheckboxVariant = variant ?? (compact || named ? 'solid' : 'plain')

  if (resolved !== 'plain') {
    const dim = DIM[size ?? 'sm']
    const halo = hoverable ?? true
    const outer = dim.box + 2 * dim.edge
    const frame = halo ? outer + 2 * dim.pad : outer
    const look: Look = {
      dim,
      variant: resolved,
      tone: TONE[color ?? 'accent'],
      round: shape === 'round',
      hoverable: halo,
      disabled: !!props.disabled,
    }
    return (
      <GuiCheckbox
        {...slot('checkbox')}
        data-variant={resolved}
        data-size={size ?? 'sm'}
        width={frame}
        height={frame}
        flexShrink={0}
        padding={0}
        position="relative"
        items="center"
        justify="center"
        borderWidth={0}
        rounded={shape === 'round' ? '$10' : halo ? '$3' : '$xs'}
        backgroundColor="transparent"
        // The fill is the box's, drawn from context; the button stays a well.
        activeStyle={{ bg: 'transparent' }}
        cursor={props.disabled ? 'not-allowed' : 'pointer'}
        {...touch(frame)}
        {...props}
      >
        <RecordBox look={look} />
      </GuiCheckbox>
    )
  }

  return (
    <GuiCheckbox
      {...slot('checkbox')}
      width={BOX}
      height={BOX}
      flexShrink={0}
      // The frame is a <button>, which the user agent pads 1px 6px: on a 16px
      // border box that leaves a 2px-wide content box and squeezes the 13px mark
      // to 2px. Zero padding gives the mark the whole 14px inside the border.
      padding={0}
      borderRadius="$2"
      borderWidth={1}
      // A CONTROL boundary, not a surface hairline. `$borderColor` is 10% white —
      // right for a card edge sitting on its own fill, and 1.26:1 against the
      // ground, where WCAG 1.4.11 asks 3:1 for the visible boundary of a control.
      // An unchecked box was therefore not quiet, it was absent. `$bound` is
      // 3.45:1. The two jobs shared one token and only one of them was satisfied.
      borderColor="$bound"
      backgroundColor="transparent"
      // gui fills a checked box with `$backgroundActive` unless `activeStyle` is
      // given; the well stays transparent so the `$ink` mark keeps its contrast.
      activeStyle={{ bg: 'transparent' }}
      {...touch(BOX)}
      {...props}
    >
      <GuiCheckbox.Indicator {...slot('checkbox-indicator')} alignItems="center" justifyContent="center">
        <Mark />
      </GuiCheckbox.Indicator>
    </GuiCheckbox>
  )
}

export { Checkbox }
