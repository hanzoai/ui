"use client"

import * as React from "react"
import { Check, X, Search, Tag } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/registry/default/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/registry/default/ui/tabs"

// Comprehensive Tailwind CSS classes organized by category
const TAILWIND_CLASSES = {
  layout: [
    "container",
    "flex",
    "inline-flex",
    "grid",
    "inline-grid",
    "block",
    "inline-block",
    "inline",
    "hidden",
    "flex-row",
    "flex-col",
    "flex-wrap",
    "flex-nowrap",
    "items-start",
    "items-center",
    "items-end",
    "items-baseline",
    "items-stretch",
    "justify-start",
    "justify-center",
    "justify-end",
    "justify-between",
    "justify-around",
    "justify-evenly",
    "gap-0",
    "gap-1",
    "gap-2",
    "gap-3",
    "gap-4",
    "gap-6",
    "gap-8",
    "gap-12",
    "grid-cols-1",
    "grid-cols-2",
    "grid-cols-3",
    "grid-cols-4",
    "grid-cols-6",
    "grid-cols-12",
  ],
  spacing: [
    "p-0",
    "p-1",
    "p-2",
    "p-3",
    "p-4",
    "p-6",
    "p-8",
    "p-12",
    "p-16",
    "px-0",
    "px-1",
    "px-2",
    "px-3",
    "px-4",
    "px-6",
    "px-8",
    "py-0",
    "py-1",
    "py-2",
    "py-3",
    "py-4",
    "py-6",
    "py-8",
    "pt-0",
    "pt-2",
    "pt-4",
    "pt-6",
    "pt-8",
    "pb-0",
    "pb-2",
    "pb-4",
    "pb-6",
    "pb-8",
    "pl-2",
    "pl-4",
    "pr-2",
    "pr-4",
    "m-0",
    "m-1",
    "m-2",
    "m-4",
    "m-6",
    "m-8",
    "mx-auto",
    "mx-2",
    "mx-4",
    "my-2",
    "my-4",
    "my-6",
    "mt-2",
    "mt-4",
    "mb-2",
    "mb-4",
    "space-x-2",
    "space-x-4",
    "space-y-2",
    "space-y-4",
    "space-y-6",
    "space-y-8",
  ],
  sizing: [
    "w-full",
    "w-auto",
    "w-1/2",
    "w-1/3",
    "w-2/3",
    "w-1/4",
    "w-3/4",
    "w-screen",
    "w-fit",
    "w-8",
    "w-12",
    "w-16",
    "w-24",
    "w-32",
    "w-64",
    "h-full",
    "h-auto",
    "h-screen",
    "h-fit",
    "h-8",
    "h-12",
    "h-16",
    "h-24",
    "h-32",
    "h-64",
    "min-h-screen",
    "min-h-full",
    "max-w-xs",
    "max-w-sm",
    "max-w-md",
    "max-w-lg",
    "max-w-xl",
    "max-w-2xl",
    "max-w-4xl",
    "max-w-7xl",
    "max-w-full",
  ],
  colors: [
    "bg-background",
    "bg-foreground",
    "bg-card",
    "bg-primary",
    "bg-secondary",
    "bg-muted",
    "bg-accent",
    "bg-destructive",
    "bg-border",
    "bg-input",
    "bg-ring",
    "bg-white",
    "bg-black",
    "bg-transparent",
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "text-foreground",
    "text-background",
    "text-primary",
    "text-secondary",
    "text-muted-foreground",
    "text-accent-foreground",
    "text-destructive",
    "text-white",
    "text-black",
    "text-red-500",
    "text-blue-500",
    "text-green-500",
    "border-border",
    "border-input",
    "border-primary",
    "border-secondary",
    "border-destructive",
    "border-white",
    "border-black",
    "border-transparent",
  ],
  typography: [
    "text-xs",
    "text-sm",
    "text-base",
    "text-lg",
    "text-xl",
    "text-2xl",
    "text-3xl",
    "text-4xl",
    "font-thin",
    "font-light",
    "font-normal",
    "font-medium",
    "font-semibold",
    "font-bold",
    "font-extrabold",
    "italic",
    "not-italic",
    "uppercase",
    "lowercase",
    "capitalize",
    "normal-case",
    "underline",
    "line-through",
    "no-underline",
    "text-left",
    "text-center",
    "text-right",
    "text-justify",
    "leading-none",
    "leading-tight",
    "leading-normal",
    "leading-relaxed",
    "tracking-tighter",
    "tracking-tight",
    "tracking-normal",
    "tracking-wide",
  ],
  borders: [
    "border",
    "border-0",
    "border-2",
    "border-4",
    "border-t",
    "border-b",
    "border-l",
    "border-r",
    "border-x",
    "border-y",
    "border-solid",
    "border-dashed",
    "border-dotted",
    "border-none",
    "rounded",
    "rounded-none",
    "rounded-sm",
    "rounded-md",
    "rounded-lg",
    "rounded-xl",
    "rounded-2xl",
    "rounded-3xl",
    "rounded-full",
    "rounded-t",
    "rounded-b",
    "rounded-l",
    "rounded-r",
  ],
  effects: [
    "shadow",
    "shadow-sm",
    "shadow-md",
    "shadow-lg",
    "shadow-xl",
    "shadow-2xl",
    "shadow-none",
    "opacity-0",
    "opacity-25",
    "opacity-50",
    "opacity-75",
    "opacity-100",
    "blur",
    "blur-sm",
    "blur-md",
    "blur-lg",
    "blur-none",
    "backdrop-blur",
    "backdrop-blur-sm",
    "backdrop-blur-md",
    "grayscale",
    "invert",
    "sepia",
  ],
  transitions: [
    "transition",
    "transition-all",
    "transition-colors",
    "transition-opacity",
    "transition-shadow",
    "transition-transform",
    "duration-75",
    "duration-100",
    "duration-150",
    "duration-200",
    "duration-300",
    "duration-500",
    "duration-700",
    "ease-linear",
    "ease-in",
    "ease-out",
    "ease-in-out",
    "animate-spin",
    "animate-ping",
    "animate-pulse",
    "animate-bounce",
  ],
  interactivity: [
    "cursor-auto",
    "cursor-pointer",
    "cursor-wait",
    "cursor-text",
    "cursor-move",
    "cursor-not-allowed",
    "select-none",
    "select-text",
    "select-all",
    "pointer-events-none",
    "pointer-events-auto",
    "resize-none",
    "resize",
    "hover:opacity-75",
    "hover:scale-105",
    "hover:bg-accent",
    "focus:outline-none",
    "focus:ring",
    "focus:ring-primary",
    "active:scale-95",
  ],
  positioning: [
    "static",
    "fixed",
    "absolute",
    "relative",
    "sticky",
    "top-0",
    "right-0",
    "bottom-0",
    "left-0",
    "inset-0",
    "z-0",
    "z-10",
    "z-20",
    "z-30",
    "z-40",
    "z-50",
    "overflow-auto",
    "overflow-hidden",
    "overflow-visible",
    "overflow-scroll",
    "overflow-x-auto",
    "overflow-y-auto",
  ],
}

const CATEGORY_LABELS: Record<keyof typeof TAILWIND_CLASSES, string> = {
  layout: "Layout",
  spacing: "Spacing",
  sizing: "Sizing",
  colors: "Colors",
  typography: "Typography",
  borders: "Borders",
  effects: "Effects",
  transitions: "Transitions",
  interactivity: "Interactivity",
  positioning: "Positioning",
}

interface ClassAutocompleteProps {
  value: string
  onChange: (value: string) => void
}

export function ClassAutocomplete({ value, onChange }: ClassAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedCategory, setSelectedCategory] = React.useState<
    keyof typeof TAILWIND_CLASSES | "all" | "recent"
  >("all")
  const [recentClasses, setRecentClasses] = React.useState<string[]>([])

  // Parse existing classes
  const existingClasses = React.useMemo(
    () => value.split(" ").filter(Boolean),
    [value]
  )

  // Get all classes
  const allClasses = React.useMemo(
    () =>
      Object.values(TAILWIND_CLASSES)
        .flat()
        .sort(),
    []
  )

  // Filter classes based on category and search
  const filteredClasses = React.useMemo(() => {
    let classes: string[] = []

    if (selectedCategory === "all") {
      classes = allClasses
    } else if (selectedCategory === "recent") {
      classes = recentClasses
    } else {
      classes = TAILWIND_CLASSES[selectedCategory] || []
    }

    if (search) {
      classes = classes.filter((cls) =>
        cls.toLowerCase().includes(search.toLowerCase())
      )
    }

    return classes
  }, [selectedCategory, search, allClasses, recentClasses])

  // Add a class
  const addClass = (className: string) => {
    if (!existingClasses.includes(className)) {
      const newClasses = [...existingClasses, className].join(" ")
      onChange(newClasses)

      // Add to recent (max 20)
      setRecentClasses((prev) => {
        const updated = [className, ...prev.filter((c) => c !== className)]
        return updated.slice(0, 20)
      })
    }
    setSearch("")
    setOpen(false)
  }

  // Remove a class
  const removeClass = (className: string) => {
    const newClasses = existingClasses
      .filter((cls) => cls !== className)
      .join(" ")
    onChange(newClasses)
  }

  // Validate class (simple check if it exists in our list)
  const isValidClass = (className: string) => {
    return allClasses.includes(className)
  }

  // Get category for a class
  const getClassCategory = (className: string): string => {
    for (const [category, classes] of Object.entries(TAILWIND_CLASSES)) {
      if (classes.includes(className)) {
        return CATEGORY_LABELS[category as keyof typeof TAILWIND_CLASSES]
      }
    }
    return "Custom"
  }

  // Get preview description
  const getClassPreview = (className: string): string => {
    if (className.startsWith("bg-")) return "Background color"
    if (className.startsWith("text-") && !className.includes("size"))
      return "Text color/size"
    if (className.startsWith("p-") || className.startsWith("m-"))
      return "Spacing"
    if (className.startsWith("w-") || className.startsWith("h-"))
      return "Sizing"
    if (className.startsWith("border")) return "Border style"
    if (className.startsWith("rounded")) return "Border radius"
    if (className.startsWith("shadow")) return "Shadow effect"
    if (className.startsWith("flex") || className.startsWith("grid"))
      return "Layout"
    if (className.startsWith("hover:")) return "Hover state"
    if (className.startsWith("focus:")) return "Focus state"
    return "Utility class"
  }

  return (
    <div className="space-y-2">
      {/* Applied Classes */}
      {existingClasses.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-md border bg-muted/30 p-2">
          {existingClasses.map((cls) => (
            <Badge
              key={cls}
              variant={isValidClass(cls) ? "secondary" : "destructive"}
              className="group relative pr-1 text-[10px]"
            >
              <span className="max-w-[120px] truncate">{cls}</span>
              <button
                onClick={() => removeClass(cls)}
                className="ml-1 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Class Input */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-xs font-normal"
          >
            <Search className="mr-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            {existingClasses.length === 0
              ? "Add Tailwind classes..."
              : `${existingClasses.length} ${existingClasses.length === 1 ? "class" : "classes"} applied`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="space-y-2 p-2">
            {/* Category Tabs */}
            <Tabs
              value={selectedCategory}
              onValueChange={(v) =>
                setSelectedCategory(v as keyof typeof TAILWIND_CLASSES)
              }
            >
              <TabsList className="grid h-8 w-full grid-cols-5 gap-1 bg-transparent p-0">
                <TabsTrigger value="all" className="h-7 text-[10px] px-1">
                  All
                </TabsTrigger>
                <TabsTrigger value="recent" className="h-7 text-[10px] px-1">
                  Recent
                </TabsTrigger>
                <TabsTrigger value="layout" className="h-7 text-[10px] px-1">
                  Layout
                </TabsTrigger>
                <TabsTrigger value="spacing" className="h-7 text-[10px] px-1">
                  Space
                </TabsTrigger>
                <TabsTrigger value="colors" className="h-7 text-[10px] px-1">
                  Color
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <Command className="border">
              <CommandInput
                placeholder={`Search ${selectedCategory === "all" ? "all" : selectedCategory} classes...`}
                value={search}
                onValueChange={setSearch}
                className="h-8 text-xs"
              />
              <CommandList>
                <CommandEmpty className="py-6 text-xs text-center text-muted-foreground">
                  No classes found.
                </CommandEmpty>
                <CommandGroup>
                  <ScrollArea className="h-[250px]">
                    {filteredClasses.map((cls) => {
                      const isApplied = existingClasses.includes(cls)
                      return (
                        <CommandItem
                          key={cls}
                          value={cls}
                          onSelect={() => addClass(cls)}
                          disabled={isApplied}
                          className="text-xs"
                        >
                          <div className="flex flex-1 items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Check
                                className={cn(
                                  "h-3 w-3",
                                  isApplied ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <code className="font-mono">{cls}</code>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-[9px] font-normal"
                              >
                                {getClassCategory(cls)}
                              </Badge>
                            </div>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Category Quick Links */}
            <div className="flex flex-wrap gap-1 border-t pt-2">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Button
                  key={key}
                  variant={selectedCategory === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setSelectedCategory(key as keyof typeof TAILWIND_CLASSES)
                  }
                  className="h-6 text-[10px] px-2"
                >
                  <Tag className="mr-1 h-2.5 w-2.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Helper Text */}
      <p className="text-[10px] text-muted-foreground">
        {existingClasses.length === 0
          ? "Click to browse Tailwind classes by category"
          : `${allClasses.length - existingClasses.length} more classes available`}
      </p>
    </div>
  )
}
