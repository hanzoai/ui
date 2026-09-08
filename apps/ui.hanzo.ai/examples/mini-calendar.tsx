import { useState } from "react"
import { XStack } from "@hanzo/gui"
import { MiniCalendar } from "@hanzo/ui"

/** Default — one bordered month, nothing selected until you pick a day. */
export function Default() {
  const [date, setDate] = useState<Date | undefined>()

  return <MiniCalendar month={new Date(2026, 8, 1)} selected={date} onSelect={setDate} />
}

/** Preselected — opens on a day that is already picked. */
export function Preselected() {
  const [date, setDate] = useState<Date | undefined>(new Date(2026, 8, 15))

  return <MiniCalendar month={new Date(2026, 8, 1)} selected={date} onSelect={setDate} />
}

/** Controlled month — the caption and the shown days follow state you own. */
export function ControlledMonth() {
  const [month, setMonth] = useState(new Date(2026, 8, 1))
  const [date, setDate] = useState<Date | undefined>()

  return <MiniCalendar month={month} onMonthChange={setMonth} selected={date} onSelect={setDate} />
}

/** Side by side — two independent pickers, each holding its own day. */
export function SideBySide() {
  const [a, setA] = useState<Date | undefined>(new Date(2026, 8, 3))
  const [b, setB] = useState<Date | undefined>(new Date(2026, 9, 20))

  return (
    <XStack gap="$4" flexWrap="wrap">
      <MiniCalendar month={new Date(2026, 8, 1)} selected={a} onSelect={setA} />
      <MiniCalendar month={new Date(2026, 9, 1)} selected={b} onSelect={setB} />
    </XStack>
  )
}
