"use client"

import React, { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, Variants } from "motion/react"

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

export interface AnimatedIconProps {
  /**
   * Icon type for built-in icons or SVG paths
   */
  icon?:
    | "loading"
    | "heart"
    | "star"
    | "hamburger"
    | "arrow"
    | "check"
    | "x"
    | "custom"
  /**
   * Custom SVG path or paths for morphing
   */
  paths?: string | string[]
  /**
   * Animation type
   */
  animation?: "spin" | "pulse" | "bounce" | "morph" | "draw" | "hover" | "click"
  /**
   * Icon size
   */
  size?: number | string
  /**
   * Icon color
   */
  color?: string
  /**
   * Animation duration in milliseconds
   */
  duration?: number
  /**
   * Whether to animate automatically
   */
  autoAnimate?: boolean
  /**
   * Whether animation should repeat
   */
  repeat?: boolean
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void
  /**
   * Callback when icon is clicked
   */
  onClick?: () => void
  /**
   * Whether icon is interactive
   */
  interactive?: boolean
  /**
   * Hover animation type
   */
  hoverAnimation?: "scale" | "rotate" | "glow" | "shake"
  /**
   * Click animation type
   */
  clickAnimation?: "scale" | "rotate" | "ripple"
  /**
   * Custom variants for complex animations
   */
  customVariants?: Variants
  /**
   * SVG viewBox
   */
  viewBox?: string
  /**
   * Stroke width for SVG paths
   */
  strokeWidth?: number
  /**
   * Whether to show loading state
   */
  loading?: boolean
  /**
   * Progress value for progress-based animations (0-1)
   */
  progress?: number
}

// Built-in icon paths
const iconPaths = {
  loading:
    "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
  heart: [
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  ],
  star: "m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z",
  hamburger: ["M3 12h18M3 6h18M3 18h18", "m6 6 12 12M6 18 18 6"],
  arrow: "M5 12l14 0m-7 -7l7 7l-7 7",
  check: "m9 12 2 2 4-4",
  x: "m18 6-12 12M6 6l12 12",
}

const animationVariants: { [key: string]: Variants } = {
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  pulse: {
    animate: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
  draw: {
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: { duration: 2, ease: "easeInOut" },
  },
  hover: {
    whileHover: { scale: 1.1 },
    transition: { duration: 0.2 },
  },
}

const hoverVariants = {
  scale: { scale: 1.2 },
  rotate: { rotate: 15 },
  glow: { filter: "drop-shadow(0 0 8px currentColor)" },
  shake: { x: [-2, 2, -2, 2, 0] },
}

const clickVariants = {
  scale: { scale: 0.9 },
  rotate: { rotate: 180 },
  ripple: { scale: [1, 1.3, 1] },
}

/**
 * Path morphing animation component
 */
function MorphingPath({
  paths,
  duration,
  strokeWidth = 2,
  autoAnimate,
  repeat,
  onComplete,
}: {
  paths: string[]
  duration: number
  strokeWidth: number
  autoAnimate: boolean
  repeat: boolean
  onComplete?: () => void
}) {
  const [currentPathIndex, setCurrentPathIndex] = useState(0)

  useEffect(() => {
    if (!autoAnimate || paths.length < 2) return

    const interval = setInterval(() => {
      setCurrentPathIndex((prev) => {
        const next = (prev + 1) % paths.length
        if (next === 0 && !repeat) {
          clearInterval(interval)
          onComplete?.()
        }
        return next
      })
    }, duration)

    return () => clearInterval(interval)
  }, [autoAnimate, paths.length, duration, repeat, onComplete])

  return (
    <motion.path
      d={paths[currentPathIndex]}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ d: paths[currentPathIndex] }}
      transition={{ duration: duration / 1000, ease: "easeInOut" }}
    />
  )
}

/**
 * Progressive drawing animation
 */
function DrawingPath({
  path,
  duration,
  strokeWidth = 2,
  progress,
  autoAnimate,
}: {
  path: string
  duration: number
  strokeWidth: number
  progress?: number
  autoAnimate: boolean
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pathLength, setPathLength] = useState(0)

  useEffect(() => {
    if (pathRef.current) {
      const length = pathRef.current.getTotalLength()
      setPathLength(length)
    }
  }, [path])

  const animatedLength =
    progress !== undefined ? pathLength * progress : pathLength

  return (
    <motion.path
      ref={pathRef}
      d={path}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={
        autoAnimate
          ? { pathLength: 1 }
          : { pathLength: animatedLength / pathLength }
      }
      transition={{ duration: duration / 1000, ease: "easeInOut" }}
      style={{
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength - animatedLength,
      }}
    />
  )
}

/**
 * Loading spinner component
 */
function LoadingSpinner({
  size,
  strokeWidth = 2,
}: {
  size: number | string
  strokeWidth: number
}) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style={{ width: size, height: size }}
    >
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="60 40"
          opacity="0.3"
        />
      </svg>
    </motion.div>
  )
}

/**
 * Animated icon component with multiple animation types
 */
export function AnimatedIcon({
  icon = "loading",
  paths,
  animation = "spin",
  size = 24,
  color = "currentColor",
  duration = 1000,
  autoAnimate = true,
  repeat = true,
  className,
  style,
  onAnimationComplete,
  onClick,
  interactive = true,
  hoverAnimation = "scale",
  clickAnimation = "scale",
  customVariants,
  viewBox = "0 0 24 24",
  strokeWidth = 2,
  loading = false,
  progress,
}: AnimatedIconProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  const variants = customVariants || animationVariants[animation] || {}
  const shouldAnimate = autoAnimate && !prefersReducedMotion

  // Get icon paths
  const getIconPaths = () => {
    if (paths) {
      return Array.isArray(paths) ? paths : [paths]
    }

    const builtInPath = iconPaths[icon as keyof typeof iconPaths]
    return Array.isArray(builtInPath) ? builtInPath : [builtInPath]
  }

  const iconPathsArray = getIconPaths()

  const handleClick = () => {
    if (!interactive) return

    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 200)
    onClick?.()
  }

  const getHoverVariant = () => {
    if (!interactive || !isHovered) return {}
    return hoverVariants[hoverAnimation] || {}
  }

  const getClickVariant = () => {
    if (!interactive || !isClicked) return {}
    return clickVariants[clickAnimation] || {}
  }

  if (loading) {
    return <LoadingSpinner size={size} strokeWidth={strokeWidth} />
  }

  const renderIcon = () => {
    if (animation === "morph" && iconPathsArray.length > 1) {
      return (
        <MorphingPath
          paths={iconPathsArray}
          duration={duration}
          strokeWidth={strokeWidth}
          autoAnimate={shouldAnimate}
          repeat={repeat}
          onComplete={onAnimationComplete}
        />
      )
    }

    if (animation === "draw") {
      return (
        <DrawingPath
          path={iconPathsArray[0]}
          duration={duration}
          strokeWidth={strokeWidth}
          progress={progress}
          autoAnimate={shouldAnimate}
        />
      )
    }

    return iconPathsArray.map((path, index) => (
      <motion.path
        key={index}
        d={path}
        fill={icon === "heart" ? "currentColor" : "none"}
        stroke={icon === "heart" ? "none" : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(animation === "draw" ? animationVariants.draw : {})}
      />
    ))
  }

  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center",
        interactive && "cursor-pointer",
        className
      )}
      style={{
        width: size,
        height: size,
        color,
        ...style,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      variants={variants}
      animate={shouldAnimate ? "animate" : "initial"}
      whileHover={!prefersReducedMotion ? getHoverVariant() : {}}
      whileTap={!prefersReducedMotion ? getClickVariant() : {}}
      onAnimationComplete={onAnimationComplete}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <AnimatePresence mode="wait">{renderIcon()}</AnimatePresence>
      </svg>
    </motion.div>
  )
}

/**
 * Preset animated icon variations
 */
export const AnimatedIconPresets = {
  /**
   * Spinning loading indicator
   */
  Spinner: (props: Omit<AnimatedIconProps, "icon" | "animation">) => (
    <AnimatedIcon icon="loading" animation="spin" {...props} />
  ),

  /**
   * Pulsing heart
   */
  HeartBeat: (props: Omit<AnimatedIconProps, "icon" | "animation">) => (
    <AnimatedIcon icon="heart" animation="pulse" color="#ef4444" {...props} />
  ),

  /**
   * Morphing hamburger to X
   */
  MenuToggle: (props: Omit<AnimatedIconProps, "icon" | "animation">) => (
    <AnimatedIcon icon="hamburger" animation="morph" {...props} />
  ),

  /**
   * Drawing checkmark
   */
  CheckDraw: (props: Omit<AnimatedIconProps, "icon" | "animation">) => (
    <AnimatedIcon icon="check" animation="draw" color="#10b981" {...props} />
  ),

  /**
   * Bouncing star
   */
  BounceStar: (props: Omit<AnimatedIconProps, "icon" | "animation">) => (
    <AnimatedIcon icon="star" animation="bounce" color="#fbbf24" {...props} />
  ),

  /**
   * Interactive arrow
   */
  HoverArrow: (props: Omit<AnimatedIconProps, "icon" | "hoverAnimation">) => (
    <AnimatedIcon icon="arrow" hoverAnimation="scale" interactive {...props} />
  ),
}

export default AnimatedIcon
