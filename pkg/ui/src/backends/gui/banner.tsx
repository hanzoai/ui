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
 */
import { Children, isValidElement, type ComponentProps } from 'react'
import { SizableText, YStack, createStyledContext, styled } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import { slot } from './slot'
import { touch } from './gesture'
import { Button } from './button'

export type BannerVariant = 'default' | 'info' | 'success' | 'warning' | 'error'

const ICON = 16
const ICON_GUTTER = 28
const CLOSE = 24

const BannerContext = /* @__PURE__ */ createStyledContext<{ variant: BannerVariant }>({
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
  l: '$4',
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

export type BannerProps = Omit<ComponentProps<typeof BannerFrame>, 'variant'> & {
  variant?: BannerVariant | null
  onClose?: () => void
}

export function Banner({ variant = 'default', onClose, children, ...props }: BannerProps) {
  const resolved = variant ?? 'default'
  const items = Children.toArray(children)
  const head = items[0]
  const icon = isValidElement(head) ? head : null
  const body = icon ? items.slice(1) : items

  return (
    <BannerFrame role="alert" variant={resolved} {...slot('banner')} data-variant={resolved} {...props}>
      {icon ? (
        <IconSlot {...slot('banner-icon')}>
          {icon}
        </IconSlot>
      ) : null}
      <BannerText
        {...slot('banner-message')}
        pl={icon ? ICON_GUTTER : 0}
        pr={onClose ? CLOSE + 12 : 0}
      >
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
          r="$4"
          aria-label="Close"
          onPress={onClose}
        >
          <X size={16} />
        </Button>
      ) : null}
    </BannerFrame>
  )
}
