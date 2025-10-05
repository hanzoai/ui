"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
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

export interface AnimatedTextProps {
  /**
   * Text to animate
   */
  text: string
  /**
   * Animation type
   */
  animation?:
    | "typewriter"
    | "wordReveal"
    | "letterShuffle"
    | "gradient"
    | "glitch"
  /**
   * Animation duration in milliseconds
   */
  duration?: number
  /**
   * Delay between characters/words in milliseconds
   */
  delay?: number
  /**
   * Whether to repeat the animation
   */
  repeat?: boolean
  /**
   * Repeat delay in milliseconds
   */
  repeatDelay?: number
  /**
   * Whether to start animation automatically
   */
  autoStart?: boolean
  /**
   * Callback when animation completes
   */
  onComplete?: () => void
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Gradient colors for gradient animation
   */
  gradientColors?: string[]
  /**
   * Glitch intensity (0-1)
   */
  glitchIntensity?: number
  /**
   * Cursor character for typewriter
   */
  cursor?: string
  /**
   * Whether to show cursor
   */
  showCursor?: boolean
}

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut",
    },
  }),
}

const wordVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
}

const glitchVariants: Variants = {
  glitch: {
    x: [0, -2, 2, -1, 1, 0],
    filter: [
      "hue-rotate(0deg)",
      "hue-rotate(90deg)",
      "hue-rotate(180deg)",
      "hue-rotate(270deg)",
      "hue-rotate(0deg)",
    ],
    transition: {
      duration: 0.2,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
}

/**
 * Generate random characters for shuffle effect
 */
function getRandomChar(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  return chars[Math.floor(Math.random() * chars.length)]
}

/**
 * Typewriter animation hook
 */
function useTypewriter(text: string, speed: number, autoStart: boolean) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const startAnimation = useCallback(() => {
    setDisplayText("")
    setCurrentIndex(0)
    setIsComplete(false)
  }, [])

  useEffect(() => {
    if (!autoStart) return
    startAnimation()
  }, [text, autoStart, startAnimation])

  useEffect(() => {
    if (currentIndex < text.length && !isComplete) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    } else if (currentIndex >= text.length) {
      setIsComplete(true)
    }
  }, [currentIndex, text, speed, isComplete])

  return { displayText, isComplete, startAnimation }
}

/**
 * Letter shuffle animation hook
 */
function useLetterShuffle(text: string, duration: number, autoStart: boolean) {
  const [displayText, setDisplayText] = useState(text)
  const [isAnimating, setIsAnimating] = useState(false)

  const startAnimation = useCallback(() => {
    setIsAnimating(true)
    let iterations = 0
    const maxIterations = text.length

    const interval = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((char, index) => {
            if (index < iterations) {
              return text[index]
            }
            return char === " " ? " " : getRandomChar()
          })
          .join("")
      )

      if (iterations >= maxIterations) {
        clearInterval(interval)
        setDisplayText(text)
        setIsAnimating(false)
      }

      iterations += 1 / 3
    }, duration / maxIterations)

    // Store interval ref for cleanup
    const currentInterval = interval
    return () => clearInterval(currentInterval)
  }, [text, duration])

  useEffect(() => {
    if (autoStart) {
      startAnimation()
    }
  }, [autoStart, startAnimation])

  return { displayText, isAnimating, startAnimation }
}

/**
 * Animated text component with multiple animation types
 */
export function AnimatedText({
  text,
  animation = "typewriter",
  duration = 2000,
  delay = 50,
  repeat = false,
  repeatDelay = 1000,
  autoStart = true,
  onComplete,
  className,
  style,
  gradientColors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
  glitchIntensity = 0.5,
  cursor = "|",
  showCursor = true,
}: AnimatedTextProps) {
  const [animationKey, setAnimationKey] = useState(0)
  const [showGradient, setShowGradient] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  // Disable animations if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion && autoStart

  const {
    displayText: typewriterText,
    isComplete: typewriterComplete,
    startAnimation: startTypewriter,
  } = useTypewriter(text, delay, shouldAnimate && animation === "typewriter")
  const {
    displayText: shuffleText,
    isAnimating: shuffleAnimating,
    startAnimation: startShuffle,
  } = useLetterShuffle(
    text,
    duration,
    shouldAnimate && animation === "letterShuffle"
  )

  // Handle repeat animation
  useEffect(() => {
    if (!repeat) return

    let timer: NodeJS.Timeout

    if (animation === "typewriter" && typewriterComplete) {
      timer = setTimeout(() => {
        startTypewriter()
      }, repeatDelay)
    } else if (animation === "letterShuffle" && !shuffleAnimating) {
      timer = setTimeout(() => {
        startShuffle()
      }, repeatDelay)
    } else if (["wordReveal", "gradient", "glitch"].includes(animation)) {
      timer = setTimeout(() => {
        setAnimationKey((prev) => prev + 1)
      }, duration + repeatDelay)
    }

    return () => clearTimeout(timer)
  }, [
    animation,
    typewriterComplete,
    shuffleAnimating,
    repeat,
    repeatDelay,
    duration,
    startTypewriter,
    startShuffle,
  ])

  // Handle completion callback
  useEffect(() => {
    if (!onComplete) return

    if (animation === "typewriter" && typewriterComplete) {
      onComplete()
    } else if (
      animation === "letterShuffle" &&
      !shuffleAnimating &&
      displayText === text
    ) {
      onComplete()
    }
  }, [
    animation,
    typewriterComplete,
    shuffleAnimating,
    onComplete,
    displayText,
    text,
  ])

  // Gradient animation effect
  useEffect(() => {
    if (animation === "gradient") {
      setShowGradient(true)
      const timer = setTimeout(() => setShowGradient(false), duration)
      return () => clearTimeout(timer)
    }
  }, [animation, duration, animationKey])

  const gradientStyle = useMemo(() => {
    if (animation !== "gradient" || !showGradient) return {}

    return {
      background: `linear-gradient(-45deg, ${gradientColors.join(", ")})`,
      backgroundSize: "400% 400%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: `gradientShift ${duration}ms ease-in-out infinite`,
    }
  }, [animation, showGradient, gradientColors, duration])

  const renderContent = () => {
    // Show final text immediately if reduced motion is preferred
    if (prefersReducedMotion) {
      return <span>{text}</span>
    }

    switch (animation) {
      case "typewriter":
        return (
          <span className="relative">
            {typewriterText}
            {showCursor && (
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-1"
              >
                {cursor}
              </motion.span>
            )}
          </span>
        )

      case "wordReveal":
        return (
          <motion.div
            key={animationKey}
            className="flex flex-wrap gap-1"
            initial="hidden"
            animate="visible"
            onAnimationComplete={() => onComplete?.()}
          >
            {text.split(" ").map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={wordVariants}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.div>
        )

      case "letterShuffle":
        return <span>{shuffleText}</span>

      case "gradient":
        return (
          <motion.span
            key={animationKey}
            style={gradientStyle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={() => onComplete?.()}
          >
            {text}
          </motion.span>
        )

      case "glitch":
        return (
          <motion.div
            key={animationKey}
            className="relative"
            onAnimationComplete={() => onComplete?.()}
          >
            <motion.span
              variants={glitchVariants}
              animate="glitch"
              style={{
                textShadow: `${glitchIntensity * 2}px 0 #ff0000, ${-glitchIntensity * 2}px 0 #00ffff`,
              }}
            >
              {text}
            </motion.span>
            <motion.span
              className="absolute inset-0 opacity-80"
              variants={glitchVariants}
              animate="glitch"
              style={{
                color: "#ff0000",
                left: `${glitchIntensity}px`,
                mixBlendMode: "multiply",
              }}
            >
              {text}
            </motion.span>
            <motion.span
              className="absolute inset-0 opacity-80"
              variants={glitchVariants}
              animate="glitch"
              style={{
                color: "#00ffff",
                left: `${-glitchIntensity}px`,
                mixBlendMode: "multiply",
              }}
            >
              {text}
            </motion.span>
          </motion.div>
        )

      default:
        return text
    }
  }

  return (
    <>
      {animation === "gradient" && (
        <style jsx>{`
          @keyframes gradientShift {
            0%,
            100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
        `}</style>
      )}
      <div className={cn("inline-block", className)} style={style}>
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </div>
    </>
  )
}

export default AnimatedText
