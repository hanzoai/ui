'use client'

/**
 * Calendar — a month grid for picking one date, several dates, or a range.
 *
 * `mode` names the selection: `single` hands back a `Date`, `multiple` a
 * `Date[]`, `range` a `{ from, to }` that each pick grows and a pick on either
 * end shrinks back to that one day; picking the one selected day clears it.
 * A `disabled` predicate says which days cannot be picked. Every day and both
 * month controls are the backend `Button`, so hover, focus and the 44px touch
 * floor are the ones every control has. One day at a time is in the tab order
 * — the selected day, else today, else the first of the month — and from it
 * the arrow keys move a day or a week, Home and End go to the ends of the
 * week, PageUp and PageDown change the month, paging the view whenever the
 * target lies off it. The seven-column week is `Grid`/`Cell`, a real CSS
 * grid, so the columns are the container's and no label can widen its own.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import type { GuiElement } from '@hanzo/gui'
import { ChevronLeft, ChevronRight } from '@hanzogui/lucide-icons-2'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { Cell, Grid } from '../../grid'
import { sx } from '../../sx'
import { Button } from './button'
import { slot } from './slot'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CalendarRange = { from?: Date; to?: Date }

interface CalendarSharedProps {
  /** The month shown, controlled. Uncontrolled starts at `defaultMonth`, else today's. */
  month?: Date
  defaultMonth?: Date
  onMonthChange?: (month: Date) => void
  /** How many consecutive months to lay out. Default 1. */
  numberOfMonths?: number
  /** Fill the first and last week with the neighbouring months' days, dimmed. Default true. */
  showOutsideDays?: boolean
  /** First column of the week: `0` Sunday (default) through `6` Saturday. */
  weekStartsOn?: Weekday
  /** A day this returns true for cannot be picked. */
  disabled?: (date: Date) => boolean
  /** Focus the tab-stop day on mount — a calendar opened inside a popover. */
  initialFocus?: boolean
  className?: string
}

export interface CalendarSingleProps extends CalendarSharedProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
}

export interface CalendarMultipleProps extends CalendarSharedProps {
  mode: 'multiple'
  selected?: Date[]
  onSelect?: (dates: Date[] | undefined) => void
}

export interface CalendarRangeProps extends CalendarSharedProps {
  mode: 'range'
  selected?: CalendarRange
  onSelect?: (range: CalendarRange | undefined) => void
}

export type CalendarProps = CalendarSingleProps | CalendarMultipleProps | CalendarRangeProps

const day = (y: number, m: number, d: number) => new Date(y, m, d)
/** The calendar day as a key, local and free of any time a `selected` carries. */
const key = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
const same = (a?: Date | null, b?: Date | null) => !!a && !!b && key(a) === key(b)
const at = (d: Date) => day(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const shift = (d: Date, days: number) => day(d.getFullYear(), d.getMonth(), d.getDate() + days)
const first = (d: Date, months = 0) => day(d.getFullYear(), d.getMonth() + months, 1)
/** `months` over, on the same day of the month or the last one it has. */
const page = (d: Date, months: number) => {
  const last = day(d.getFullYear(), d.getMonth() + months + 1, 0)
  return day(last.getFullYear(), last.getMonth(), Math.min(d.getDate(), last.getDate()))
}

/** A month's grid in row order, whole weeks; `null` where an outside day is hidden. */
const cells = (m: Date, weekStartsOn: Weekday, outside: boolean): Array<Date | null> => {
  const lead = (m.getDay() - weekStartsOn + 7) % 7
  const total = day(m.getFullYear(), m.getMonth() + 1, 0).getDate()
  return Array.from({ length: Math.ceil((lead + total) / 7) * 7 }, (_, i) => {
    const n = i - lead + 1
    return outside || (n >= 1 && n <= total) ? day(m.getFullYear(), m.getMonth(), n) : null
  })
}

const picked = (props: CalendarProps, d: Date) => {
  if (props.mode === 'multiple') return (props.selected ?? []).some((s) => same(s, d))
  if (props.mode === 'range') {
    const { from, to } = props.selected ?? {}
    return !!from && (to ? at(from) <= at(d) && at(d) <= at(to) : same(from, d))
  }
  return same(props.selected, d)
}

const extend = (r: CalendarRange | undefined, d: Date): CalendarRange | undefined => {
  const { from, to } = r ?? {}
  if (!from) return { from: d, to: d }
  if (!to) return at(d) < at(from) ? { from: d, to: from } : { from, to: d }
  if (same(from, d) && same(to, d)) return undefined
  if (same(from, d)) return { from, to: d }
  if (same(to, d)) return { from: d, to: d }
  return at(d) < at(from) ? { from: d, to } : { from, to: d }
}

const pick = (props: CalendarProps, d: Date) => {
  if (props.mode === 'multiple') {
    const now = props.selected ?? []
    props.onSelect?.(now.some((s) => same(s, d)) ? now.filter((s) => !same(s, d)) : [...now, d])
  } else if (props.mode === 'range') props.onSelect?.(extend(props.selected, d))
  else props.onSelect?.(same(props.selected, d) ? undefined : d)
}

/** Where a key moves focus from `d`, or nothing for a key that does not. */
const step = (k: string, d: Date, weekStartsOn: Weekday): Date | undefined => {
  const dow = (d.getDay() - weekStartsOn + 7) % 7
  return k === 'ArrowLeft' ? shift(d, -1)
    : k === 'ArrowRight' ? shift(d, 1)
    : k === 'ArrowUp' ? shift(d, -7)
    : k === 'ArrowDown' ? shift(d, 7)
    : k === 'Home' ? shift(d, -dow)
    : k === 'End' ? shift(d, 6 - dow)
    : k === 'PageUp' ? page(d, -1)
    : k === 'PageDown' ? page(d, 1)
    : undefined
}

function Calendar(props: CalendarProps) {
  const {
    month: monthProp,
    defaultMonth,
    onMonthChange,
    numberOfMonths = 1,
    weekStartsOn = 0,
    showOutsideDays = true,
    disabled,
    initialFocus,
    className,
  } = props

  const [own, setOwn] = useState(() => first(defaultMonth ?? new Date()))
  const head = monthProp ? first(monthProp) : own
  const months = Array.from({ length: numberOfMonths }, (_, i) => first(head, i))
  const grid = months.map((m) => cells(m, weekStartsOn, showOutsideDays))
  const inside = (d?: Date): d is Date =>
    !!d && at(d) >= at(head) && at(d) < at(first(head, numberOfMonths))
  const shown = (d: Date) => grid.some((g) => g.some((c) => same(c, d)))
  const labels = [...WEEKDAYS.slice(weekStartsOn), ...WEEKDAYS.slice(0, weekStartsOn)]
  const today = new Date()
  const range: CalendarRange = props.mode === 'range' ? (props.selected ?? {}) : {}

  const [focused, setFocused] = useState<Date>()
  const picks =
    props.mode === 'multiple' ? (props.selected ?? [])
    : props.mode === 'range' ? [props.selected?.from]
    : [props.selected]
  const focus =
    focused && shown(focused) ? focused : (picks.find(inside) ?? (inside(today) ? today : head))

  const root = useRef<GuiElement>(null)
  const pending = useRef(!!initialFocus)
  useEffect(() => {
    const node = root.current
    if (!pending.current || typeof HTMLElement === 'undefined' || !(node instanceof HTMLElement)) return
    pending.current = false
    const k = `[data-date="${key(focus)}"]`
    ;(node.querySelector<HTMLElement>(`${k}:not([data-outside])`) ?? node.querySelector<HTMLElement>(k))?.focus()
  })

  const navigate = (n: -1 | 1) => {
    const next = first(head, n)
    setOwn(next)
    onMonthChange?.(next)
  }

  const move = (e: KeyboardEvent<HTMLElement>, from: Date) => {
    const next = step(e.key, from, weekStartsOn)
    if (!next) return
    e.preventDefault()
    pending.current = true
    setFocused(next)
    if (!shown(next)) navigate(at(next) < at(head) ? -1 : 1)
  }

  return (
    <XStack ref={root} {...slot('calendar')} flexWrap="wrap" gap="$4" p="$3" {...sx(className)}>
      {months.map((m, i) => (
        <YStack key={i} {...slot('calendar-month')} gap="$4">
          <XStack {...slot('calendar-caption')} items="center" justify="space-between">
            <YStack width={32}>
              {i === 0 && (
                <Button
                  {...slot('calendar-nav-previous')}
                  aria-label="Previous month"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft size={16} />
                </Button>
              )}
            </YStack>
            <SizableText {...slot('calendar-caption-label')} size="$3" fontWeight="500">
              {MONTHS[m.getMonth()]} {m.getFullYear()}
            </SizableText>
            <YStack width={32} items="flex-end">
              {i === months.length - 1 && (
                <Button
                  {...slot('calendar-nav-next')}
                  aria-label="Next month"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => navigate(1)}
                >
                  <ChevronRight size={16} />
                </Button>
              )}
            </YStack>
          </XStack>

          <Grid columns={7} gap="$1">
            {labels.map((label) => (
              <Cell key={label} style={{ textAlign: 'center' }}>
                <SizableText size="$1" color="$quiet">
                  {label}
                </SizableText>
              </Cell>
            ))}
            {grid[i].map((d, j) => {
              if (!d) return <Cell key={j} />
              const outside = d.getMonth() !== m.getMonth()
              const selected = picked(props, d)
              const start = same(range.from, d)
              const end = same(range.to, d)
              const middle = selected && props.mode === 'range' && !start && !end
              const isToday = same(d, today)
              return (
                <Cell key={j}>
                  <Button
                    {...slot('calendar-day')}
                    data-date={key(d)}
                    data-today={isToday || undefined}
                    data-outside={outside || undefined}
                    data-selected={selected || undefined}
                    data-range-start={start || undefined}
                    data-range-end={end || undefined}
                    data-range-middle={middle || undefined}
                    aria-selected={selected}
                    aria-label={d.toDateString()}
                    variant={selected && !middle ? 'primary' : middle || isToday ? 'secondary' : 'ghost'}
                    size="icon"
                    width="100%"
                    opacity={outside ? 0.5 : 1}
                    disabled={!!disabled?.(d)}
                    tabIndex={same(d, focus) && (!outside || !inside(focus)) ? 0 : -1}
                    onFocus={() => setFocused(d)}
                    onKeyDown={(e: KeyboardEvent<HTMLElement>) => move(e, d)}
                    onClick={() => pick(props, d)}
                  >
                    {d.getDate()}
                  </Button>
                </Cell>
              )
            })}
          </Grid>
        </YStack>
      ))}
    </XStack>
  )
}

export { Calendar }
