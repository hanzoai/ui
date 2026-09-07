'use client'

/**
 * DatePicker — a button that opens a calendar in a popover, for picking one
 * date (`mode="single"`, the default) or a range (`mode="range"`), with an
 * optional list of quick presets shown above the calendar.
 *
 * The trigger reads the current pick, or `placeholder` while empty. `selected`
 * and `onSelect` name the value the same way `Calendar` does, since this is a
 * `Calendar` with a trigger and a panel in front of it, not a different
 * contract. Picking a single date closes the popover; a range stays open
 * until both ends are set. `disabled` marks days that cannot be picked, same
 * contract as `Calendar`.
 */
import { SizableText, YStack } from '@hanzo/gui'
import { Calendar as CalendarIcon } from '@hanzogui/lucide-icons-2'
import { useState } from 'react'

import { Button } from './button'
import { Calendar } from './calendar'
import type { CalendarRange } from './calendar'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { slot } from './slot'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const format = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** A quick pick offered above the calendar: `label` shown, `days` from today. */
export interface DatePickerPreset {
  label: string
  days: number
}

interface DatePickerSharedProps {
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
  width?: number
}

export interface DatePickerSingleProps extends DatePickerSharedProps {
  mode?: 'single'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  /** Quick picks (e.g. "Today", "In a week") shown above the calendar. Single mode only. */
  presets?: DatePickerPreset[]
}

export interface DatePickerRangeProps extends DatePickerSharedProps {
  mode: 'range'
  selected?: CalendarRange
  onSelect?: (range: CalendarRange | undefined) => void
  numberOfMonths?: number
}

export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps

export function DatePicker(props: DatePickerProps) {
  const { placeholder = 'Pick a date', disabled, className, width = 280 } = props
  const isRange = props.mode === 'range'

  const [open, setOpen] = useState(false)
  const [ownDate, setOwnDate] = useState<Date | undefined>(
    isRange ? undefined : (props as DatePickerSingleProps).selected,
  )
  const [ownRange, setOwnRange] = useState<CalendarRange | undefined>(
    isRange ? (props as DatePickerRangeProps).selected : undefined,
  )

  const date = !isRange ? ((props as DatePickerSingleProps).selected ?? ownDate) : undefined
  const range = isRange ? ((props as DatePickerRangeProps).selected ?? ownRange) : undefined

  const selectDate = (d: Date | undefined) => {
    setOwnDate(d)
    ;(props as DatePickerSingleProps).onSelect?.(d)
    setOpen(false)
  }
  const selectRange = (r: CalendarRange | undefined) => {
    setOwnRange(r)
    ;(props as DatePickerRangeProps).onSelect?.(r)
  }

  const label = isRange
    ? range?.from
      ? range.to && !sameDay(range.to, range.from)
        ? `${format(range.from)} - ${format(range.to)}`
        : format(range.from)
      : placeholder
    : date
      ? format(date)
      : placeholder

  const empty = isRange ? !range?.from : !date
  const presets = !isRange ? (props as DatePickerSingleProps).presets : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          {...slot('date-picker-trigger')}
          data-empty={empty || undefined}
          variant="outline"
          width={width}
          justify="flex-start"
          className={className}
        >
          <CalendarIcon size={16} />
          {empty ? <SizableText color="$quiet">{label}</SizableText> : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent {...slot('date-picker-content')} width="auto" p={0} align="start">
        {presets && presets.length > 0 && (
          <YStack {...slot('date-picker-presets')} p="$2" borderBottomWidth={1} borderColor="$borderColor">
            <Select
              onValueChange={(value) => {
                const days = Number(value)
                const picked = new Date()
                picked.setDate(picked.getDate() + days)
                selectDate(picked)
              }}
            >
              <SelectTrigger {...slot('date-picker-preset-trigger')}>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {presets.map((preset) => (
                  <SelectItem key={preset.days} value={String(preset.days)}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </YStack>
        )}
        {isRange ? (
          <Calendar
            mode="range"
            selected={range}
            onSelect={selectRange}
            defaultMonth={range?.from}
            numberOfMonths={(props as DatePickerRangeProps).numberOfMonths ?? 2}
            disabled={disabled}
            initialFocus
          />
        ) : (
          <Calendar mode="single" selected={date} onSelect={selectDate} disabled={disabled} initialFocus />
        )}
      </PopoverContent>
    </Popover>
  )
}
