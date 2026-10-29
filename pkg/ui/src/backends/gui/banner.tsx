'use client'

/**
 * Banner — a full-width strip anchored to an edge of its container: a leading
 * icon, a message, and an optional close button, in one of five variants
 * (`default`, `info`, `success`, `warning`, `error`).
 *
 * The icon is the first child when that child is not itself a string, the same
 * convention `Alert` uses — it sits absolutely at the left edge and the message
 * column indents to clear it. Surface, icon and text are three styled parts
 * sharing one `variant` through a styled context, so a variant reaches all
 * three without any part reading it twice by hand.
 *
 * `onClose` only reports that the close button was pressed. A Banner carries no
 * visibility state of its own; whether the strip stays mounted is the caller's
 * decision.
 *
 * Message and icon paint from the hue's text rungs — step 12 for the message,
 * step 11 for the icon — because step 9 is a fill: on the light theme it reads
 * at 1.2:1 for yellow and about 3:1 for blue and green over the step-2 ground.
 *
 * ── The record kit's banner (Banner and InlineBanner, MIT — NOTICE)
 * Naming a `status`, a `color`, an `emphasis`, a `layout` or an `action` draws
 * the other shape: content centred with a 12px gap, a 40px floor, 8px padding,
 * 13px medium on a 1.5 line, the colour from the one status map (feedback.ts) —
 * `solid` on the colour's fill, `soft` (the default for `inline` and `compact`)
 * on its tint in its ink — and `action` a small outline button that takes its
 * edge from the banner's ink. `layout="inline"` sits inside content (8px
 * corners, 16 below unless `embedded`, the info icon unless one is given) and
 * `layout="compact"` is sized to its content up to 512, ends apart. With none
 * of those props a Banner renders exactly as it always has.
 */
import { Children, createContext, isValidElement, useContext, type ComponentProps, type ReactNode } from 'react'
import { createStyledContext, SizableText, styled, XStack, YStack } from '@hanzo/gui'
import { Info, X } from '@hanzogui/lucide-icons-2'

import { useTranslate } from '../../i18n/react'
import { Button, type ButtonProps } from './button'
import { colorOf, STATUS_PAINT, type FeedbackColor, type FeedbackPaint, type FeedbackStatus } from './feedback'
import { touch } from './gesture'
import { slot } from './slot'

export type BannerVariant = 'default' | 'info' | 'success' | 'warning' | 'error'

const ICON = 16
const ICON_GUTTER = 28
const CLOSE = 24

const BannerContext = /* @__PURE__ */ createStyledContext<{
  variant: BannerVariant
}>({
  variant: 'default',
})

const BannerFrame = styled(YStack, {
  name: 'Banner',
  context: BannerContext,
  position: 'relative',
  width: '100%',
  borderBottomWidth: 1,
  borderColor: '$borderColor',
  bg: '$background',
  px: '$4',
  py: '$3',

  variants: {
    variant: {
      default: {},
      info: { borderColor: '$blue9', bg: '$blue2' },
      success: { borderColor: '$green9', bg: '$green2' },
      warning: { borderColor: '$yellow9', bg: '$yellow2' },
      error: { borderColor: '$red9', bg: '$red2' },
    },
  } as const,

  defaultVariants: { variant: 'default' },
})

const BannerText = styled(SizableText, {
  name: 'BannerText',
  context: BannerContext,
  render: 'div',
  size: '$2',
  color: '$ink',

  variants: {
    variant: {
      default: {},
      info: { color: '$blue12' },
      success: { color: '$green12' },
      warning: { color: '$yellow12' },
      error: { color: '$red12' },
    },
  } as const,
})

// A Text host because a View takes no `color`, and an svg child paints in
// `currentColor`.
const IconSlot = styled(SizableText, {
  name: 'BannerIcon',
  context: BannerContext,
  display: 'flex',
  position: 'absolute',
  t: '$3',
  insetInlineStart: '$4',
  width: ICON,
  height: ICON,
  items: 'center',
  justify: 'center',
  color: '$ink',

  variants: {
    variant: {
      default: {},
      info: { color: '$blue11' },
      success: { color: '$green11' },
      warning: { color: '$yellow11' },
      error: { color: '$red11' },
    },
  } as const,
})

export type BannerProps = Omit<ComponentProps<typeof BannerFrame>, 'variant' | 'color'> & {
  variant?: BannerVariant | null
  onClose?: () => void
  /** What the banner reports; picks its colour through the status map. */
  status?: FeedbackStatus
  /** The colour, when it is not the status's. */
  color?: FeedbackColor
  /** `solid` (the full-width default) or `soft`. */
  emphasis?: 'solid' | 'soft'
  /** `strip` (full width, the default), `inline` (inside content) or `compact` (sized to content). */
  layout?: 'strip' | 'inline' | 'compact'
  /** `inline`: drop the 16px below, for a banner that is the last thing in its box. */
  embedded?: boolean
  /** A trailing control — usually `<BannerAction>`. */
  action?: ReactNode
  /** The leading icon, for the record shape (inline defaults to Info). */
  icon?: ReactNode
}

/** The paint a record-shape banner was drawn with, for its action. */
const PaintContext = /* @__PURE__ */ createContext<{
  paint: FeedbackPaint
  solid: boolean
} | null>(null)

/**
 * A banner's own action: a small outline button whose edge is the banner's ink
 * at 25% and whose hover fills at 10%, so it reads on a solid fill and on a tint
 * alike.
 */
export function BannerAction({ children, ...props }: Omit<ButtonProps, 'variant' | 'size'>) {
  const ctx = useContext(PaintContext)
  const ink = ctx ? (ctx.solid ? ctx.paint.on : ctx.paint.ink) : '$ink'
  const mix = (n: number) => `color-mix(in srgb, ${ink.startsWith('$') ? `var(--${ink.slice(1)})` : ink} ${n}%, transparent)`
  return (
    <Button {...slot('banner-action')} variant="outline" size="xs" bg="transparent" borderColor={mix(25) as never} hoverStyle={{ bg: mix(10) as never }} pressStyle={{ bg: mix(20) as never }} color={ink} {...props}>
      {children}
    </Button>
  )
}

function RecordBanner({ status, color, emphasis, layout = 'strip', embedded = false, action, icon, onClose, children, ...props }: Omit<BannerProps, 'variant'>) {
  const tr = useTranslate()
  const solid = (emphasis ?? (layout === 'strip' ? 'solid' : 'soft')) === 'solid'
  const hue = colorOf(status ?? 'info', color)
  const paint = STATUS_PAINT[hue]
  const ink = solid ? paint.on : hue === 'gray' ? '$ink' : paint.ink
  const lead = icon ?? (layout === 'inline' ? <Info size={16} color={ink as never} /> : null)
  const compact = layout === 'compact'
  const inline = layout === 'inline'
  return (
    <PaintContext.Provider value={{ paint, solid }}>
      <XStack role="alert" {...slot('banner')} data-variant={solid ? 'solid' : 'soft'} data-layout={layout} data-color={hue} width={compact ? 'auto' : '100%'} maxW={compact ? 512 : undefined} minH={compact ? undefined : 40} p="$2" gap={compact ? '$2' : '$3'} items="center" justify={compact ? 'space-between' : inline ? 'flex-start' : 'center'} bg={(solid ? paint.fill : paint.tint) as never} rounded={inline || compact ? '$3' : 0} mb={inline && !embedded ? '$4' : 0} {...props}>
        {lead ? (
          <XStack {...slot('banner-icon')} shrink={0} width={16} height={16} items="center" justify="center">
            {lead}
          </XStack>
        ) : null}
        <SizableText {...slot('banner-message')} render="div" size="$2" lineHeight={20} fontWeight="500" color={ink as never} flex={compact || inline ? 1 : undefined} minW={0}>
          {children}
        </SizableText>
        {action}
        {onClose ? (
          <Button {...slot('banner-close')} variant="ghost" size="icon-xs" color={ink} aria-label={tr('Close')} onPress={onClose}>
            <X color={ink as never} />
          </Button>
        ) : null}
      </XStack>
    </PaintContext.Provider>
  )
}

export function Banner({ variant = 'default', onClose, children, status, color, emphasis, layout, embedded, action, icon: lead, ...props }: BannerProps) {
  const tr = useTranslate()
  const record = [status, color, emphasis, layout, action, lead].some((v) => v !== undefined)
  if (record)
    return (
      <RecordBanner status={status} color={color} emphasis={emphasis} layout={layout} embedded={embedded} action={action} icon={lead} onClose={onClose} {...props}>
        {children}
      </RecordBanner>
    )
  const resolved = variant ?? 'default'
  const items = Children.toArray(children)
  const head = items[0]
  const icon = isValidElement(head) ? head : null
  const body = icon ? items.slice(1) : items

  return (
    <BannerFrame role="alert" variant={resolved} {...slot('banner')} data-variant={resolved} {...props}>
      {icon ? <IconSlot {...slot('banner-icon')}>{icon}</IconSlot> : null}
      <BannerText {...slot('banner-message')} paddingInlineStart={icon ? ICON_GUTTER : 0} paddingInlineEnd={onClose ? CLOSE + 12 : 0}>
        {body}
      </BannerText>
      {onClose ? (
        <Button
          {...slot('banner-close')}
          variant="ghost"
          size="icon"
          minH={CLOSE}
          minW={CLOSE}
          {...touch(CLOSE)}
          // After `touch`, which sets `position: relative` on web to host its
          // hit-area overlay; an absolute box hosts it just as well.
          position="absolute"
          t="$3"
          insetInlineEnd="$4"
          aria-label={tr('Close')}
          onPress={onClose}
        >
          <X size={16} />
        </Button>
      ) : null}
    </BannerFrame>
  )
}
