'use client'

/**
 * MessageDock — a fixed stack of dismissable status cards, anchored to a
 * corner or edge of the viewport (`top`, `bottom`, `top-right`, `bottom-right`).
 *
 * Unlike `Toaster` (a queue driven through an imperative `toast()` call), a
 * dock is fully controlled: the caller owns the `messages` array and decides
 * what survives a close. Each card carries a `type` — `info`, `success`,
 * `warning` or `error` — that tints its border and background the way
 * `Banner`'s variant ladder does; an untyped message renders on the plain
 * surface tokens. `onClose` only reports which id was dismissed, the same
 * contract `Banner.onClose` uses — the dock itself holds no visibility state.
 */
import { XStack, YStack, SizableText, createStyledContext, styled } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'
import { Button } from './button'

export type MessageDockMessageType = 'info' | 'success' | 'warning' | 'error'

export type MessageDockMessage = {
  id: string
  type?: MessageDockMessageType
  title: string
  description?: string
}

export type MessageDockPosition = 'top' | 'bottom' | 'top-right' | 'bottom-right'

const CLOSE = 24
const CARD_MIN_WIDTH = 300

const CardContext = /* @__PURE__ */ createStyledContext<{ type: MessageDockMessageType | 'default' }>({
  type: 'default',
})

const DockFrame = styled(YStack, {
  name: 'MessageDock',
  position: 'fixed',
  gap: '$2',
  z: 50,

  // Named `anchor`, not `position`: gui's own `position` prop is the CSS
  // property (`fixed` above), and a variant sharing that name would fight it —
  // the same reason `dock.tsx` calls its edge variant `edge`.
  variants: {
    anchor: {
      top: { t: '$4', l: '50%', style: { transform: 'translateX(-50%)' } },
      bottom: { b: '$4', l: '50%', style: { transform: 'translateX(-50%)' } },
      'top-right': { t: '$4', r: '$4' },
      'bottom-right': { b: '$4', r: '$4' },
    },
  } as const,

  defaultVariants: { anchor: 'bottom-right' },
})

const CardFrame = styled(YStack, {
  name: 'MessageDockCard',
  context: CardContext,
  position: 'relative',
  minW: CARD_MIN_WIDTH,
  rounded: '$4',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$background',
  p: '$4',
  shadowColor: '$dim',
  shadowRadius: 16,
  shadowOpacity: 0.2,

  variants: {
    type: {
      default: {},
      info: { borderColor: '$blue9', bg: '$blue2' },
      success: { borderColor: '$green9', bg: '$green2' },
      warning: { borderColor: '$yellow9', bg: '$yellow2' },
      error: { borderColor: '$red9', bg: '$red2' },
    },
  } as const,

  defaultVariants: { type: 'default' },
})

const CardTitle = styled(SizableText, {
  name: 'MessageDockCardTitle',
  context: CardContext,
  render: 'h4',
  size: '$3',
  fontWeight: '500',
  color: '$ink',

  variants: {
    type: {
      default: {},
      info: { color: '$blue12' },
      success: { color: '$green12' },
      warning: { color: '$yellow12' },
      error: { color: '$red12' },
    },
  } as const,
})

const CardDescription = styled(SizableText, {
  name: 'MessageDockCardDescription',
  context: CardContext,
  render: 'div',
  size: '$2',
  mt: '$1',
  color: '$quiet',

  variants: {
    type: {
      default: {},
      info: { color: '$blue11' },
      success: { color: '$green11' },
      warning: { color: '$yellow11' },
      error: { color: '$red11' },
    },
  } as const,
})

// `position` is omitted along with `anchor`: DockFrame inherits YStack's own
// `position` (the CSS property — `relative`/`absolute`/`fixed`/…), and
// intersecting that with our differently-typed `position` prop below would
// collapse it to `never` rather than picking either side.
export type MessageDockProps = Omit<ComponentProps<typeof DockFrame>, 'anchor' | 'position' | 'children'> & {
  messages: MessageDockMessage[]
  onClose?: (id: string) => void
  position?: MessageDockPosition | null
}

function MessageDock({ messages, onClose, position = 'bottom-right', ...props }: MessageDockProps) {
  const resolved = position ?? 'bottom-right'
  return (
    <DockFrame {...slot('message-dock')} data-position={resolved} anchor={resolved} {...props}>
      {messages.map((message) => {
        const type = message.type ?? 'default'
        return (
          <CardFrame
            key={message.id}
            {...slot('message-dock-card')}
            data-message-id={message.id}
            data-type={type}
            type={type}
            role="status"
          >
            <XStack items="flex-start" justify="space-between" gap="$4">
              <YStack flex={1} pr={onClose ? CLOSE : 0}>
                <CardTitle type={type} {...slot('message-dock-card-title')}>
                  {ink(message.title)}
                </CardTitle>
                {message.description ? (
                  <CardDescription type={type} {...slot('message-dock-card-description')}>
                    {ink(message.description)}
                  </CardDescription>
                ) : null}
              </YStack>
              {onClose ? (
                <Button
                  {...slot('message-dock-card-close')}
                  variant="ghost"
                  size="icon"
                  minH={CLOSE}
                  minW={CLOSE}
                  {...touch(CLOSE)}
                  position="absolute"
                  t="$3"
                  r="$3"
                  aria-label="Close"
                  onPress={() => onClose(message.id)}
                >
                  <X size={16} />
                </Button>
              ) : null}
            </XStack>
          </CardFrame>
        )
      })}
    </DockFrame>
  )
}

export { MessageDock }
