"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { motion, useAnimation, useInView, Variants } from "motion/react"

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

export interface RevealAnimationProps {
  /**
   * Children to animate
   */
  children: React.ReactNode
  /**
   * Animation direction
   */
  direction?: "up" | "down" | "left" | "right" | "fade" | "scale" | "rotate"
  /**
   * Animation duration in milliseconds
   */
  duration?: number
  /**
   * Delay before animation starts in milliseconds
   */
  delay?: number
  /**
   * Distance for directional animations
   */
  distance?: number
  /**
   * Whether to stagger children animations
   */
  staggerChildren?: boolean
  /**
   * Stagger delay between children in milliseconds
   */
  staggerDelay?: number
  /**
   * Intersection threshold (0-1)
   */
  threshold?: number
  /**
   * Root margin for intersection observer
   */
  rootMargin?: string
  /**
   * Whether animation should trigger once or every time
   */
  triggerOnce?: boolean
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Callback when animation starts
   */
  onAnimationStart?: () => void
  /**
   * Callback when animation completes
   */
  onAnimationComplete?: () => void
  /**
   * Custom variants for complex animations
   */
  customVariants?: Variants
  /**
   * Whether to use viewport detection or custom trigger
   */
  useViewport?: boolean
  /**
   * Manual trigger (when useViewport is false)
   */
  trigger?: boolean
  /**
   * Easing function
   */
  easing?:
    | "linear"
    | "easeIn"
    | "easeOut"
    | "easeInOut"
    | "circIn"
    | "circOut"
    | "circInOut"
    | "backIn"
    | "backOut"
    | "backInOut"
  /**
   * Whether to animate on scroll
   */
  animateOnScroll?: boolean
  /**
   * Scroll animation progress (0-1)
   */
  scrollProgress?: number
}

const easingFunctions = {
  linear: [0, 0, 1, 1],
  easeIn: [0.42, 0, 1, 1],
  easeOut: [0, 0, 0.58, 1],
  easeInOut: [0.42, 0, 0.58, 1],
  circIn: [0.6, 0.04, 0.98, 0.335],
  circOut: [0.075, 0.82, 0.165, 1],
  circInOut: [0.785, 0.135, 0.15, 0.86],
  backIn: [0.6, -0.28, 0.735, 0.045],
  backOut: [0.175, 0.885, 0.32, 1.275],
  backInOut: [0.68, -0.55, 0.265, 1.55],
} as const

const directionVariants = {
  up: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  down: {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  },
  left: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  right: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  rotate: {
    hidden: { opacity: 0, rotate: -10, scale: 0.9 },
    visible: { opacity: 1, rotate: 0, scale: 1 },
  },
}

/**
 * Custom hook for scroll-based animations
 */
function useScrollAnimation(animateOnScroll: boolean, scrollProgress?: number) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!animateOnScroll) return

    if (scrollProgress !== undefined) {
      setProgress(scrollProgress)
      return
    }

    const handleScroll = () => {
      const scrolled = window.scrollY
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrolled / maxScroll, 1)
      setProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [animateOnScroll, scrollProgress])

  return progress
}

/**
 * Custom hook for intersection-based reveal
 */
function useRevealAnimation(
  threshold: number,
  rootMargin: string,
  triggerOnce: boolean,
  useViewport: boolean,
  manualTrigger?: boolean
) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    threshold,
    margin: rootMargin,
    once: triggerOnce,
  })
  const controls = useAnimation()

  const [hasTriggered, setHasTriggered] = useState(false)

  useEffect(() => {
    if (!useViewport && manualTrigger !== undefined) {
      if (manualTrigger && !hasTriggered) {
        controls.start("visible")
        setHasTriggered(true)
      } else if (!manualTrigger && !triggerOnce) {
        controls.start("hidden")
      }
      return
    }

    if (useViewport) {
      if (isInView) {
        controls.start("visible")
        setHasTriggered(true)
      } else if (!triggerOnce && hasTriggered) {
        controls.start("hidden")
      }
    }
  }, [
    isInView,
    controls,
    useViewport,
    manualTrigger,
    triggerOnce,
    hasTriggered,
  ])

  return { ref, controls, isInView: useViewport ? isInView : manualTrigger }
}

/**
 * Reveal animation component with scroll and intersection triggers
 */
export function RevealAnimation({
  children,
  direction = "up",
  duration = 600,
  delay = 0,
  distance = 50,
  staggerChildren = false,
  staggerDelay = 100,
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  className,
  style,
  onAnimationStart,
  onAnimationComplete,
  customVariants,
  useViewport = true,
  trigger,
  easing = "easeOut",
  animateOnScroll = false,
  scrollProgress,
}: RevealAnimationProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  const { ref, controls, isInView } = useRevealAnimation(
    threshold,
    rootMargin,
    triggerOnce,
    useViewport,
    trigger
  )

  const scrollAnimationProgress = useScrollAnimation(
    animateOnScroll,
    scrollProgress
  )

  // Skip animations if reduced motion is preferred
  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set("visible")
    }
  }, [prefersReducedMotion, controls])

  const variants = customVariants || {
    ...directionVariants[direction],
    hidden: {
      ...directionVariants[direction].hidden,
      ...(direction === "up" && { y: distance }),
      ...(direction === "down" && { y: -distance }),
      ...(direction === "left" && { x: distance }),
      ...(direction === "right" && { x: -distance }),
    },
  }

  const containerVariants: Variants = staggerChildren
    ? {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay / 1000,
            delayChildren: delay / 1000,
          },
        },
      }
    : variants

  const childVariants: Variants = staggerChildren ? variants : {}

  const transition = {
    duration: duration / 1000,
    delay: staggerChildren ? 0 : delay / 1000,
    ease: easingFunctions[easing] as any,
  }

  // Handle scroll-based animation
  useEffect(() => {
    if (animateOnScroll) {
      const progress = scrollAnimationProgress
      if (progress > 0) {
        controls.start("visible")
      } else {
        controls.start("hidden")
      }
    }
  }, [animateOnScroll, scrollAnimationProgress, controls])

  const handleAnimationStart = () => {
    onAnimationStart?.()
  }

  const handleAnimationComplete = () => {
    onAnimationComplete?.()
  }

  const renderChildren = () => {
    if (!staggerChildren) {
      return children
    }

    return React.Children.map(children, (child, index) => (
      <motion.div
        key={index}
        variants={childVariants}
        transition={{
          ...transition,
          delay: index * (staggerDelay / 1000),
        }}
        onAnimationStart={index === 0 ? handleAnimationStart : undefined}
        onAnimationComplete={
          index === React.Children.count(children) - 1
            ? handleAnimationComplete
            : undefined
        }
      >
        {child}
      </motion.div>
    ))
  }

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      style={style}
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      transition={transition}
      onAnimationStart={!staggerChildren ? handleAnimationStart : undefined}
      onAnimationComplete={
        !staggerChildren ? handleAnimationComplete : undefined
      }
    >
      {renderChildren()}
    </motion.div>
  )
}

/**
 * Multiple reveal animations for complex layouts
 */
export function RevealGroup({
  children,
  staggerDelay = 200,
  ...props
}: {
  children: React.ReactNode
  staggerDelay?: number
} & Omit<RevealAnimationProps, "children" | "staggerChildren">) {
  return (
    <div>
      {React.Children.map(children, (child, index) => (
        <RevealAnimation key={index} delay={index * staggerDelay} {...props}>
          {child}
        </RevealAnimation>
      ))}
    </div>
  )
}

/**
 * Scroll-triggered reveal with progress
 */
export function ScrollReveal({
  children,
  startOffset = 0,
  endOffset = 1,
  ...props
}: {
  children: React.ReactNode
  startOffset?: number
  endOffset?: number
} & Omit<RevealAnimationProps, "children" | "animateOnScroll">) {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return

      const element = ref.current
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight

      const elementTop = rect.top
      const elementHeight = rect.height

      const startPoint = windowHeight * (1 - startOffset)
      const endPoint = -elementHeight * endOffset

      const progress = Math.max(
        0,
        Math.min(1, (startPoint - elementTop) / (startPoint - endPoint))
      )
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener("scroll", handleScroll)
  }, [startOffset, endOffset])

  return (
    <div ref={ref}>
      <RevealAnimation
        animateOnScroll
        scrollProgress={scrollProgress}
        {...props}
      >
        {children}
      </RevealAnimation>
    </div>
  )
}

/**
 * Preset reveal animation variations
 */
export const RevealPresets = {
  /**
   * Gentle fade up
   */
  FadeUp: (props: Omit<RevealAnimationProps, "direction" | "easing">) => (
    <RevealAnimation direction="up" easing="easeOut" {...props} />
  ),

  /**
   * Bouncy scale
   */
  BounceScale: (props: Omit<RevealAnimationProps, "direction" | "easing">) => (
    <RevealAnimation
      direction="scale"
      easing="backOut"
      duration={800}
      {...props}
    />
  ),

  /**
   * Staggered list reveal
   */
  StaggerList: (
    props: Omit<RevealAnimationProps, "staggerChildren" | "direction">
  ) => (
    <RevealAnimation
      direction="up"
      staggerChildren
      staggerDelay={150}
      {...props}
    />
  ),

  /**
   * Slide from left
   */
  SlideLeft: (props: Omit<RevealAnimationProps, "direction" | "distance">) => (
    <RevealAnimation direction="left" distance={100} {...props} />
  ),

  /**
   * Rotate reveal
   */
  RotateReveal: (props: Omit<RevealAnimationProps, "direction" | "easing">) => (
    <RevealAnimation
      direction="rotate"
      easing="backOut"
      duration={1000}
      {...props}
    />
  ),

  /**
   * Progressive scroll reveal
   */
  ScrollProgressive: (props: Omit<RevealAnimationProps, "animateOnScroll">) => (
    <RevealAnimation animateOnScroll useViewport={false} {...props} />
  ),
}

export default RevealAnimation
