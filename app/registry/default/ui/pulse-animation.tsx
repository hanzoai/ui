"use client"

import React, { useEffect, useState } from "react"
import { motion, Variants } from "motion/react"

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

export interface PulseAnimationProps {
  /**
   * Children to animate
   */
  children?: React.ReactNode
  /**
   * Pulse intensity (0.1 - 2.0)
   */
  intensity?: number
  /**
   * Pulse duration in milliseconds
   */
  duration?: number
  /**
   * Number of pulse repetitions (0 for infinite)
   */
  repeat?: number
  /**
   * Delay between pulses in milliseconds
   */
  repeatDelay?: number
  /**
   * Pulse color variations
   */
  color?: string
  /**
   * Background color for pulse effect
   */
  backgroundColor?: string
  /**
   * Size scaling during pulse
   */
  scale?: number
  /**
   * Whether to show ring effect
   */
  showRing?: boolean
  /**
   * Number of ring layers
   */
  ringLayers?: number
  /**
   * Ring opacity
   */
  ringOpacity?: number
  /**
   * Whether animation is active
   */
  active?: boolean
  /**
   * Pulse shape
   */
  shape?: "circle" | "square" | "rounded"
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Whether to pulse on hover
   */
  pulseOnHover?: boolean
  /**
   * Whether to pulse on click
   */
  pulseOnClick?: boolean
  /**
   * Animation easing
   */
  easing?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "bounce"
  /**
   * Callback when pulse completes
   */
  onPulseComplete?: () => void
  /**
   * Callback when clicked (if pulseOnClick is true)
   */
  onClick?: () => void
  /**
   * Size of the pulse container
   */
  size?: number | string
  /**
   * Whether to show glow effect
   */
  showGlow?: boolean
  /**
   * Glow intensity
   */
  glowIntensity?: number
  /**
   * Custom variants for complex animations
   */
  customVariants?: Variants
  /**
   * Pulse pattern type
   */
  pattern?: "steady" | "heartbeat" | "notification" | "breathing" | "rapid"
}

const easingFunctions = {
  linear: "linear",
  easeIn: "easeIn",
  easeOut: "easeOut",
  easeInOut: "easeInOut",
  bounce: "easeOut",
}

const pulsePatterns = {
  steady: {
    scale: [1, 1.1, 1],
    opacity: [0.7, 1, 0.7],
    duration: 1.5,
    repeatType: "loop" as const,
  },
  heartbeat: {
    scale: [1, 1.05, 1, 1.15, 1],
    opacity: [0.7, 0.9, 0.8, 1, 0.7],
    duration: 1.2,
    repeatType: "loop" as const,
  },
  notification: {
    scale: [1, 1.2, 1.1, 1.3, 1],
    opacity: [0.8, 1, 0.9, 1, 0.8],
    duration: 0.8,
    repeatType: "loop" as const,
  },
  breathing: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    duration: 3,
    repeatType: "loop" as const,
  },
  rapid: {
    scale: [1, 1.08, 1],
    opacity: [0.8, 1, 0.8],
    duration: 0.5,
    repeatType: "loop" as const,
  },
}

/**
 * Ring pulse effect component
 */
function PulseRings({
  layers,
  color,
  opacity,
  size,
  shape,
  duration,
  active,
  easing,
}: {
  layers: number
  color: string
  opacity: number
  size: number | string
  shape: "circle" | "square" | "rounded"
  duration: number
  active: boolean
  easing: string
}) {
  const getShapeClasses = () => {
    switch (shape) {
      case "circle":
        return "rounded-full"
      case "square":
        return "rounded-none"
      case "rounded":
        return "rounded-lg"
      default:
        return "rounded-full"
    }
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: layers }, (_, i) => (
        <motion.div
          key={i}
          className={cn("absolute border-2", getShapeClasses())}
          style={{
            borderColor: color,
            width: size,
            height: size,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
          animate={
            active
              ? {
                  scale: [1, 1.5 + i * 0.2],
                  opacity: [opacity, 0],
                }
              : {}
          }
          transition={{
            duration: duration / 1000,
            delay: i * 0.1,
            repeat: Infinity,
            ease: easing,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Glow effect component
 */
function PulseGlow({
  color,
  intensity,
  size,
  shape,
  active,
  duration,
  easing,
}: {
  color: string
  intensity: number
  size: number | string
  shape: "circle" | "square" | "rounded"
  active: boolean
  duration: number
  easing: string
}) {
  const getShapeClasses = () => {
    switch (shape) {
      case "circle":
        return "rounded-full"
      case "square":
        return "rounded-none"
      case "rounded":
        return "rounded-lg"
      default:
        return "rounded-full"
    }
  }

  return (
    <motion.div
      className={cn("absolute inset-0 pointer-events-none", getShapeClasses())}
      style={{
        background: `radial-gradient(circle, ${color}40, transparent)`,
        filter: `blur(${intensity * 10}px)`,
        width: size,
        height: size,
      }}
      animate={
        active
          ? {
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.7, 0.3],
            }
          : {}
      }
      transition={{
        duration: duration / 1000,
        repeat: Infinity,
        ease: easing,
      }}
    />
  )
}

/**
 * Pulse animation component with customizable effects
 */
export function PulseAnimation({
  children,
  intensity = 1,
  duration = 1500,
  repeat = 0,
  repeatDelay = 0,
  color = "#3b82f6",
  backgroundColor,
  scale = 1.1,
  showRing = true,
  ringLayers = 3,
  ringOpacity = 0.6,
  active = true,
  shape = "circle",
  className,
  style,
  pulseOnHover = false,
  pulseOnClick = false,
  easing = "easeOut",
  onPulseComplete,
  onClick,
  size = "100%",
  showGlow = false,
  glowIntensity = 1,
  customVariants,
  pattern = "steady",
}: PulseAnimationProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [pulseCount, setPulseCount] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const isActive =
    active &&
    (!pulseOnHover || isHovered) &&
    (!pulseOnClick || isClicked) &&
    !prefersReducedMotion

  const patternConfig = pulsePatterns[pattern]
  const variants = customVariants || {
    pulse: {
      scale: patternConfig.scale.map(
        (s) => s * (1 + (intensity - 1) * (scale - 1))
      ),
      opacity: patternConfig.opacity,
      transition: {
        duration: (duration / 1000) * (patternConfig.duration / 1.5),
        repeat: repeat === 0 ? Infinity : repeat - 1,
        repeatType: patternConfig.repeatType,
        repeatDelay: repeatDelay / 1000,
        ease: easingFunctions[easing],
      },
    },
    idle: {
      scale: 1,
      opacity: 1,
    },
  }

  useEffect(() => {
    if (repeat > 0 && isActive) {
      const timer = setTimeout(() => {
        setPulseCount((prev) => prev + 1)
        if (pulseCount + 1 >= repeat) {
          onPulseComplete?.()
        }
      }, duration + repeatDelay)

      return () => clearTimeout(timer)
    }
  }, [pulseCount, repeat, duration, repeatDelay, isActive, onPulseComplete])

  const handleClick = () => {
    if (pulseOnClick) {
      setIsClicked(true)
      setTimeout(() => setIsClicked(false), duration)
    }
    onClick?.()
  }

  const getShapeClasses = () => {
    switch (shape) {
      case "circle":
        return "rounded-full"
      case "square":
        return "rounded-none"
      case "rounded":
        return "rounded-lg"
      default:
        return "rounded-full"
    }
  }

  return (
    <motion.div
      className={cn(
        "relative inline-flex items-center justify-center",
        pulseOnHover && "cursor-pointer",
        pulseOnClick && "cursor-pointer",
        getShapeClasses(),
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor,
        ...style,
      }}
      variants={variants}
      animate={isActive ? "pulse" : "idle"}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      onAnimationComplete={() => {
        if (repeat > 0 && pulseCount >= repeat - 1) {
          onPulseComplete?.()
        }
      }}
    >
      {/* Glow effect */}
      {showGlow && isActive && (
        <PulseGlow
          color={color}
          intensity={glowIntensity}
          size={size}
          shape={shape}
          active={isActive}
          duration={duration}
          easing={easingFunctions[easing]}
        />
      )}

      {/* Ring effects */}
      {showRing && isActive && (
        <PulseRings
          layers={ringLayers}
          color={color}
          opacity={ringOpacity}
          size={size}
          shape={shape}
          duration={duration}
          active={isActive}
          easing={easingFunctions[easing]}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  )
}

/**
 * Attention-grabbing dot pulse
 */
export function PulseDot({
  color = "#ef4444",
  size = 12,
  ...props
}: Omit<PulseAnimationProps, "children" | "size"> & {
  size?: number
}) {
  return (
    <PulseAnimation
      size={size}
      color={color}
      shape="circle"
      pattern="notification"
      showRing
      ringLayers={2}
      {...props}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </PulseAnimation>
  )
}

/**
 * Heartbeat pulse indicator
 */
export function HeartbeatPulse({
  color = "#ef4444",
  ...props
}: Omit<PulseAnimationProps, "pattern">) {
  return (
    <PulseAnimation
      pattern="heartbeat"
      color={color}
      showGlow
      glowIntensity={0.8}
      {...props}
    />
  )
}

/**
 * Breathing pulse effect
 */
export function BreathingPulse({
  color = "#3b82f6",
  ...props
}: Omit<PulseAnimationProps, "pattern">) {
  return (
    <PulseAnimation
      pattern="breathing"
      color={color}
      intensity={0.7}
      showGlow
      glowIntensity={1.2}
      {...props}
    />
  )
}

/**
 * Preset pulse animation variations
 */
export const PulsePresets = {
  /**
   * Notification indicator
   */
  Notification: (props: Omit<PulseAnimationProps, "pattern" | "showRing">) => (
    <PulseDot pattern="notification" showRing {...props} />
  ),

  /**
   * Loading pulse
   */
  Loading: (props: Omit<PulseAnimationProps, "pattern" | "shape">) => (
    <PulseAnimation pattern="steady" shape="circle" showGlow {...props} />
  ),

  /**
   * Alert pulse
   */
  Alert: (
    props: Omit<PulseAnimationProps, "color" | "pattern" | "intensity">
  ) => (
    <PulseAnimation
      color="#ef4444"
      pattern="rapid"
      intensity={1.5}
      showRing
      showGlow
      {...props}
    />
  ),

  /**
   * Success pulse
   */
  Success: (props: Omit<PulseAnimationProps, "color" | "pattern">) => (
    <PulseAnimation
      color="#10b981"
      pattern="breathing"
      showGlow
      glowIntensity={0.8}
      repeat={3}
      {...props}
    />
  ),

  /**
   * Interactive button pulse
   */
  Button: (props: Omit<PulseAnimationProps, "pulseOnHover" | "shape">) => (
    <PulseAnimation
      pulseOnHover
      shape="rounded"
      pattern="steady"
      intensity={1.2}
      {...props}
    />
  ),

  /**
   * Avatar status pulse
   */
  Status: (
    props: Omit<PulseAnimationProps, "shape" | "showRing" | "ringLayers">
  ) => (
    <PulseAnimation
      shape="circle"
      showRing
      ringLayers={2}
      pattern="breathing"
      {...props}
    />
  ),
}

export default PulseAnimation
