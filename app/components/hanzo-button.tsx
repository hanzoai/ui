"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { HanzoLogo } from "@/components/hanzo-logo"
import { Button, ButtonProps } from "@/registry/default/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/default/ui/tooltip"
import { Block } from "@/registry/schema"
import { Style } from "@/registry/styles"

type Size = "default" | "icon"

function V0Tooltip({
  size,
  style = "default",
  children,
}: React.PropsWithChildren<{ size: Size; style?: Style["name"] }>) {
  if (size === "default") {
    return <>{children}</>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <>{children}</>
      </TooltipTrigger>
      <TooltipContent>
        <>Open in Hanzo App</>
      </TooltipContent>
    </Tooltip>
  )
}

export function HanzoButton({
  block,
  size = "default",
  disabled,
  className,
  ...props
}: {
  block: Pick<Block, "name" | "description" | "code" | "style">
  size?: Size
} & ButtonProps) {
  // Single theme system - always use default style
  return (
    <Button
      aria-label="Open in Hanzo App"
      className={cn(
        "z-50 h-[calc(theme(spacing.7)_-_1px)] gap-1 rounded-[6px] bg-black px-3 text-xs text-white hover:bg-black hover:text-white dark:bg-white dark:text-black",
        size === "icon" && "h-7 w-7 p-0"
      )}
      onClick={() => window.open("https://hanzo.app", "_blank")}
      disabled={disabled}
      {...props}
    >
      {size === "icon" ? (
        <HanzoLogo className="h-4 w-4" />
      ) : (
        <>
          Open in <HanzoLogo className="h-4 w-4 invert dark:invert-0" />
        </>
      )}
    </Button>
  )
}
