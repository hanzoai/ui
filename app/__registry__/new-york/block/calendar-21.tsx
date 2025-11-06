"use client"

import * as React from "react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/registry/default/ui/button"
import { Calendar } from "@/registry/default/ui/calendar"

export default function Calendar21() {
  const [range, setRange] = React.useState<DateRange | undefined>({
    from: new Date(2025, 5, 12),
    to: new Date(2025, 5, 17),
  })

  return (
    <Calendar
      mode="range"
      defaultMonth={range?.from}
      selected={range}
      onSelect={setRange}
      numberOfMonths={1}
      captionLayout="dropdown"
      className="rounded-lg border shadow-sm [--cell-size:2.75rem] md:[--cell-size:3rem]"
      formatters={{
        formatMonthDropdown: (date) => {
          return date.toLocaleString("default", { month: "long" })
        },
      }}
      components={{
        DayButton: ({ children, modifiers, day, ...props }) => {
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6

          return (
            <button
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "relative flex flex-col items-center justify-center h-9 w-9 p-0 font-normal aria-selected:opacity-100"
              )}
              {...props}
            >
              <div>{children}</div>
              {!modifiers.outside && (
                <span className="text-xs">{isWeekend ? "$220" : "$100"}</span>
              )}
            </button>
          )
        },
      }}
    />
  )
}
