'use client'

/**
 * MiniCalendar — a single compact month, framed, for picking one day.
 *
 * A thin shell around `Calendar` (`mode="single"`, one month, no outside days):
 * the month arithmetic, the day grid, and the keyboard already live there, so
 * this only fixes the shape a small inline picker needs — a 256px bordered
 * frame — and narrows the props to the one date a caller actually gets back.
 * `month`/`onMonthChange` pass straight through for a caller that pages the
 * view without changing the pick.
 */
import { YStack, type YStackProps } from '@hanzo/gui'

import { sx } from '../../sx'
import { Calendar } from './calendar'
import { slot } from './slot'

export interface MiniCalendarProps extends Omit<YStackProps, 'onSelect'> {
  /** The picked day. */
  selected?: Date
  onSelect?: (date: Date) => void
  /** The month shown, controlled. Uncontrolled starts at today's. */
  month?: Date
  onMonthChange?: (month: Date) => void
}

function MiniCalendar({ className, selected, onSelect, month, onMonthChange, ...props }: MiniCalendarProps) {
  return (
    <YStack
      {...slot('mini-calendar')}
      width={256}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$4"
      {...sx(className)}
      {...props}
    >
      <Calendar
        mode="single"
        showOutsideDays={false}
        selected={selected}
        // A pick always hands back a day; re-pressing the selected day is a
        // no-op rather than the full Calendar's clear-on-repeat.
        onSelect={(date) => date && onSelect?.(date)}
        month={month}
        onMonthChange={onMonthChange}
      />
    </YStack>
  )
}

export { MiniCalendar }
