"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ChoiceboxOption {
  value: string
  label: string
  description?: string
}

export interface ChoiceboxProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  options: ChoiceboxOption[]
  value?: string
  onChange?: (value: string) => void
  multiple?: boolean
}

const Choicebox = React.forwardRef<HTMLDivElement, ChoiceboxProps>(
  (
    { className, options, value, onChange, multiple = false, ...props },
    ref
  ) => {
    const [selected, setSelected] = React.useState<string[]>(
      value ? [value] : []
    )

    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newSelected = selected.includes(optionValue)
          ? selected.filter((v) => v !== optionValue)
          : [...selected, optionValue]
        setSelected(newSelected)
        onChange?.(newSelected.join(","))
      } else {
        setSelected([optionValue])
        onChange?.(optionValue)
      }
    }

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              "relative w-full rounded-lg border-2 p-4 text-left transition-colors hover:bg-accent",
              selected.includes(option.value)
                ? "border-primary bg-primary/5"
                : "border-input"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected.includes(option.value)
                    ? "border-primary bg-primary"
                    : "border-input"
                )}
              >
                {selected.includes(option.value) && (
                  <Check className="h-3 w-3 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{option.label}</div>
                {option.description && (
                  <div className="text-sm text-muted-foreground">
                    {option.description}
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)
Choicebox.displayName = "Choicebox"

export { Choicebox }
