"use client"

import * as React from "react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"
import { Input } from "@/registry/default/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
  disabled?: boolean
}

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  ({ value = "#3b82f6", onChange, className, disabled = false }, ref) => {
    const [color, setColor] = React.useState(value)

    const handleChange = (newColor: string) => {
      setColor(newColor)
      onChange?.(newColor)
    }

    return (
      <div ref={ref} className={cn("flex items-center gap-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[220px] justify-start text-left font-normal"
              disabled={disabled}
            >
              <div className="flex w-full items-center gap-2">
                <div
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="flex-1 truncate">{color}</span>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="space-y-3">
              <HexColorPicker color={color} onChange={handleChange} />
              <Input
                value={color}
                onChange={(e) => handleChange(e.target.value)}
                placeholder="#000000"
                className="font-mono text-sm"
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

export { ColorPicker }
