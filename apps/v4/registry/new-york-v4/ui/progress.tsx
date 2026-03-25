"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
<<<<<<< HEAD
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
=======
        "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
>>>>>>> shadcn/main
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
<<<<<<< HEAD
        className="bg-primary h-full w-full flex-1 transition-all"
=======
        className="h-full w-full flex-1 bg-primary transition-all"
>>>>>>> shadcn/main
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
