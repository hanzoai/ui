'use client'

/**
 * Toaster — the toast viewport, mounted once near the root of an app, and
 * `toast()`, the sonner-shaped call that fills it.
 *
 * gui owns the machinery: `@hanzogui/toast/v2`'s observer (`toast()`), its
 * stack, its swipe and its exit animation. This file draws the toast itself, on
 * the composable API (`Toast` → `Viewport` → `List` with a `renderItem`), in the
 * record kit's shape — twenty-ui's Toast and Toaster (MIT, NOTICE):
 *
 *   · 296 wide on the floating material (`glass(2)`), 8px corners, padding
 *     8 8 4, 8px between toasts, at the bottom-right 12px in; on a phone (≤768)
 *     the full width at the top with square corners.
 *   · A header row: the status icon (16), the message (12px, quiet, medium),
 *     then a "Cancel" text button and a 24px close button pushed right.
 *   · The description under it at 12px, soft, indented 24 to clear the icon.
 *   · An action as a footer: a hairline, then the button at the end.
 *   · The COUNTDOWN as a fill behind the whole toast in its status's tint,
 *     draining linearly over the toast's duration (6s unless told) and PAUSED
 *     while the pointer is over the toast or focus is inside it. A
 *     `data: { progress }` (0–100) replaces the countdown with a progress fill,
 *     and such a toast stays until it is dismissed or updated.
 *   · At most three at once: a fourth closes the oldest.
 *
 * The timer is OURS, not gui's. gui's pauses only while the whole viewport is
 * hovered and restarts from the full duration when it resumes, so a fill drawn
 * over it would empty before the toast went. Each item hands gui a copy of its
 * toast with an infinite duration and runs the one clock both the fill and the
 * dismissal read.
 *
 * `toast()` keeps its signature. Status is its type — `toast()` neutral,
 * `toast.info|success|warning|error()`; `id` is the dedupe key (a second toast
 * with a visible one's id updates it rather than adding one); `cancel`,
 * `action`, `description`, `duration`, `icon`, `onDismiss`, `onAutoClose` as in
 * sonner. `className`, `style`, `richColors` and the per-part `classNames` stay
 * accepted and inert.
 */
import { SizableText, View, XStack, YStack, useMedia, type GuiElement } from '@hanzo/gui'
import { Info, SquareCheck, TriangleAlert, X } from '@hanzogui/lucide-icons-2'
import {
  Toast,
  toast,
  useToasts,
  type ExternalToast,
  type ToasterProps as GuiToasterProps,
  type ToastT,
} from '@hanzogui/toast/v2'
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { glass } from '../../glass'
import { Button } from './button'
import { paint, type FeedbackStatus } from './feedback'
import { slot } from './slot'

/** Sonner's per-part class hooks. Inert — see the note above. */
export type ToasterClassNames = Partial<
  Record<
    | 'toast'
    | 'title'
    | 'description'
    | 'icon'
    | 'actionButton'
    | 'cancelButton'
    | 'closeButton',
    string
  >
>

export interface ToasterProps extends Omit<GuiToasterProps, 'toastOptions'> {
  /** Inert. gui themes the viewport from tokens. */
  className?: string
  /** Inert. gui themes the viewport from tokens. */
  style?: Record<string, string | number>
  /** Inert. Sonner's semantic palette; the status colours are the kit's own. */
  richColors?: boolean
  toastOptions?: ExternalToast & { classNames?: ToasterClassNames }
  /** How many show at once; a further one closes the oldest. Default 3. */
  limit?: number
}

/** A toast's default life, ms. */
export const TOAST_DURATION = 6000
const WIDTH = 296
const GAP = 8
const INSET = 12

const STATUS: Record<string, FeedbackStatus> = {
  default: 'neutral',
  loading: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
}

const ICON: Record<FeedbackStatus, typeof Info> = {
  neutral: TriangleAlert,
  info: Info,
  success: SquareCheck,
  warning: TriangleAlert,
  error: TriangleAlert,
}

const read = (v: ReactNode | (() => ReactNode)) => (typeof v === 'function' ? (v as () => ReactNode)() : v)

/** The progress a toast carries in `data.progress`, 0–100, if it carries one. */
const progressOf = (t: ToastT): number | null => {
  const p = (t.data as { progress?: unknown } | undefined)?.progress
  return typeof p === 'number' && Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : null
}

/** The frame every toast wears: the floating material, 296 wide. */
const frame = (phone: boolean) =>
  ({
    ...glass(2),
    width: phone ? '100%' : WIDTH,
    rounded: phone ? 0 : '$3',
    borderWidth: 0,
    p: 0,
    overflow: 'hidden',
  }) as const

/**
 * The body inside it, padded 8 8 4 and holding the fill. It is the body that
 * hears the pointer and the focus: gui's item does not hand its own hover
 * handlers on (measured — a pointer over the item reached none of them), and
 * the body covers the whole toast.
 */
const body = { position: 'relative', pt: '$2', px: '$2', pb: '$1' } as const

export type ToastFaceProps = {
  /** The toast, as `toast()` made it. */
  t: Pick<ToastT, 'title' | 'description' | 'type' | 'icon' | 'action' | 'cancel' | 'dismissible' | 'data'>
  /** Its life in ms, when it is timed; the countdown drains over it. */
  duration?: number
  /** Whether the countdown is held. */
  paused?: boolean
  /** Close it — the close button, and Cancel or the action after their own handler. */
  onClose?: () => void
}

/**
 * What a toast shows, without the stack around it: the fill, the header, the
 * description and the footer. `Toaster` draws one inside each gui item; the
 * gallery draws one alone so its rules ship in the sheet.
 */
export function ToastFace({ t, duration, paused = false, onClose, onHold }: ToastFaceProps & { onHold?: (held: boolean) => void }) {
  const status = STATUS[t.type ?? 'default'] ?? 'neutral'
  const p = paint(status)
  const Icon = ICON[status]
  const progress = progressOf(t as ToastT)
  const title = read(t.title)
  const description = t.description ? read(t.description) : null
  return (
    <YStack
      {...slot('toast-body')}
      {...body}
      {...(onHold
        ? {
            onHoverIn: () => onHold(true),
            onHoverOut: () => onHold(false),
            onFocus: () => onHold(true),
            onBlur: () => onHold(false),
          }
        : null)}
    >
      {progress !== null ? (
        <View
          {...slot('toast-progress')}
          position="absolute"
          t={0}
          l={0}
          b={0}
          bg={p.tint as never}
          style={{ width: `${progress}%`, transition: 'width 300ms linear' }}
          pointerEvents="none"
        />
      ) : duration !== undefined ? (
        <View
          {...slot('toast-countdown')}
          data-motion="drain"
          data-paused={paused ? '' : undefined}
          position="absolute"
          t={0}
          l={0}
          r={0}
          b={0}
          bg={p.tint as never}
          pointerEvents="none"
          style={{ ['--drain' as string]: `${duration}ms` }}
        />
      ) : null}
      <XStack {...slot('toast-header')} items="center" gap="$2" mb="$1" minH={24}>
        <View shrink={0} width={16} height={16} items="center" justify="center">
          {t.icon ?? <Icon size={16} color={p.ink as never} aria-label={status} />}
        </View>
        <SizableText {...slot('toast-message')} flex={1} size="$1" fontWeight="500" color="$quiet" numberOfLines={2}>
          {title}
        </SizableText>
        {t.cancel ? (
          <Button
            {...slot('toast-cancel')}
            size="xs"
            variant="ghost"
            fontWeight="400"
            onPress={(e: unknown) => {
              t.cancel?.onClick?.(e as never)
              onClose?.()
            }}
          >
            {t.cancel.label || 'Cancel'}
          </Button>
        ) : null}
        {t.dismissible === false ? null : (
          <Button {...slot('toast-close')} size="icon-xs" variant="ghost" emphasis="subtle" aria-label="Close" onPress={onClose}>
            <X />
          </Button>
        )}
      </XStack>
      {description ? (
        <SizableText {...slot('toast-description')} size="$1" color="$soft" pl={24} maxW={224} numberOfLines={1} mb="$1">
          {description}
        </SizableText>
      ) : null}
      {t.action ? (
        <YStack {...slot('toast-footer')} mt="$2" borderTopWidth={1} borderColor="$borderColor" pt="$1" items="flex-end">
          <Button
            size="xs"
            variant="ghost"
            onPress={(e: unknown) => {
              t.action?.onClick?.(e as never)
              if (!(e as { defaultPrevented?: boolean } | undefined)?.defaultPrevented) onClose?.()
            }}
          >
            {t.action.label}
          </Button>
        </YStack>
      ) : null}
    </YStack>
  )
}

/** A toast at rest, outside any stack — the gallery's, and a docs page's. */
export function ToastCard({ phone = false, ...props }: ToastFaceProps & { phone?: boolean }) {
  return (
    <YStack {...slot('toast')} position="relative" {...frame(phone)}>
      <ToastFace {...props} />
    </YStack>
  )
}

function ToastItem({
  t,
  index,
  fallback,
  phone,
}: {
  t: ToastT
  index: number
  fallback: number
  phone: boolean
}) {
  const progress = progressOf(t)
  const duration = t.duration ?? fallback
  const timed = progress === null && t.type !== 'loading' && Number.isFinite(duration) && duration > 0
  const [paused, setPaused] = useState(false)
  const remaining = useRef(duration)
  const done = useRef(false)

  // The one clock: the fill drains on it and the toast closes on it. Once:
  // the dismissal re-renders the item with a new toast object, and the clock
  // must not start over on it.
  useEffect(() => {
    if (!timed || paused || done.current) return
    const start = Date.now()
    const id = setTimeout(() => {
      done.current = true
      t.onAutoClose?.(t)
      toast.dismiss(t.id)
    }, remaining.current)
    return () => {
      clearTimeout(id)
      remaining.current = Math.max(0, remaining.current - (Date.now() - start))
    }
  }, [timed, paused, t])

  // gui sees an untimed toast, so its own clock never fires (see the header).
  const held = useMemo(() => ({ ...t, duration: Number.POSITIVE_INFINITY }), [t])
  const close = () => {
    t.onDismiss?.(t)
    toast.dismiss(t.id)
  }

  return (
    <Toast.Item
      toast={held}
      index={index}
      {...frame(phone)}
      data-status={STATUS[t.type ?? 'default'] ?? 'neutral'}
    >
      <ToastFace t={t} duration={timed ? duration : undefined} paused={paused} onClose={close} onHold={setPaused} />
    </Toast.Item>
  )
}

/** Closes the oldest once more than `limit` are on screen. */
function Limit({ limit }: { limit: number }) {
  const { toasts } = useToasts()
  const live = toasts.filter((t) => !t.delete)
  useEffect(() => {
    // Newest first: the ones past the limit are the oldest.
    for (const t of live.slice(limit)) toast.dismiss(t.id)
  }, [live, limit])
  return null
}

const Toaster = /* @__PURE__ */ forwardRef<GuiElement, ToasterProps>(function Toaster(props, ref) {
  const {
    theme = 'system',
    toastOptions,
    richColors: _richColors,
    className: _className,
    style: _style,
    position,
    offset,
    gap,
    limit = 3,
    duration,
    containerAriaLabel = 'Notifications',
    hotkey,
    ...rest
  } = props
  const media = useMedia()
  const phone = !!(media as Record<string, boolean>)['max-md']
  const fallback = toastOptions?.duration ?? duration ?? TOAST_DURATION
  return (
    <Toast
      {...rest}
      theme={theme}
      position={position ?? (phone ? 'top-center' : 'bottom-right')}
      gap={gap ?? GAP}
      visibleToasts={limit}
      duration={Number.POSITIVE_INFINITY}
    >
      <Toast.Viewport
        ref={ref}
        {...slot('toaster')}
        offset={offset ?? (phone ? 0 : INSET)}
        hotkey={hotkey}
        label={containerAriaLabel}
        {...(phone ? { width: '100%' } : null)}
      >
        <Limit limit={limit} />
        <Toast.List
          renderItem={({ toast: t, index }) => <ToastItem key={t.id} t={t} index={index} fallback={fallback} phone={phone} />}
        />
      </Toast.Viewport>
    </Toast>
  )
})

export { Toaster, toast }
