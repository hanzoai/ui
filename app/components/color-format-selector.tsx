"use client"

import * as React from "react"

import { getColorFormat, type Color } from "@/lib/colors"
import { cn } from "@/lib/utils"
import { useColors } from "@/hooks/use-colors"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/registry/default/ui/select"
import { Skeleton } from "@/registry/default/ui/skeleton"

export function ColorFormatSelector({
  color,
  className,
  ...props
}: Omit<React.ComponentProps<typeof SelectTrigger>, "color"> & {
  color: Color
}) {
  const { format, setFormat, isLoading } = useColors()
  const formats = React.useMemo(() => getColorFormat(color), [color])

  if (isLoading) {
    return <ColorFormatSelectorSkeleton />
  }

  return (
    <Select value={format} onValueChange={setFormat}>
      <SelectTrigger
        className={cn(
          "bg-secondary text-secondary-foreground border-secondary shadow-none h-8 text-sm",
          className
        )}
        {...props}
      >
        <span className="font-medium">Format: </span>
        <span className="text-muted-foreground font-mono">{format}</span>
      </SelectTrigger>
      <SelectContent align="end" className="rounded-xl max-h-[300px]">
        {Object.entries(formats).map(([format, value]) => (
          <SelectItem
            key={format}
            value={format}
            className="gap-2 rounded-lg [&>span]:flex [&>span]:items-center [&>span]:gap-2"
          >
            <span className="font-medium min-w-[80px]">{format}</span>
            <span className="text-muted-foreground font-mono text-xs max-w-[200px] truncate">
              {value}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function ColorFormatSelectorSkeleton({
  className,
  ...props
}: React.ComponentProps<typeof Skeleton>) {
  return (
    <Skeleton
      className={cn("h-8 w-[132px] gap-1.5 rounded-md", className)}
      {...props}
    />
  )
}
