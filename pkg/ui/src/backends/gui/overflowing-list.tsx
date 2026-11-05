'use client'

/**
 * OverflowingList — one line of chips, tags or avatars: as many as fit, a "+N"
 * for the rest, and every item in a popup.
 *
 * A multi-value cell (tags, emails, links, phones, relations, attendees) has a
 * fixed width and an unbounded list. Wrapping breaks the row height a table
 * depends on, and clipping hides values without saying so. This measures each
 * item at its natural width in an invisible copy of the row, fits as many as
 * the row holds (and no more than `maxInlineCount`), lets the last visible one
 * shrink, and keeps room for the count. Measurement rides `onLayout`, which gui
 * gives on web and native alike, so the same list works on both.
 *
 * The record kit's OverflowingList (MIT, see NOTICE): a 4px gap, a
 * 24px-minimum count on the 12px rung, shown on hover, focus or while open by
 * default; the popup is the package Popover, items wrapping, as wide as the list
 * and at least 220.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Children, isValidElement, useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { press, RING } from './press'
import { slot } from './slot'

const GAP = 4
const COUNT_MIN = 24
const POPUP_MIN = 220

/**
 * How many of `widths` fit in `avail`, keeping room for a count when not all
 * do. At least one shows (it may shrink); never more than `max`.
 */
export function fit(widths: readonly number[], avail: number, max = Infinity, gap = GAP, count = COUNT_MIN): number {
  const n = Math.min(widths.length, max)
  if (n === 0) return 0
  let used = 0
  for (let i = 0; i < n; i++) {
    const next = used + (i > 0 ? gap : 0) + widths[i]
    const rest = i + 1 < widths.length
    if (next + (rest ? gap + count : 0) > avail) return Math.max(1, i)
    used = next
  }
  return n
}

type Layout = { nativeEvent: { layout: { width: number } } }

export type OverflowingListProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  /** The whole ordered list, each with a stable key. */
  children: ReactNode
  /** Never more inline than this, however many would fit. */
  maxInlineCount?: number
  /** `hover`: the count shows on hover, focus or while open. `always` / `never` say themselves. */
  showOverflowCount?: 'hover' | 'always' | 'never'
  /** The count button's accessible name. */
  overflowLabel?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Passed to the popup. */
  popupProps?: Partial<ComponentProps<typeof PopoverContent>>
}

export function OverflowingList({
  children,
  maxInlineCount,
  showOverflowCount = 'hover',
  overflowLabel,
  open,
  defaultOpen = false,
  onOpenChange,
  popupProps,
  ...props
}: OverflowingListProps) {
  const { t } = useI18n()
  const items = useMemo(() => Children.toArray(children).filter(isValidElement), [children])
  const [widths, setWidths] = useState<number[]>([])
  const [avail, setAvail] = useState<number | null>(null)
  const [hot, setHot] = useState(false)
  const [own, setOwn] = useState(defaultOpen)
  const shown = open ?? own
  const setOpen = useCallback(
    (next: boolean) => {
      if (open === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange],
  )

  const measured = avail != null && widths.filter((w) => w != null).length === items.length
  const visible = measured ? fit(widths, avail, maxInlineCount) : Math.min(items.length, maxInlineCount ?? items.length)
  const hidden = items.length - visible
  const countShown = hidden > 0 && (showOverflowCount === 'always' || (showOverflowCount === 'hover' && (hot || shown)))

  const measure = (i: number) => (e: Layout) => {
    const w = e?.nativeEvent?.layout?.width
    if (typeof w !== 'number') return
    setWidths((prev) => {
      if (prev[i] === w) return prev
      const next = prev.slice()
      next[i] = w
      return next
    })
  }

  return (
    <XStack
      {...slot('overflowing-list')}
      position="relative"
      width="100%"
      minW={0}
      items="center"
      gap={GAP}
      overflow="hidden"
      onLayout={(e: Layout) => setAvail(e.nativeEvent.layout.width)}
      onPointerEnter={() => setHot(true)}
      onPointerLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      {...props}
    >
      {/* The measuring copy: every item at its natural width, out of flow and unseen. */}
      <XStack aria-hidden position="absolute" t={0} l={0} opacity={0} pointerEvents="none" gap={GAP} {...({ inert: true } as object)}>
        {items.map((item, i) => (
          <XStack key={item.key ?? i} shrink={0} onLayout={measure(i)}>
            {item}
          </XStack>
        ))}
      </XStack>
      {items.slice(0, visible).map((item, i) => (
        <XStack key={item.key ?? i} {...(i === visible - 1 ? { shrink: 1, minW: 0 } : { shrink: 0 })}>
          {item}
        </XStack>
      ))}
      {hidden > 0 && showOverflowCount !== 'never' ? (
        <Popover open={shown} onOpenChange={setOpen} placement="bottom-start">
          <PopoverTrigger asChild>
            <XStack
              {...slot('overflowing-list-count')}
              {...press(() => setOpen(!shown))}
              aria-label={t('{label} ({n})', { label: overflowLabel ?? t('Show all items'), n: items.length })}
              aria-expanded={shown}
              shrink={0}
              minW={COUNT_MIN}
              height={20}
              px="$1"
              items="center"
              justify="center"
              rounded="$xs"
              cursor="pointer"
              hoverStyle={{ bg: '$hover' }}
              focusVisibleStyle={RING}
              opacity={countShown ? 1 : 0}
            >
              <SizableText size="$1" color="$ink">{`+${hidden}`}</SizableText>
            </XStack>
          </PopoverTrigger>
          {/* As wide as the list it opens from, and never under 220 — a WIDTH, not
              a floor, so the items wrap inside it (measured: a floor let the row
              of every item run 920px wide). The anchor's width is a measured
              number, so it rides an inline style: as a style prop it would mint
              one atomic class per width it ever measured. */}
          <PopoverContent
            p="$2"
            minW={POPUP_MIN}
            style={{ width: Math.max(POPUP_MIN, Math.round(avail ?? 0)) }}
            {...popupProps}
          >
            <YStack {...slot('overflowing-list-popup')} maxH={320} overflow="scroll">
              <XStack flexWrap="wrap" gap={GAP}>
                {items}
              </XStack>
            </YStack>
          </PopoverContent>
        </Popover>
      ) : null}
    </XStack>
  )
}
