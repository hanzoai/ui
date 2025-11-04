"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button, ButtonProps } from "@/registry/new-york/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/registry/new-york/ui/tooltip"
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
        {style === "new-york" ? (
          <span tabIndex={-1}>{children}</span>
        ) : (
          <>{children}</>
        )}
      </TooltipTrigger>
      <TooltipContent>
        {style === "new-york" ? (
          <>Not available in New York</>
        ) : (
          <>View in Hanzo App</>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function V0Button({
  block,
  size = "default",
  disabled,
  className,
  ...props
}: {
  block: Pick<Block, "name" | "description" | "code" | "style">
  size?: Size
} & ButtonProps) {
  if (block.style === "new-york") {
    return (
      <V0Tooltip size={size} style={block.style}>
        <Button
          aria-label="View in Hanzo App"
          className={cn(
            "z-50 h-[calc(theme(spacing.7)_-_1px)] gap-1 rounded-[6px] bg-black px-3 text-xs text-white hover:bg-black hover:text-white dark:bg-white dark:text-black",
            size === "icon" && "h-7 w-7 p-0",
            className
          )}
          onClick={() => {
            window.open("https://hanzo.app", "_blank")
          }}
          disabled={disabled}
          {...props}
        >
          {size === "icon" ? (
            <HanzoLogo className="h-4 w-4" />
          ) : (
            <>
              View in <HanzoLogo />
            </>
          )}
        </Button>
      </V0Tooltip>
    )
  }
  return (
    <Button
      aria-label="View in Hanzo App"
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
          View in <HanzoLogo />
        </>
      )}
    </Button>
  )
}

export function HanzoLogo({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-5 w-5 text-current", className)}
      {...props}
    >
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize="16"
        fontWeight="bold"
        fill="currentColor"
      >
        H
      </text>
    </svg>
  )
}
