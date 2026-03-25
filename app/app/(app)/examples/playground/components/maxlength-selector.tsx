"use client"

import * as React from "react"
import type { Slider as SliderPrimitive } from "radix-ui"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
<<<<<<<< HEAD:app/app/(app)/examples/playground/components/maxlength-selector.tsx
} from "@/registry/default/ui/hover-card"
import { Label } from "@/registry/default/ui/label"
import { Slider } from "@/registry/default/ui/slider"
========
} from "@/registry/new-york-v4/ui/hover-card"
import { Label } from "@/registry/new-york-v4/ui/label"
import { Slider } from "@/registry/new-york-v4/ui/slider"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/playground/components/maxlength-selector.tsx

interface MaxLengthSelectorProps {
  defaultValue: React.ComponentProps<
    typeof SliderPrimitive.Root
  >["defaultValue"]
}

export function MaxLengthSelector({ defaultValue }: MaxLengthSelectorProps) {
  const [value, setValue] = React.useState(defaultValue)

  return (
    <div className="grid gap-2 pt-2">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxlength">Maximum Length</Label>
              <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
                {value}
              </span>
            </div>
            <Slider
              id="maxlength"
              max={4000}
              defaultValue={value}
              step={10}
              onValueChange={setValue}
              aria-label="Maximum Length"
            />
          </div>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          className="w-[260px] text-sm"
          side="left"
        >
          The maximum number of tokens to generate. Requests can use up to 2,048
          or 4,000 tokens, shared between prompt and completion. The exact limit
          varies by model.
        </HoverCardContent>
      </HoverCard>
    </div>
  )
}
