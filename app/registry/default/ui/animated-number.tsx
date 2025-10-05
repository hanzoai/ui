"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, MotionValue, useSpring, useTransform } from "motion/react"

import { cn } from "@/lib/utils"

/**
 * Custom hook to detect prefers-reduced-motion
 */
function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

export interface AnimatedNumberProps {
  /**
   * Target value to animate to
   */
  value: number
  /**
   * Starting value for animation
   */
  from?: number
  /**
   * Animation duration in milliseconds
   */
  duration?: number
  /**
   * Number of decimal places
   */
  decimals?: number
  /**
   * Number format type
   */
  format?: "number" | "currency" | "percent"
  /**
   * Currency code for currency format
   */
  currency?: string
  /**
   * Locale for number formatting
   */
  locale?: string
  /**
   * Easing function
   */
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce" | "elastic"
  /**
   * Whether to start animation automatically
   */
  autoStart?: boolean
  /**
   * Callback when animation completes
   */
  onComplete?: (value: number) => void
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Prefix text
   */
  prefix?: string
  /**
   * Suffix text
   */
  suffix?: string
  /**
   * Whether to use spring animation
   */
  useSpring?: boolean
  /**
   * Spring configuration
   */
  springConfig?: {
    tension?: number
    friction?: number
    mass?: number
  }
  /**
   * Custom number separator
   */
  separator?: string
  /**
   * Whether to animate on hover
   */
  animateOnHover?: boolean
  /**
   * Hover animation value
   */
  hoverValue?: number
}

const easingFunctions = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  bounce: [0.68, -0.6, 0.32, 1.6],
  elastic: [0.175, 0.885, 0.32, 1.275],
} as const

/**
 * Custom hook for animated number with various formatting options
 */
function useAnimatedNumber(
  targetValue: number,
  from: number,
  duration: number,
  decimals: number,
  format: "number" | "currency" | "percent",
  currency: string,
  locale: string,
  easing: keyof typeof easingFunctions,
  autoStart: boolean,
  useSpringAnim: boolean,
  springConfig: { tension?: number; friction?: number; mass?: number },
  separator?: string
) {
  const [displayValue, setDisplayValue] = useState(from)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Spring animation
  const springValue = useSpring(from, {
    tension: springConfig.tension || 100,
    friction: springConfig.friction || 10,
    mass: springConfig.mass || 1,
  })

  // Motion value for non-spring animation
  const [motionValue, setMotionValue] = useState(from)

  const startAnimation = useCallback(() => {
    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion) {
      setDisplayValue(targetValue)
      return
    }

    setIsAnimating(true)

    if (useSpringAnim) {
      springValue.set(targetValue)
    } else {
      // Custom easing animation
      const startTime = Date.now()
      const startValue = displayValue
      const distance = targetValue - startValue

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Apply easing
        const easedProgress = progress // Will be enhanced with actual easing
        const currentValue = startValue + distance * easedProgress

        setDisplayValue(currentValue)
        setMotionValue(currentValue)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }
  }, [
    targetValue,
    displayValue,
    duration,
    useSpringAnim,
    springValue,
    prefersReducedMotion,
  ])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Listen to spring value changes
  useEffect(() => {
    if (useSpringAnim) {
      const unsubscribe = springValue.on("change", (latest) => {
        setDisplayValue(latest)
      })

      const unsubscribeComplete = springValue.on("animationComplete", () => {
        setIsAnimating(false)
      })

      return () => {
        unsubscribe()
        unsubscribeComplete()
      }
    }
  }, [springValue, useSpringAnim])

  useEffect(() => {
    if (autoStart) {
      startAnimation()
    }
  }, [autoStart, startAnimation])

  const formattedValue = useMemo(() => {
    const roundedValue =
      Math.round(displayValue * Math.pow(10, decimals)) / Math.pow(10, decimals)

    try {
      switch (format) {
        case "currency":
          return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(roundedValue)

        case "percent":
          return new Intl.NumberFormat(locale, {
            style: "percent",
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(roundedValue / 100)

        default:
          let formatted = new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(roundedValue)

          if (separator && separator !== ",") {
            formatted = formatted.replace(/,/g, separator)
          }

          return formatted
      }
    } catch (error) {
      return roundedValue.toFixed(decimals)
    }
  }, [displayValue, decimals, format, currency, locale, separator])

  return {
    formattedValue,
    displayValue,
    isAnimating,
    startAnimation,
  }
}

/**
 * Animated number component with formatting and easing options
 */
export function AnimatedNumber({
  value,
  from = 0,
  duration = 2000,
  decimals = 0,
  format = "number",
  currency = "USD",
  locale = "en-US",
  easing = "easeOut",
  autoStart = true,
  onComplete,
  className,
  style,
  prefix = "",
  suffix = "",
  useSpring = false,
  springConfig = {},
  separator,
  animateOnHover = false,
  hoverValue,
}: AnimatedNumberProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [animationKey, setAnimationKey] = useState(0)

  const currentValue =
    animateOnHover && isHovered && hoverValue !== undefined ? hoverValue : value

  const { formattedValue, displayValue, isAnimating, startAnimation } =
    useAnimatedNumber(
      currentValue,
      from,
      duration,
      decimals,
      format,
      currency,
      locale,
      easing,
      autoStart,
      useSpring,
      springConfig,
      separator
    )

  // Handle completion callback
  useEffect(() => {
    if (
      !isAnimating &&
      onComplete &&
      Math.abs(displayValue - currentValue) < 0.001
    ) {
      onComplete(displayValue)
    }
  }, [isAnimating, displayValue, currentValue, onComplete])

  // Handle hover animation
  useEffect(() => {
    if (animateOnHover && hoverValue !== undefined) {
      startAnimation()
    }
  }, [isHovered, animateOnHover, hoverValue, startAnimation])

  const handleMouseEnter = () => {
    if (animateOnHover) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    if (animateOnHover) {
      setIsHovered(false)
    }
  }

  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <motion.span
      className={cn("inline-block tabular-nums", className)}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ scale: 1 }}
      animate={
        !prefersReducedMotion && isAnimating
          ? { scale: [1, 1.05, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.3 }}
    >
      {prefix}
      <motion.span
        key={animationKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {formattedValue}
      </motion.span>
      {suffix}
    </motion.span>
  )
}

/**
 * Counter component with increment/decrement controls
 */
export interface AnimatedCounterProps
  extends Omit<AnimatedNumberProps, "value" | "from"> {
  /**
   * Initial value
   */
  initialValue?: number
  /**
   * Minimum value
   */
  min?: number
  /**
   * Maximum value
   */
  max?: number
  /**
   * Step increment
   */
  step?: number
  /**
   * Whether to show controls
   */
  showControls?: boolean
  /**
   * Custom increment button
   */
  incrementButton?: React.ReactNode
  /**
   * Custom decrement button
   */
  decrementButton?: React.ReactNode
  /**
   * Callback when value changes
   */
  onChange?: (value: number) => void
}

export function AnimatedCounter({
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  showControls = true,
  incrementButton,
  decrementButton,
  onChange,
  className,
  ...props
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(initialValue)

  const increment = () => {
    const newValue = Math.min(currentValue + step, max)
    setCurrentValue(newValue)
    onChange?.(newValue)
  }

  const decrement = () => {
    const newValue = Math.max(currentValue - step, min)
    setCurrentValue(newValue)
    onChange?.(newValue)
  }

  if (!showControls) {
    return (
      <AnimatedNumber value={currentValue} className={className} {...props} />
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.button
        onClick={decrement}
        disabled={currentValue <= min}
        className="flex h-8 w-8 items-center justify-center rounded border bg-background hover:bg-accent disabled:opacity-50"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        {decrementButton || "−"}
      </motion.button>

      <AnimatedNumber value={currentValue} {...props} />

      <motion.button
        onClick={increment}
        disabled={currentValue >= max}
        className="flex h-8 w-8 items-center justify-center rounded border bg-background hover:bg-accent disabled:opacity-50"
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
      >
        {incrementButton || "+"}
      </motion.button>
    </div>
  )
}

export default AnimatedNumber
