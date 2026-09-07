import { useState } from "react"
import { YStack } from "@hanzo/gui"
import { DatePicker, type CalendarRange } from "@hanzo/ui"

/** Default — a button that opens a calendar and reports the day you pick. */
export function Default() {
  const [date, setDate] = useState<Date>()
  return <DatePicker selected={date} onSelect={setDate} />
}

/** Range — `mode="range"` shows two months and reports a `{ from, to }` pair. */
export function Range() {
  const [range, setRange] = useState<CalendarRange>({
    from: new Date(2026, 0, 20),
    to: new Date(2026, 1, 9),
  })
  return <DatePicker mode="range" selected={range} onSelect={(r: CalendarRange | undefined) => r && setRange(r)} />
}

/** With presets — a `Select` above the grid jumps straight to a day. */
export function WithPresets() {
  const [date, setDate] = useState<Date>()
  return (
    <DatePicker
      selected={date}
      onSelect={setDate}
      presets={[
        { label: "Today", days: 0 },
        { label: "Tomorrow", days: 1 },
        { label: "In 3 days", days: 3 },
        { label: "In a week", days: 7 },
      ]}
    />
  )
}

/** No past dates — a `disabled` predicate rules out yesterday and earlier. */
export function NoPastDates() {
  const [date, setDate] = useState<Date>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return (
    <YStack items="flex-start">
      <DatePicker
        placeholder="Date of birth"
        selected={date}
        onSelect={setDate}
        disabled={(day) => day.getTime() < today.getTime()}
      />
    </YStack>
  )
}
