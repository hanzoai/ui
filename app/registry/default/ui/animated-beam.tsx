"use client"

import * as React from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

interface AnimatedBeamProps extends React.HTMLAttributes<HTMLDivElement> {
  duration?: number
  delay?: number
  pathColor?: string
  pathWidth?: number
  gradientStartColor?: string
  gradientStopColor?: string
  containerRef?: React.RefObject<HTMLElement>
  fromRef?: React.RefObject<HTMLElement>
  toRef?: React.RefObject<HTMLElement>
}

const AnimatedBeam = React.forwardRef<HTMLDivElement, AnimatedBeamProps>(
  (
    {
      className,
      duration = 3,
      delay = 0,
      pathColor = "gray",
      pathWidth = 2,
      gradientStartColor = "#18CCFC",
      gradientStopColor = "#6344F5",
      containerRef,
      fromRef,
      toRef,
      ...props
    },
    ref
  ) => {
    const [pathD, setPathD] = React.useState("")

    React.useEffect(() => {
      if (!containerRef?.current || !fromRef?.current || !toRef?.current) return

      const updatePath = () => {
        const containerRect = containerRef.current!.getBoundingClientRect()
        const fromRect = fromRef.current!.getBoundingClientRect()
        const toRect = toRef.current!.getBoundingClientRect()

        const fromX = fromRect.left - containerRect.left + fromRect.width / 2
        const fromY = fromRect.top - containerRect.top + fromRect.height / 2
        const toX = toRect.left - containerRect.left + toRect.width / 2
        const toY = toRect.top - containerRect.top + toRect.height / 2

        const controlX = (fromX + toX) / 2
        const controlY = Math.min(fromY, toY) - 50

        setPathD(`M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`)
      }

      updatePath()
      window.addEventListener("resize", updatePath)
      return () => window.removeEventListener("resize", updatePath)
    }, [containerRef, fromRef, toRef])

    return (
      <svg
        ref={ref}
        className={cn("pointer-events-none absolute inset-0", className)}
        {...props}
      >
        <path
          d={pathD}
          stroke={pathColor}
          strokeWidth={pathWidth}
          fill="none"
          strokeOpacity={0.2}
        />
        <motion.path
          d={pathD}
          stroke={`url(#gradient-${gradientStartColor}-${gradientStopColor})`}
          strokeWidth={pathWidth}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration,
            delay,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
        <defs>
          <linearGradient
            id={`gradient-${gradientStartColor}-${gradientStopColor}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={gradientStartColor} />
            <stop offset="100%" stopColor={gradientStopColor} />
          </linearGradient>
        </defs>
      </svg>
    )
  }
)

AnimatedBeam.displayName = "AnimatedBeam"

export { AnimatedBeam }
