'use client'

/**
 * TruncatedText — one line with an ellipsis, or N lines clamped, that shows the
 * whole text in a tooltip only when it was actually cut.
 *
 * Every cell, chip label, navigation item and view name in a record surface is
 * one of these, so the tooltip has to cost nothing when it is not needed: it
 * measures (scroll size past client size) when the pointer enters or focus
 * arrives, and the tooltip opens only if that measurement found an overflow. A
 * text that fits never shows one. `TruncatedTextProvider` lets a host change the
 * rule for a subtree — a table turns it `disabled` while it scrolls or edits, so
 * a thousand cells carry no listeners at all.
 *
 * The record kit's OverflowingTextWithTooltip and its mode provider
 * (MIT, see NOTICE): 500ms delay, bottom placement, a 300px cap on the hint,
 * focusable on request, `alwaysShowTooltip` for a hint that is wanted anyway.
 * The tooltip is this package's own `Tooltip`; its look is the Tooltip's.
 *
 * Anchored, not triggered: a tooltip trigger stamps `aria-expanded` on its
 * child, which a run of text may not carry (axe, aria-allowed-attr), and the
 * hint discloses nothing — it repeats the text. So the text is the tooltip's
 * ANCHOR and this component opens it itself, after the delay, on hover or focus.
 */
import { SizableText, Tooltip as GuiTooltip } from '@hanzo/gui'
import { createContext, useContext, useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Tooltip, TooltipContent } from './tooltip'
import { slot } from './slot'

/**
 * `measure-on-hover` (default): the hint is armed by the last hover or focus
 * that measured an overflow. `measure-on-open`: measured when it tries to open.
 * `disabled`: no tooltip and no listeners.
 */
export type TruncateMode = 'measure-on-hover' | 'measure-on-open' | 'disabled'

const ModeContext = /* @__PURE__ */ createContext<TruncateMode>('measure-on-hover')

export function TruncatedTextProvider({ mode, children }: { mode: TruncateMode; children?: ReactNode }) {
  return <ModeContext.Provider value={mode}>{children}</ModeContext.Provider>
}

/** Whether a rendered node holds more than it shows. False off the web, where there is no node to ask. */
export const overflows = (node: unknown): boolean => {
  const el = node as { scrollWidth?: number; clientWidth?: number; scrollHeight?: number; clientHeight?: number } | null
  if (!el || typeof el.scrollWidth !== 'number') return false
  return el.scrollWidth > (el.clientWidth ?? 0) || (el.scrollHeight ?? 0) > (el.clientHeight ?? 0)
}

export type TruncatedTextProps = Omit<ComponentProps<typeof SizableText>, 'children'> & {
  /** What is shown. A node needs `tooltipContent`, since the hint cannot be read off it. */
  text: ReactNode
  /** Clamp to N lines (wrapping, breaking long words) instead of one line with an ellipsis. */
  lineClamp?: number
  /** The hint, when it should say more or other than `text`. */
  tooltipContent?: ReactNode
  /** Milliseconds before the hint opens. */
  tooltipDelay?: number
  tooltipPlace?: 'top' | 'right' | 'bottom' | 'left'
  /** Keep the hint's line breaks. */
  isTooltipMultiline?: boolean
  /** Show the hint whether or not the text was cut. */
  alwaysShowTooltip?: boolean
  /** A tab stop: focus measures and opens the hint, as a hover does. */
  isFocusable?: boolean
}

const DELAY = 500
const MAX_W = 300

export function TruncatedText({
  text,
  lineClamp,
  tooltipContent,
  tooltipDelay = DELAY,
  tooltipPlace = 'bottom',
  isTooltipMultiline = false,
  alwaysShowTooltip = false,
  isFocusable = false,
  ...props
}: TruncatedTextProps) {
  const mode = useContext(ModeContext)
  const [open, setOpen] = useState(false)
  const [cut, setCut] = useState(false)
  const node = useRef<unknown>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const held = useRef(false)
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const lines = lineClamp && Number.isInteger(lineClamp) && lineClamp > 0 ? lineClamp : 1
  const host = (extra: object) => (
    <SizableText
      {...slot('truncated-text')}
      numberOfLines={lines}
      maxW="100%"
      minW={0}
      {...(lines > 1 ? { style: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } } : null)}
      {...props}
      {...extra}
    >
      {text}
    </SizableText>
  )

  if (mode === 'disabled' && !alwaysShowTooltip) return host({})

  const measure = (target: unknown) => {
    node.current = target
    const over = overflows(target)
    setCut(over)
    return over
  }

  /** Arm the hint: measured now (hover mode) or when it opens (open mode), shown after the delay. */
  const arm = (target: unknown, wait: number) => {
    if (timer.current) clearTimeout(timer.current)
    const now = mode === 'measure-on-hover' ? measure(target) : ((node.current = target), false)
    timer.current = setTimeout(() => {
      const over = mode === 'measure-on-open' ? measure(node.current) : now
      if (alwaysShowTooltip || over) setOpen(true)
    }, wait)
  }
  const disarm = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    if (!held.current) setOpen(false)
  }

  return (
    <Tooltip open={open} onOpenChange={(next) => !next && setOpen(false)} placement={tooltipPlace}>
      <GuiTooltip.Anchor asChild>
        {host({
          onPointerEnter: (e: { currentTarget?: unknown }) => arm(e?.currentTarget, tooltipDelay),
          onPointerLeave: disarm,
          // Focus opens at once; the hint stays while the text holds focus.
          onFocus: (e: { currentTarget?: unknown }) => {
            held.current = true
            arm(e?.currentTarget, 0)
          },
          onBlur: () => {
            held.current = false
            disarm()
          },
          ...(isFocusable ? { tabIndex: 0, focusVisibleStyle: { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } } : null),
          ...(cut ? { cursor: 'pointer' } : null),
        })}
      </GuiTooltip.Anchor>
      <TooltipContent maxW={MAX_W}>
        {isTooltipMultiline && typeof (tooltipContent ?? text) === 'string' ? (
          <SizableText size="$1" style={{ whiteSpace: 'pre-wrap' }}>
            {tooltipContent ?? text}
          </SizableText>
        ) : (
          (tooltipContent ?? text)
        )}
      </TooltipContent>
    </Tooltip>
  )
}
