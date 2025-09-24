"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "../lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

// Additional Popover components for extended functionality
const PopoverItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
)
PopoverItem.displayName = "PopoverItem"

const PopoverLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
)
PopoverLabel.displayName = "PopoverLabel"

const PopoverSeparator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
)
PopoverSeparator.displayName = "PopoverSeparator"

const PopoverGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("p-1", className)}
      {...props}
    />
  )
)
PopoverGroup.displayName = "PopoverGroup"

const PopoverHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5 text-sm font-semibold", className)}
      {...props}
    />
  )
)
PopoverHeader.displayName = "PopoverHeader"

const PopoverTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
PopoverTitle.displayName = "PopoverTitle"

const PopoverDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
PopoverDescription.displayName = "PopoverDescription"

const PopoverFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-2 py-1.5", className)}
      {...props}
    />
  )
)
PopoverFooter.displayName = "PopoverFooter"

const PopoverProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>
PopoverProvider.displayName = "PopoverProvider"

const PopoverList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col", className)}
      {...props}
    />
  )
)
PopoverList.displayName = "PopoverList"

const PopoverValue = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("text-sm", className)}
      {...props}
    />
  )
)
PopoverValue.displayName = "PopoverValue"

const PopoverImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => (
    <img
      ref={ref}
      className={cn("h-4 w-4", className)}
      {...props}
    />
  )
)
PopoverImage.displayName = "PopoverImage"

const PopoverFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
)
PopoverFallback.displayName = "PopoverFallback"

export { 
  Popover, 
  PopoverTrigger, 
  PopoverContent, 
  PopoverAnchor,
  PopoverItem,
  PopoverLabel,
  PopoverSeparator,
  PopoverGroup,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverFooter,
  PopoverProvider,
  PopoverList,
  PopoverValue,
  PopoverImage,
  PopoverFallback
}
