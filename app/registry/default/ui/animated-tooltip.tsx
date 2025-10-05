"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion"

import { cn } from "@/lib/utils"

interface AnimatedTooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode
  children: React.ReactNode
  delay?: number
}

const AnimatedTooltip = React.forwardRef<HTMLDivElement, AnimatedTooltipProps>(
  ({ className, content, children, delay = 0, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false)

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        {...props}
      >
        {children}
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{
                duration: 0.2,
                delay: delay / 1000,
                ease: "easeOut",
              }}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-sm rounded-md shadow-md whitespace-nowrap z-50"
            >
              {content}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-popover" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedTooltip.displayName = "AnimatedTooltip"

export { AnimatedTooltip }
