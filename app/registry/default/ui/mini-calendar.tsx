"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

export interface MiniCalendarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  selected?: Date
  onSelect?: (date: Date) => void
  month?: Date
  onMonthChange?: (date: Date) => void
}

const MiniCalendar = React.forwardRef<HTMLDivElement, MiniCalendarProps>(
  (
    {
      className,
      selected,
      onSelect,
      month: monthProp,
      onMonthChange,
      ...props
    },
    ref
  ) => {
    const [month, setMonth] = React.useState(monthProp || new Date())

    const daysInMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    ).getDate()
    const firstDayOfMonth = new Date(
      month.getFullYear(),
      month.getMonth(),
      1
    ).getDay()

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    const previousMonth = () => {
      const newMonth = new Date(month.getFullYear(), month.getMonth() - 1)
      setMonth(newMonth)
      onMonthChange?.(newMonth)
    }

    const nextMonth = () => {
      const newMonth = new Date(month.getFullYear(), month.getMonth() + 1)
      setMonth(newMonth)
      onMonthChange?.(newMonth)
    }

    const handleDayClick = (day: number) => {
      const date = new Date(month.getFullYear(), month.getMonth(), day)
      onSelect?.(date)
    }

    const isSelected = (day: number) => {
      if (!selected) return false
      return (
        selected.getDate() === day &&
        selected.getMonth() === month.getMonth() &&
        selected.getFullYear() === month.getFullYear()
      )
    }

    return (
      <div
        ref={ref}
        className={cn("w-64 rounded-lg border p-3", className)}
        {...props}
      >
        <div className="mb-2 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {month.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {weekDays.map((day) => (
            <div key={day} className="p-1 font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                "aspect-square rounded p-1 text-sm transition-colors hover:bg-accent",
                isSelected(day) &&
                  "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
    )
  }
)
MiniCalendar.displayName = "MiniCalendar"

export { MiniCalendar }
