import { useState } from "react"
import { XStack, YStack } from "@hanzo/gui"
import { Calendar } from "@hanzo/ui"
import type { CalendarRange } from "@hanzo/ui"

/** Default — single mode in a bordered frame; one day starts selected and picking it again clears it. */
export function Default() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 15))

  return (
    <YStack self="flex-start" borderWidth={1} borderColor="$borderColor" rounded="$3">
      <Calendar mode="single" selected={date} onSelect={setDate} />
    </YStack>
  )
}

/** Range — each pick grows the range and a pick on either end shrinks it back to that day. */
export function Range() {
  const [range, setRange] = useState<CalendarRange | undefined>({
    from: new Date(2026, 8, 5),
    to: new Date(2026, 8, 12),
  })

  return <Calendar mode="range" selected={range} onSelect={setRange} />
}

/** Multiple — any number of days, each pick toggling its own. */
export function Multiple() {
  const [dates, setDates] = useState<Date[] | undefined>([
    new Date(2026, 8, 3),
    new Date(2026, 8, 10),
  ])

  return <Calendar mode="multiple" selected={dates} onSelect={setDates} />
}

/** Two months — `numberOfMonths` lays consecutive months side by side, the week starting on Monday. */
export function TwoMonths() {
  const [range, setRange] = useState<CalendarRange | undefined>({
    from: new Date(2026, 8, 28),
    to: new Date(2026, 9, 4),
  })

  return <Calendar mode="range" numberOfMonths={2} weekStartsOn={1} selected={range} onSelect={setRange} />
}

/** Disabled — a predicate keeps days outside a window from being picked, as a date-of-birth field needs. */
export function Disabled() {
  const [date, setDate] = useState<Date | undefined>()
  const today = new Date(2026, 8, 15)
  const min = new Date(1900, 0, 1)

  return (
    <XStack justify="center">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        disabled={(d) => d > today || d < min}
      />
    </XStack>
  )
}
