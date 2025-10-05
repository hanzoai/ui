"use client"

import * as React from "react"
import { Check, Circle, Clock } from "lucide-react"

import { cn } from "@/lib/utils"

interface TimelineItem {
  id: string
  title: string
  description?: string
  date?: string
  time?: string
  status?: "completed" | "active" | "pending"
  icon?: React.ReactNode
  content?: React.ReactNode
}

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  items: TimelineItem[]
  orientation?: "vertical" | "horizontal"
  variant?: "default" | "alternate" | "compact" | "simple"
  animated?: boolean
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  (
    {
      className,
      items,
      orientation = "vertical",
      variant = "default",
      animated = true,
      ...props
    },
    ref
  ) => {
    const [visibleItems, setVisibleItems] = React.useState<Set<string>>(
      new Set()
    )

    React.useEffect(() => {
      if (!animated) {
        setVisibleItems(new Set(items.map((item) => item.id)))
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute("data-timeline-id")
              if (id) {
                setVisibleItems((prev) => new Set([...prev, id]))
              }
            }
          })
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
        }
      )

      const elements = document.querySelectorAll("[data-timeline-id]")
      elements.forEach((el) => observer.observe(el))

      return () => observer.disconnect()
    }, [items, animated])

    const getStatusIcon = (status?: TimelineItem["status"]) => {
      switch (status) {
        case "completed":
          return <Check className="h-3 w-3" />
        case "active":
          return <Clock className="h-3 w-3 animate-pulse" />
        default:
          return null
      }
    }

    const getStatusColor = (status?: TimelineItem["status"]) => {
      switch (status) {
        case "completed":
          return "bg-green-500 text-white"
        case "active":
          return "bg-blue-500 text-white"
        case "pending":
          return "bg-gray-300 dark:bg-gray-600"
        default:
          return "bg-primary text-primary-foreground"
      }
    }

    if (orientation === "horizontal") {
      return (
        <div
          ref={ref}
          className={cn("relative overflow-x-auto", className)}
          {...props}
        >
          <div className="flex items-start space-x-8 pb-4">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-timeline-id={item.id}
                className={cn(
                  "relative flex flex-col items-center min-w-[200px]",
                  animated &&
                    !visibleItems.has(item.id) &&
                    "opacity-0 translate-y-4",
                  animated &&
                    visibleItems.has(item.id) &&
                    "opacity-100 translate-y-0",
                  "transition-all duration-500 ease-out"
                )}
              >
                {/* Connector Line */}
                {index < items.length - 1 && (
                  <div className="absolute top-5 left-[50%] w-[calc(100%+2rem)] h-[2px] bg-border" />
                )}

                {/* Milestone */}
                <div
                  className={cn(
                    "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background shadow-sm",
                    getStatusColor(item.status)
                  )}
                >
                  {item.icon || getStatusIcon(item.status) || (
                    <Circle className="h-3 w-3" />
                  )}
                </div>

                {/* Content */}
                <div className="mt-4 text-center">
                  {(item.date || item.time) && (
                    <div className="mb-1 text-xs text-muted-foreground">
                      {item.date}
                      {item.date && item.time && " • "}
                      {item.time}
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.content && <div className="mt-3">{item.content}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Vertical orientation
    if (variant === "alternate") {
      return (
        <div ref={ref} className={cn("relative", className)} {...props}>
          {items.map((item, index) => (
            <div
              key={item.id}
              data-timeline-id={item.id}
              className={cn(
                "relative flex items-start mb-8",
                index % 2 === 0 ? "justify-start" : "justify-end",
                animated && !visibleItems.has(item.id) && "opacity-0",
                animated && visibleItems.has(item.id) && "opacity-100",
                animated &&
                  !visibleItems.has(item.id) &&
                  (index % 2 === 0 ? "-translate-x-8" : "translate-x-8"),
                animated && visibleItems.has(item.id) && "translate-x-0",
                "transition-all duration-500 ease-out"
              )}
            >
              {/* Center line */}
              <div className="absolute left-1/2 -translate-x-1/2 top-5 bottom-0 w-[2px] bg-border" />

              {/* Content */}
              <div
                className={cn(
                  "relative w-[calc(50%-2rem)]",
                  index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"
                )}
              >
                {/* Milestone */}
                <div
                  className={cn(
                    "absolute top-0",
                    index % 2 === 0 ? "right-0" : "left-0",
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 border-background shadow-sm",
                    getStatusColor(item.status)
                  )}
                >
                  {item.icon || getStatusIcon(item.status) || (
                    <Circle className="h-3 w-3" />
                  )}
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "rounded-lg border bg-card p-4 shadow-sm",
                    index % 2 === 0 ? "mr-12" : "ml-12"
                  )}
                >
                  {(item.date || item.time) && (
                    <div className="mb-2 text-xs text-muted-foreground">
                      {item.date}
                      {item.date && item.time && " • "}
                      {item.time}
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.content && <div className="mt-3">{item.content}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (variant === "compact") {
      return (
        <div ref={ref} className={cn("relative", className)} {...props}>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-timeline-id={item.id}
                className={cn(
                  "relative flex items-center gap-4 p-2 rounded-lg hover:bg-accent transition-colors",
                  animated &&
                    !visibleItems.has(item.id) &&
                    "opacity-0 translate-x-4",
                  animated &&
                    visibleItems.has(item.id) &&
                    "opacity-100 translate-x-0",
                  "transition-all duration-500 ease-out",
                  `transition-delay-[${index * 50}ms]`
                )}
              >
                {/* Connector */}
                {index < items.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-border" />
                )}

                {/* Milestone */}
                <div
                  className={cn(
                    "relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full",
                    getStatusColor(item.status)
                  )}
                >
                  {getStatusIcon(item.status) || <Circle className="h-2 w-2" />}
                </div>

                {/* Content */}
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{item.title}</span>
                    {item.description && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {(item.date || item.time) && (
                    <div className="text-xs text-muted-foreground">
                      {item.date} {item.time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (variant === "simple") {
      return (
        <div ref={ref} className={cn("relative", className)} {...props}>
          <div className="border-l-2 border-border pl-6 space-y-6">
            {items.map((item, index) => (
              <div
                key={item.id}
                data-timeline-id={item.id}
                className={cn(
                  "relative",
                  animated &&
                    !visibleItems.has(item.id) &&
                    "opacity-0 translate-x-4",
                  animated &&
                    visibleItems.has(item.id) &&
                    "opacity-100 translate-x-0",
                  "transition-all duration-500 ease-out"
                )}
              >
                {/* Milestone */}
                <div
                  className={cn(
                    "absolute -left-[1.75rem] flex h-4 w-4 items-center justify-center rounded-full border-2 border-background",
                    getStatusColor(item.status)
                  )}
                >
                  {item.status === "completed" && <Check className="h-2 w-2" />}
                  {item.status === "active" && (
                    <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div>
                  {(item.date || item.time) && (
                    <div className="mb-1 text-xs text-muted-foreground">
                      {item.date}
                      {item.date && item.time && " • "}
                      {item.time}
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.content && <div className="mt-3">{item.content}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Default variant
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <div className="space-y-8">
          {items.map((item, index) => (
            <div
              key={item.id}
              data-timeline-id={item.id}
              className={cn(
                "relative flex gap-6",
                animated &&
                  !visibleItems.has(item.id) &&
                  "opacity-0 translate-x-8",
                animated &&
                  visibleItems.has(item.id) &&
                  "opacity-100 translate-x-0",
                "transition-all duration-500 ease-out"
              )}
            >
              {/* Connector Line */}
              {index < items.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-[2px] bg-border" />
              )}

              {/* Milestone */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-background shadow-sm",
                  getStatusColor(item.status)
                )}
              >
                {item.icon || getStatusIcon(item.status) || (
                  <Circle className="h-3 w-3" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-8">
                <div className="rounded-lg border bg-card p-4 shadow-sm">
                  {(item.date || item.time) && (
                    <div className="mb-2 text-xs text-muted-foreground">
                      {item.date}
                      {item.date && item.time && " • "}
                      {item.time}
                    </div>
                  )}
                  <h3 className="font-semibold">{item.title}</h3>
                  {item.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.content && <div className="mt-3">{item.content}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

Timeline.displayName = "Timeline"

export { Timeline, type TimelineItem, type TimelineProps }
