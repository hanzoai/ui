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
import { Button as GuiButton, Spinner, styled } from '@hanzo/gui'
import { createElement, isValidElement, type ComponentProps, type ReactNode } from 'react'

import { ink } from './ink'
import { touch } from './gesture'

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

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg'

const HEIGHT: Record<ButtonSize, number> = {
  default: 36,
  sm: 32,
  lg: 40,
  icon: 36,
  'icon-sm': 32,
  'icon-lg': 40,
}

/** Type scale per size — applied to the Text host, which is what renders it. */
const TYPE: Record<ButtonSize, string> = {
  default: '$3',
  sm: '$2',
  lg: '$3',
  icon: '$3',
  'icon-sm': '$2',
  'icon-lg': '$3',
}

/** The spinner's CEILING, paired 1:1 with TYPE above. A ceiling rather than a
 *  size for the reason the height ladder gives: a pin clips, a bound does not.
 *  A spinner stands in for the label, so it may not outgrow the label's line. */
const SPIN: Record<ButtonSize, number> = {
  default: 16,
  sm: 14,
  lg: 16,
  icon: 16,
  'icon-sm': 14,
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
      primary: {
        bg: '$accentBackground',
        color: '$accentColor',
        borderColor: '$rim',
        hoverStyle: { bg: '$rim', borderColor: '$bound' },
      },
      destructive: { bg: '$red9', color: '$white1', hoverStyle: { opacity: 0.9 } },
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
      default: { height: 'auto', minHeight: HEIGHT.default, px: '$4' },
      sm: { height: 'auto', minHeight: HEIGHT.sm, px: '$3', gap: '$1.5' },
      lg: { height: 'auto', minHeight: HEIGHT.lg, px: '$6' },
      icon: { height: 'auto', minHeight: HEIGHT.icon, width: 'auto', minWidth: HEIGHT.icon, px: 0 },
      'icon-sm': { height: 'auto', minHeight: HEIGHT['icon-sm'], width: 'auto', minWidth: HEIGHT['icon-sm'], px: 0 },
      'icon-lg': { height: 'auto', minHeight: HEIGHT['icon-lg'], width: 'auto', minWidth: HEIGHT['icon-lg'], px: 0 },
    },
    disabled: {
      true: { opacity: 0.5, pointerEvents: 'none', cursor: 'default' },
    },
  } as const,

  defaultVariants: { variant: 'default', size: 'default' },
})

/**
 * A stable class handle for hosts that hook buttons from CSS. Styling lives in
 * the tokens; this only names the variant and size.
 */
export const buttonVariants = ({
  variant,
  size,
  className,
}: { variant?: ButtonVariant | null; size?: ButtonSize | null; className?: string } = {}) =>
  // Variant and size share the `btn-` namespace, so the two defaults collide on
  // `btn-default`. A Set emits it once; no name is used by both a variant and a
  // size, so nothing else can merge.
  [...new Set([`btn`, `btn-${variant ?? 'default'}`, `btn-${size ?? 'default'}`, className].filter(Boolean))]
    .join(' ')

export type ButtonProps = Omit<ComponentProps<typeof Frame>, 'variant' | 'size' | 'children'> & {
  variant?: ButtonVariant | null
  size?: ButtonSize | null
  isLoading?: boolean
  children?: ReactNode
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
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const resolved = size ?? 'default'
  // gui's own `asChild` cannot merge into the child here: the Button frame bakes
  // a `render: <button>`, so asChild WRAPS the child in a button and drops every
  // compiled style (measured: `<button class="is_View "><a>…</a></button>`).
  // `render` is the mechanism that merges — it emits the child's own tag carrying
  // the full compiled class list. So asChild is expressed through render, and
  // Button-as-link comes out as a styled <a> with valid markup.
  const host = asChild && isValidElement(children) ? children : null
  const body = host ? (host.props as { children?: ReactNode }).children : children
  return (
    <Frame
      data-slot="button"
      data-variant={variant ?? 'default'}
      data-size={resolved}
      variant={variant ?? 'default'}
      size={resolved}
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
      disabled={disabled || isLoading}
      {...touch(HEIGHT[resolved], 44, 'y')}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {/* Bounded in pixels, not by `size="small"`. gui's Spinner drops that prop
          on web and the indicator then takes its container: measured 300×305,
          which made `<Button isLoading>loading</Button>` render 389×309 — a
          button wider than a phone, and the only element on the whole surface
          that overflowed at 390px. */}
      {isLoading && <Spinner size="small" maxW={SPIN[resolved]} maxH={SPIN[resolved]} />}
      {ink(body, GuiButton.Text as never, { fontSize: TYPE[resolved] })}
    </Frame>
  )
}

export { Button }
