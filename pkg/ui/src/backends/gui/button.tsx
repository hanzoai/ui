'use client'

/**
 * Button — the gui-backend original.
 *
 * `variant`, `size`, `asChild`, `isLoading`, `buttonVariants`, and the
 * `data-slot`/`data-variant`/`data-size` markers.
 *
 * The substrate is @hanzo/gui's Button FRAME (`Button.Frame`), not the compound
 * `Button`. The compound is `Frame.styleable(...)`, i.e. an HOC — `styled()` over
 * it does not compile style props to classes, so under `asChild` every variant
 * style leaked onto the child as an invalid lowercase HTML attribute
 * (`backgroundcolor="var(--background)"`) and nothing was styled. Extending the
 * frame keeps one component with one API and makes `asChild` a first-class
 * pattern; the frame already renders a real `<button>` on web and provides the
 * styled context that `Button.Text` reads.
 *
 * Type size rides on that Text, never on the frame: `fontSize` is not a frame
 * style prop, so setting it there leaked a `font-size="var(--f-size-3)"`
 * attribute and every size rendered at the same 16px.
 *
 * The 44px touch floor comes from `touch()`, which is platform-correct on web
 * as well as native — visual density stays at 36/32/40px.
 */
import { Button as GuiButton, Spinner, XStack, styled } from '@hanzo/gui'
import {
  cloneElement,
  createElement,
  isValidElement,
  useContext,
  type ComponentProps,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react'

import type { Microdata } from './microdata'
import { sx } from '../../sx'
import { ink } from './ink'
import { touch } from './gesture'
import { useDensity } from './density'
import { ButtonGroupContext } from './button-group'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link'
  | 'primary'
  | 'linkFG'
  | 'linkMuted'

/**
 * The colour a control speaks in, across its variant: twenty-ui's `color` axis
 * (MIT). Named `tone` because `color` is already the label's colour here.
 *
 * `accent` is the monochrome accent — `--primary`, ink by default and an org's
 * colour once it picks one — never a hue of its own. `danger` and `success` are
 * the two state hues design permits.
 */
export type ButtonTone = 'neutral' | 'accent' | 'danger' | 'success'

export type ButtonSize =
  | 'default'
  | 'sm'
  | 'xs'
  | 'lg'
  | 'icon'
  | 'icon-sm'
  | 'icon-xs'
  | 'icon-2xs'
  | 'icon-lg'

/** The floor every size takes under a coarse pointer: a thumb, not a cursor. */
const TOUCH = 44

/**
 * `xs` (24), `icon-xs` (24) and `icon-2xs` (20) are the record density: the
 * quiet buttons a table cell, a chip, a kanban header and a menu row hold
 * (twenty-ui's sm and xs, MIT). They sit beside 13px text, carry a 14px icon and
 * keep the 44px press area under a coarse pointer like every other size.
 */
const HEIGHT: Record<ButtonSize, number> = {
  default: 36,
  sm: 32,
  xs: 24,
  lg: 40,
  icon: 36,
  'icon-sm': 32,
  'icon-xs': 24,
  'icon-2xs': 20,
  'icon-lg': 40,
}

/** Type scale per size — applied to the Text host, which is what renders it. */
const TYPE: Record<ButtonSize, string> = {
  default: '$3',
  sm: '$2',
  xs: '$2',
  lg: '$3',
  icon: '$3',
  'icon-sm': '$2',
  'icon-xs': '$2',
  'icon-2xs': '$1',
  'icon-lg': '$3',
}

/** The icon each size draws a `startIcon`/`endIcon` at, when the icon names no size of its own. */
const GLYPH: Record<ButtonSize, number> = {
  default: 16,
  sm: 14,
  xs: 14,
  lg: 16,
  icon: 16,
  'icon-sm': 16,
  'icon-xs': 14,
  'icon-2xs': 14,
  'icon-lg': 20,
}

/** The spinner's CEILING, paired 1:1 with TYPE above. A ceiling rather than a
 *  size for the reason the height ladder gives: a pin clips, a bound does not.
 *  A spinner stands in for the label, so it may not outgrow the label's line. */
const SPIN: Record<ButtonSize, number> = {
  default: 16,
  sm: 14,
  xs: 12,
  lg: 16,
  icon: 16,
  'icon-sm': 14,
  'icon-xs': 12,
  'icon-2xs': 12,
  'icon-lg': 16,
}

const Frame = styled(GuiButton.Frame, {
  name: 'Button',
  items: 'center',
  justify: 'center',
  gap: '$2',
  shrink: 0,
  rounded: '$3',
  borderWidth: 1,
  borderColor: 'transparent',
  cursor: 'pointer',

  variants: {
    variant: {
      // The unmarked case is QUIET: a control on the surface ladder, hairline
      // border, hover brightens border more than fill. `default` used to be the
      // same value as `primary` (white filled), so every unstyled <Button> in
      // every app shouted — the loudest treatment must be asked for by name.
      default: {
        bg: '$panel',
        color: '$ink',
        borderColor: '$borderColor',
        hoverStyle: { bg: '$hover', borderColor: '$rim' },
      },
      // The strongest control WITHOUT a white slab — the macOS dark pushbutton:
      // an elevated gray fill, white text, hairline. On an otherwise quiet page
      // this IS the loudest thing; a $ink fill read as a glare, not a CTA.
      // …and it is the control the ACCENT rides on. `$accentBackground` defaults
      // to the same raised rung this used to name literally, so nothing moves
      // until an app sets `--primary` — at which point the loud control follows
      // it instead of staying grey. Naming the rung directly is what left the
      // accent knob connected to nothing: the pair was declared in the config,
      // no component asked for it, and setting `--primary` changed zero pixels.
      // Its hover is the ACCENT's hover, for the reason its fill is: `$rim` is
      // a grey off the upstream ramp, so a blue control turned grey under the
      // cursor and the accent lasted only until someone pointed at it.
      primary: {
        bg: '$accentBackground',
        color: '$accentColor',
        borderColor: '$rim',
        hoverStyle: { bg: '$accentHover', borderColor: '$bound' },
      },
      // design's destructive FILL and the label it is cut for, not gui's own red:
      // white on `$red9` was 3.9:1. `--destructive` is a fill under
      // `--destructive-foreground` at 4.6:1 or better in both themes, and its
      // hover deepens rather than fades — design's check-tokens holds both.
      destructive: {
        bg: 'var(--destructive)',
        color: 'var(--destructive-foreground)',
        hoverStyle: { bg: 'var(--destructive-hover)' },
      },
      outline: {
        bg: '$background',
        color: '$ink',
        borderColor: '$borderColor',
        hoverStyle: { bg: '$hover' },
      },
      secondary: { bg: '$edge', color: '$ink', hoverStyle: { opacity: 0.8 } },
      ghost: { bg: 'transparent', color: '$ink', hoverStyle: { bg: '$hover' } },
      link: { bg: 'transparent', color: '$ink', hoverStyle: { textDecorationLine: 'underline' } },
      linkFG: { bg: 'transparent', color: '$ink', hoverStyle: { textDecorationLine: 'underline' } },
      linkMuted: {
        bg: 'transparent',
        color: '$quiet',
        hoverStyle: { color: '$ink', textDecorationLine: 'underline' },
      },
    },
    size: {
      // minHeight, NOT height. A control has to be a predictable size, and it
      // still is: text at this type scale is shorter than the box, so every
      // ordinary Button renders at exactly these numbers. What changes is the
      // failure: a pinned `height` CLIPS anything taller, which is how a 119px
      // thumbnail shipped rendered as a 30px sliver with a green build. A floor
      // cannot clip — the button grows and the mistake is visible immediately
      // instead of silently cropping content.
      //
      // Same for the icon sizes' width: a floor keeps them square without
      // truncating a child that is wider than the box.
      // `height: 'auto'` + `minHeight`, and BOTH halves are load-bearing.
      //
      // minHeight alone is not enough: dropping `height` lets GuiButton.Frame's
      // own size variant supply one (measured: 44px), which re-pins the box and
      // ALSO makes every ordinary button 8px taller. `height: 'auto'` is what
      // turns that off, and minHeight is what keeps the control its designed
      // size once it is off.
      //
      // Together: text is shorter than the floor, so an ordinary Button still
      // measures exactly these numbers. Anything taller GROWS instead of being
      // cropped — a pinned height is how a 119px thumbnail shipped rendered as
      // a 36px sliver with a green build. Both directions are asserted in
      // consumer.spec.ts, because getting one right and the other wrong is
      // exactly what happened on the first attempt.
      //
      // A FINGER IS NOT A POINTER. Under a coarse pointer every size floors at
      // TOUCH, the target a thumb lands on; a mouse keeps the designed sizes.
      default: { height: 'auto', minHeight: HEIGHT.default, px: '$4', $touchable: { minHeight: TOUCH } },
      sm: { height: 'auto', minHeight: HEIGHT.sm, px: '$3', gap: '$1.5', $touchable: { minHeight: TOUCH } },
      xs: { height: 'auto', minHeight: HEIGHT.xs, px: '$2', gap: '$1', $touchable: { minHeight: TOUCH } },
      lg: { height: 'auto', minHeight: HEIGHT.lg, px: '$6', $touchable: { minHeight: TOUCH } },
      icon: { height: 'auto', minHeight: HEIGHT.icon, width: 'auto', minWidth: HEIGHT.icon, px: 0, $touchable: { minHeight: TOUCH, minWidth: TOUCH } },
      'icon-sm': { height: 'auto', minHeight: HEIGHT['icon-sm'], width: 'auto', minWidth: HEIGHT['icon-sm'], px: 0, $touchable: { minHeight: TOUCH, minWidth: TOUCH } },
      'icon-xs': { height: 'auto', minHeight: HEIGHT['icon-xs'], width: 'auto', minWidth: HEIGHT['icon-xs'], px: 0, $touchable: { minHeight: TOUCH, minWidth: TOUCH } },
      'icon-2xs': { height: 'auto', minHeight: HEIGHT['icon-2xs'], width: 'auto', minWidth: HEIGHT['icon-2xs'], px: 0, rounded: '$xs', $touchable: { minHeight: TOUCH, minWidth: TOUCH } },
      'icon-lg': { height: 'auto', minHeight: HEIGHT['icon-lg'], width: 'auto', minWidth: HEIGHT['icon-lg'], px: 0, $touchable: { minHeight: TOUCH, minWidth: TOUCH } },
    },
    // The record density's gutter: 8 beside the label and 4 between an icon and
    // it, on the 32px box `compact` gives a size-less Button. After `size`, so
    // it wins over the 12 `sm` states; passed only when the density chose the
    // size, so a named size — an icon size, whose gutter is its width, above all
    // — keeps its own.
    compact: {
      true: { px: '$2', gap: '$1' },
    },
    // After `variant`, so a tone restates the variant's colours rather than
    // racing them. A function of the variant because the axis means a different
    // pair per shape: the edge and the ink of an outline, the tint of a soft
    // button, the fill of a solid one. `neutral` is the variant as it is.
    tone: (tone: ButtonTone, { props }: { props: Record<string, unknown> }) => {
      const t = TONES[tone as Exclude<ButtonTone, 'neutral'>]
      if (!t) return {}
      switch (props.variant) {
        case 'primary':
          return { bg: t.fill, color: t.fillInk, borderColor: 'transparent', hoverStyle: { bg: t.fillHover, borderColor: 'transparent' } }
        case 'secondary':
          return { bg: t.soft, color: t.ink, hoverStyle: { bg: t.softHover, opacity: 1 } }
        case 'ghost':
          return { color: t.ink, hoverStyle: { bg: t.tint } }
        case 'default':
        case 'outline':
        case undefined:
          return { color: t.ink, borderColor: t.edge, hoverStyle: { bg: t.tint, borderColor: t.edge } }
        default:
          return { color: t.ink }
      }
    },
    // Lifted off the page: the ladder's first rung (the `elevation-1` class the
    // component adds — lit edge and small drop, owned by glass.css) and, on an
    // outline, the page's ground with the stronger edge, so it reads as raised
    // rather than as a hole (twenty-ui's `elevated`). Never `--shadow-sm`: that
    // size ramp is common property and glass.test holds the ladder off it.
    elevated: (on: boolean, { props }: { props: Record<string, unknown> }) =>
      on
        ? {
            // The page's ground, through `--surface-page`. Neither `$background`
            // nor `var(--background)` will do: gui redeclares `--background` on
            // its Button sub-theme, so inside a button both read gui's button grey
            // (rgb(36,36,36) measured). `--surface-page` is declared on :root as
            // `var(--background)` and inherits RESOLVED, so it is the page's.
            ...(props.variant === 'default' || props.variant === 'outline' || props.variant === undefined
              ? { bg: 'var(--surface-page)', borderColor: '$rim' }
              : null),
          }
        : {},
    fullWidth: {
      true: { width: '100%', self: 'stretch' },
    },
    round: {
      true: { rounded: '$10' },
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: 'none', cursor: 'default' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

/** Each tone's pairs: ink and edge for an outline, tint under the pointer, the
 *  soft fill and its hover, the solid fill, its ink and its hover. */
const TONES = {
  accent: {
    ink: 'var(--primary)',
    edge: 'var(--primary)',
    tint: '$hover',
    soft: '$hover',
    softHover: '$raised',
    fill: 'var(--primary)',
    fillInk: 'var(--primary-foreground)',
    fillHover: 'var(--primary-hover)',
  },
  danger: {
    ink: '$bad',
    edge: '$red7',
    tint: 'var(--state-error-bg)',
    soft: 'var(--state-error-bg)',
    softHover: '$red4',
    fill: 'var(--destructive)',
    fillInk: 'var(--destructive-foreground)',
    fillHover: 'var(--destructive-hover)',
  },
  success: {
    ink: '$good',
    edge: '$green7',
    tint: 'var(--state-success-bg)',
    soft: 'var(--state-success-bg)',
    softHover: '$green4',
    fill: '$green9',
    fillInk: '#ffffff',
    fillHover: '$green10',
  },
} as const

/** The ink a tone gives its icons, which read colour from a prop and not from the label's text context. */
const toneInk = (tone: ButtonTone, variant: ButtonVariant): string | undefined => {
  if (tone === 'neutral') return undefined
  return variant === 'primary' ? TONES[tone].fillInk : TONES[tone].ink
}

/**
 * A stable class handle for hosts that hook buttons from CSS. Styling lives in
 * the tokens; this only names the variant and size.
 */
import { buttonVariants } from '../../style'
export { buttonVariants }

export type ButtonProps = Omit<
  ComponentProps<typeof Frame>,
  'variant' | 'size' | 'children' | 'onClick' | 'compact' | 'tone' | 'elevated' | 'fullWidth' | 'round'
> & {
  variant?: ButtonVariant | null
  /**
   * The box. Unset, it follows the nearest `<Density>`: `default` (36) on a
   * regular surface, `sm` (32) with the 8px record gutter on a compact one.
   */
  size?: ButtonSize | null
  isLoading?: boolean
  /** An icon before the label, drawn at the size's glyph (14 at `sm`/`xs`, 16 otherwise) unless it names one. */
  startIcon?: ReactNode
  /** An icon after the label — a chevron on a menu button, an arrow on a link. */
  endIcon?: ReactNode
  /**
   * `subtle` lowers the label to the tertiary rank, `$hint` (design's ink at
   * 55%): the icon button inside a row, a chip or a column header, which is
   * present without asking to be pressed. Not `$quiet`, measured: gui's ramp is
   * not symmetric, and in the light theme `$quiet` is rgb(36,36,36) — the ink by
   * another name. A share of the ink keeps its distance in either scheme.
   */
  emphasis?: 'standard' | 'subtle'
  /** The colour axis across the variant: `accent`, `danger`, `success` (see `ButtonTone`). */
  tone?: ButtonTone
  /**
   * Where the spinner stands while `isLoading`. `start` (the default) puts it
   * before the label; `end` after it; `center` keeps the label's width but hides
   * it, so a button does not change size when it starts working.
   */
  loadingPosition?: 'start' | 'center' | 'end'
  /** Takes the whole width of its row. */
  fullWidth?: boolean
  /** Lifted: the small shadow and, on an outline, the ground fill with the stronger edge. */
  elevated?: boolean
  /** `round` makes an icon size a circle. */
  shape?: 'square' | 'round'
  /**
   * A hint shown under the button after a second's hover or on focus. A string
   * also names an icon-only button for assistive technology when it has no
   * `aria-label`. A disabled button keeps showing it.
   */
  tooltip?: ReactNode
  /**
   * A disabled button that still takes focus: announced as disabled
   * (`aria-disabled`), not pressable, but reachable — so its tooltip can say why.
   */
  focusableWhenDisabled?: boolean
  children?: ReactNode
  /**
   * The DOM click. Frame types this from the cross-platform stack, where the
   * event carries `currentTarget: number | ReactNativeElement` — so a handler
   * written the way every web caller writes it, `(e: React.MouseEvent) => …`,
   * is a type error on a prop that works perfectly.
   *
   * On web the handler IS a DOM handler: props spread onto Frame, which renders
   * a real <button>, and React hands it a MouseEvent. Declaring what actually
   * arrives is the same trade as `title` below, and for the same reason — the
   * alternative is call sites re-declaring the component as `any`, which hides
   * every real error in the file along with this one.
   */
  onClick?: MouseEventHandler<HTMLElement>
  /**
   * The label's colour. It reaches the label through gui's text context, which
   * the Frame's own props do not name, so the value works and the type refused
   * it. Same trade as `title` below.
   */
  color?: string
  /** The label's weight, carried the same way `color` is. */
  fontWeight?: string
  /**
   * The DOM tooltip. Already reached the element -- every unrecognised prop is
   * spread onto Frame, which forwards it -- but the Frame's props come from the
   * cross-platform stack and name no DOM attribute, so passing it did not type.
   * Callers either dropped the tooltip or re-declared the whole component as
   * `any`, and the second hides every real error in the file.
   *
   * Declared here because it is true on web and harmless elsewhere: native
   * ignores an attribute it does not know. Widening the type to match the
   * behaviour beats asking ~60 call sites to work around it.
   */
  title?: string
  /**
   * The DOM button type. Not cosmetic: inside a form the default is "submit",
   * so a control meant to do something else submits the form instead. Callers
   * write type="button" to stop that, and dropping it would be a real bug
   * rather than a lost attribute. Reaches the element the same way title does.
   */
  type?: 'button' | 'submit' | 'reset'
  /**
   * How the button identifies itself to the form it submits.
   *
   * A submitter contributes its own `name`/`value` pair to the form data, which
   * is how one form tells "save" from "save and close" — so dropping these is
   * losing which button was pressed, not losing an attribute. They reach the
   * element the same way `type` does.
   */
  name?: string
  value?: string
} & Microdata

/**
 * A Lucide-style icon element, given the size it is drawn at and the label's
 * colour, each only where it names none of its own. A gui icon reads its colour
 * from a prop, not from the text context the label's colour rides on, so a
 * subtle button's icon would otherwise stay at full ink beside a quiet label.
 */
const glyph = (icon: ReactNode, size: number, color?: string) => {
  if (!isValidElement(icon)) return icon
  const own = icon.props as { size?: unknown; color?: unknown }
  const next = { ...(own.size == null ? { size } : null), ...(color && own.color == null ? { color } : null) }
  return Object.keys(next).length ? cloneElement(icon as ReactElement<Record<string, unknown>>, next) : icon
}

/** The two record sizes whose child IS the icon, so the button draws it at its glyph. */
const SMALL_ICON = new Set<ButtonSize>(['icon-xs', 'icon-2xs'])

/** How long a pointer rests on a button before its tooltip shows (twenty-ui's 1000ms). */
const TOOLTIP_DELAY = 1000

function Button({ tooltip, ...props }: ButtonProps) {
  if (tooltip == null || tooltip === false) return <Pressable {...props} />
  const label = typeof tooltip === 'string' && props['aria-label' as keyof ButtonProps] == null ? { 'aria-label': tooltip } : null
  return (
    <Tooltip delay={TOOLTIP_DELAY} placement="bottom">
      {/* The trigger is a wrapper, not the button: a disabled button takes no
          pointer events, and the tooltip has to show over it all the same. */}
      <TooltipTrigger {...({ 'data-slot': 'button-tooltip' } as object)} display="inline-flex" self="flex-start">
        <Pressable {...props} {...(label as object)} />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function Pressable({
  className,
  variant: own,
  size,
  asChild = false,
  isLoading = false,
  disabled,
  startIcon,
  endIcon,
  emphasis = 'standard',
  tone: ownTone,
  loadingPosition = 'start',
  fullWidth,
  elevated,
  shape,
  focusableWhenDisabled,
  children,
  ...props
}: Omit<ButtonProps, 'tooltip'>) {
  const density = useDensity()
  const group = useContext(ButtonGroupContext)
  const variant: ButtonVariant = own ?? group?.variant ?? 'default'
  const tone: ButtonTone = ownTone ?? group?.tone ?? 'neutral'
  const resolved: ButtonSize = size ?? group?.size ?? (density === 'compact' ? 'sm' : 'default')
  // Only the box the density chose takes its gutter: a named size is a decision.
  const compact = density === 'compact' && size == null && group?.size == null
  const quiet = emphasis === 'subtle' ? { color: '$hint' } : null
  const tint = emphasis === 'subtle' ? '$hint' : toneInk(tone, variant)
  // The record density's label weight: medium, as twenty-ui sets every button.
  const weight = density === 'compact' ? { fontWeight: '500' } : null
  // Disabled but focusable: the frame's `disabled` would take pointer events and
  // focus away, so the state is said in ARIA and the press is refused here.
  const inert = !!disabled && !!focusableWhenDisabled
  const center = isLoading && loadingPosition === 'center'
  const spinner = <Spinner size="small" maxW={SPIN[resolved]} maxH={SPIN[resolved]} />
  // gui's own `asChild` cannot merge into the child here: the Button frame bakes
  // a `render: <button>`, so asChild WRAPS the child in a button and drops every
  // compiled style (measured: `<button class="is_View "><a>…</a></button>`).
  // `render` is the mechanism that merges — it emits the child's own tag carrying
  // the full compiled class list. So asChild is expressed through render, and
  // Button-as-link comes out as a styled <a> with valid markup.
  const host = asChild && isValidElement(children) ? children : null
  const body = host ? (host.props as { children?: ReactNode }).children : children
  // The frame bakes `role: 'button'`. A host with an address is a link, and its
  // own element says so; the role is unset (an explicit undefined overrides the
  // default, as `render` below records) so it cannot say otherwise. A caller's
  // `role` still lands, from the spread after it.
  const link = host != null && (host.props as { href?: unknown }).href != null
  return (
    <Frame
      data-slot="button"
      data-variant={variant}
      data-size={resolved}
      {...(tone !== 'neutral' ? { 'data-tone': tone } : null)}
      variant={variant}
      size={resolved}
      {...(compact ? { compact: true } : null)}
      {...(tone !== 'neutral' ? { tone } : null)}
      {...(elevated ? { elevated: true } : null)}
      {...(fullWidth ? { fullWidth: true } : null)}
      {...(shape === 'round' ? { round: true } : null)}
      // Inside a frame the corners are cut to 1px, concentric with the frame's
      // 4px corner and 2px padding. Before the caller's props, so XGroup's
      // zeroed connecting corners (which arrive in them) still win.
      {...(group?.framed ? { rounded: 1 } : null)}
      {...(center ? { position: 'relative' } : null)}
      // SPREAD, never `render={… : undefined}`. The frame bakes its own
      // `render: <button type="button" />`, and an explicitly passed undefined
      // overrides a default rather than falling back to it — so writing the
      // prop unconditionally erased the element on every button that is not
      // asChild, and they all came out `<div role="button">`. That reads
      // correctly to a screen reader and is invisible to the form: a div is not
      // a submitter, so the click handler still ran while `<form action=…>`
      // never fired. Absent means "keep the frame's"; present means "use mine".
      {...(host
        ? { render: createElement(host.type, { ...(host.props as object), children: undefined }) }
        : null)}
      {...(link ? { role: undefined } : null)}
      disabled={inert ? false : disabled || isLoading}
      {...(inert ? { 'aria-disabled': true, opacity: 0.5, cursor: 'not-allowed' } : null)}
      {...touch(HEIGHT[resolved], 44, 'y')}
      // Class notation is READ here, not forwarded. A caller writing
      // `<Button className="w-full mt-4">` is writing the same notation Box
      // reads, and handing it to the DOM instead would put two tokens on the
      // element with nothing behind them. `sx` converts what it knows and hands
      // back the rest as classes, so `btn`/`btn-link` — which are real rules in
      // our stylesheet — arrive intact.
      {...sx(buttonVariants({ variant, size, className: elevated ? [className, 'elevation-1'].filter(Boolean).join(' ') : className }))}
      // `as object`, because this spread is where two spellings of one prop
      // meet. `title` and `type` above pass through untouched — Frame does not
      // declare them, and a spread carries extra properties without complaint.
      // `onClick` it DOES declare, with the cross-platform event; the one that
      // actually arrives on the rendered <button> is the DOM's. Declared above
      // as what arrives, handed on here as what the frame will forward.
      {...(props as object)}
      // After the caller's, so a press on a disabled-but-focusable button is
      // refused whatever handler it was given.
      {...(inert ? { onPress: undefined, onClick: (e: { preventDefault?: () => void }) => e?.preventDefault?.() } : null)}
    >
      {/* Bounded in pixels, not by `size="small"`. gui's Spinner drops that prop
          on web and the indicator then takes its container: measured 300×305,
          which made `<Button isLoading>loading</Button>` render 389×309 — a
          button wider than a phone, and the only element on the whole surface
          that overflowed at 390px. */}
      {isLoading && loadingPosition === 'start' ? spinner : null}
      {center ? (
        // Centred over the label, which keeps its width but is not painted: the
        // button stays the size it was, and nothing beside it moves.
        <XStack position="absolute" t={0} b={0} l={0} r={0} items="center" justify="center" pointerEvents="none">
          {spinner}
        </XStack>
      ) : null}
      {startIcon ? glyph(startIcon, GLYPH[resolved], tint) : null}
      {ink(SMALL_ICON.has(resolved) ? glyph(body, GLYPH[resolved], tint) : body, GuiButton.Text as never, {
        fontSize: TYPE[resolved],
        ...weight,
        ...quiet,
        ...(center ? { opacity: 0 } : null),
      })}
      {endIcon ? glyph(endIcon, GLYPH[resolved], tint) : null}
      {isLoading && loadingPosition === 'end' ? spinner : null}
    </Frame>
  )
}

export { Button }
