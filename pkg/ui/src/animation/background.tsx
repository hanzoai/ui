"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "motion/react"

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

export interface AnimatedBackgroundProps {
  /**
   * Background animation type
   */
  animation?: "gradient" | "blob" | "wave" | "mesh" | "parallax" | "particles"
  /**
   * Animation speed (0.1 - 2.0)
   */
  speed?: number
  /**
   * Color palette for the animation
   */
  colors?: string[]
  /**
   * Whether animation is paused
   */
  paused?: boolean
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Children to render on top
   */
  children?: React.ReactNode
  /**
   * Intensity of the animation (0-1)
   */
  intensity?: number
  /**
   * Whether to blur the background
   */
  blur?: boolean
  /**
   * Blur amount in pixels
   */
  blurAmount?: number
  /**
   * Opacity of the background
   */
  opacity?: number
  /**
   * Number of elements (for blob, particles, etc.)
   */
  elementCount?: number
  /**
   * Custom dimensions
   */
  width?: number | string
  height?: number | string
  /**
   * Whether to cover entire viewport
   */
  fullscreen?: boolean
  /**
   * Parallax layers (for parallax animation)
   */
  parallaxLayers?: Array<{
    speed: number
    color: string
    opacity: number
  }>
}

/**
 * Gradient shifting background
 */
function GradientBackground({
  colors,
  speed,
  intensity,
  paused,
}: {
  colors: string[]
  speed: number
  intensity: number
  paused: boolean
}) {
  const gradientColors =
    colors.length >= 2 ? colors : ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"]

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(-45deg, ${gradientColors.join(", ")})`,
        backgroundSize: "400% 400%",
      }}
      animate={
        paused
          ? {}
          : {
              x: ["0%", "100%", "0%"],
            }
      }
      transition={{
        duration: 10 / speed,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

/**
 * Blob animation background
 */
function BlobBackground({
  colors,
  speed,
  elementCount,
  intensity,
  paused,
}: {
  colors: string[]
  speed: number
  elementCount: number
  intensity: number
  paused: boolean
}) {
  const blobs = useMemo(
    () =>
      Array.from({ length: elementCount }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        size: Math.random() * 200 + 100,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: (Math.random() * 10 + 10) / speed,
      })),
    [elementCount, colors, speed]
  )

  return (
    <div className="absolute inset-0 overflow-hidden">
      {blobs.map((blob) => (
        <motion.div
          key={blob.id}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, ${blob.color}40, transparent)`,
            width: blob.size * intensity,
            height: blob.size * intensity,
            filter: "blur(40px)",
          }}
          initial={{
            x: `${blob.x}%`,
            y: `${blob.y}%`,
          }}
          animate={
            paused
              ? {}
              : {
                  x: [`${blob.x}%`, `${(blob.x + 50) % 100}%`, `${blob.x}%`],
                  y: [`${blob.y}%`, `${(blob.y + 30) % 100}%`, `${blob.y}%`],
                  scale: [1, 1.2, 1],
                }
          }
          transition={{
            duration: blob.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Wave pattern background
 */
function WaveBackground({
  colors,
  speed,
  intensity,
  paused,
}: {
  colors: string[]
  speed: number
  intensity: number
  paused: boolean
}) {
  const waveColor = colors[0] || "#4ecdc4"

  return (
    <div className="absolute inset-0 overflow-hidden">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 100% 50% at center ${50 + index * 20}%, ${waveColor}${Math.round(
              30 * intensity
            )
              .toString(16)
              .padStart(2, "0")}, transparent)`,
          }}
          animate={
            paused
              ? {}
              : {
                  y: [index * 10, index * 10 + 20 * intensity, index * 10],
                }
          }
          transition={{
            duration: (3 + index) / speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Mesh gradient background
 */
function MeshBackground({
  colors,
  speed,
  intensity,
  paused,
}: {
  colors: string[]
  speed: number
  intensity: number
  paused: boolean
}) {
  const meshColors =
    colors.length >= 4
      ? colors.slice(0, 4)
      : ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"]

  return (
    <div className="absolute inset-0 overflow-hidden">
      {meshColors.map((color, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}60, transparent)`,
            width: `${60 + index * 20}%`,
            height: `${60 + index * 20}%`,
            filter: "blur(60px)",
            mixBlendMode: "multiply",
          }}
          initial={{
            x: `${25 + index * 15}%`,
            y: `${25 + index * 15}%`,
          }}
          animate={
            paused
              ? {}
              : {
                  x: [
                    `${25 + index * 15}%`,
                    `${35 + index * 15}%`,
                    `${25 + index * 15}%`,
                  ],
                  y: [
                    `${25 + index * 15}%`,
                    `${15 + index * 15}%`,
                    `${25 + index * 15}%`,
                  ],
                  rotate: [0, 180, 360],
                }
          }
          transition={{
            duration: (8 + index * 2) / speed,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Parallax layers background
 */
function ParallaxBackground({
  layers,
  speed,
  paused,
}: {
  layers: Array<{ speed: number; color: string; opacity: number }>
  speed: number
  paused: boolean
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set((clientX / innerWidth - 0.5) * 100)
      mouseY.set((clientY / innerHeight - 0.5) * 100)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {layers.map((layer, index) => {
        const x = useTransform(
          mouseX,
          [-50, 50],
          [-layer.speed * 10, layer.speed * 10]
        )
        const y = useTransform(
          mouseY,
          [-50, 50],
          [-layer.speed * 10, layer.speed * 10]
        )

        return (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle, ${layer.color}, transparent)`,
              opacity: layer.opacity,
              x: paused ? 0 : x,
              y: paused ? 0 : y,
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * Floating particles background
 */
function ParticlesBackground({
  colors,
  speed,
  elementCount,
  intensity,
  paused,
}: {
  colors: string[]
  speed: number
  elementCount: number
  intensity: number
  paused: boolean
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: elementCount }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        size: Math.random() * 4 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: (Math.random() * 20 + 20) / speed,
        delay: Math.random() * 5,
      })),
    [elementCount, colors, speed]
  )

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            backgroundColor: particle.color,
            width: particle.size * intensity,
            height: particle.size * intensity,
            opacity: 0.6,
          }}
          initial={{
            x: `${particle.x}%`,
            y: `${particle.y}%`,
          }}
          animate={
            paused
              ? {}
              : {
                  y: [`${particle.y}%`, `${particle.y - 100}%`],
                  opacity: [0, 0.6, 0],
                }
          }
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

/**
 * Animated background component with multiple animation types
 */
export function AnimatedBackground({
  animation = "gradient",
  speed = 1,
  colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffeaa7"],
  paused = false,
  className,
  style,
  children,
  intensity = 1,
  blur = false,
  blurAmount = 20,
  opacity = 1,
  elementCount = 5,
  width = "100%",
  height = "100%",
  fullscreen = false,
  parallaxLayers = [
    { speed: 0.5, color: "#ff6b6b50", opacity: 0.3 },
    { speed: 1, color: "#4ecdc450", opacity: 0.4 },
    { speed: 1.5, color: "#45b7d150", opacity: 0.3 },
  ],
}: AnimatedBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const isAnimationPaused = paused || prefersReducedMotion

  const containerStyle = useMemo(
    () => ({
      width: fullscreen ? "100vw" : width,
      height: fullscreen ? "100vh" : height,
      opacity,
      filter: blur ? `blur(${blurAmount}px)` : undefined,
      ...style,
    }),
    [fullscreen, width, height, opacity, blur, blurAmount, style]
  )

  const renderAnimation = () => {
    const props = { colors, speed, intensity, paused: isAnimationPaused }

    switch (animation) {
      case "blob":
        return <BlobBackground {...props} elementCount={elementCount} />
      case "wave":
        return <WaveBackground {...props} />
      case "mesh":
        return <MeshBackground {...props} />
      case "parallax":
        return (
          <ParallaxBackground
            layers={parallaxLayers}
            speed={speed}
            paused={isAnimationPaused}
          />
        )
      case "particles":
        return <ParticlesBackground {...props} elementCount={elementCount} />
      default:
        return <GradientBackground {...props} />
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fullscreen && "fixed inset-0 z-0",
        className
      )}
      style={containerStyle}
    >
      {renderAnimation()}

      {children && (
        <div className="relative z-10 h-full w-full">{children}</div>
      )}
    </div>
  )
}

/**
 * Preset animated background variations
 */
export const AnimatedBackgroundPresets = {
  /**
   * Calm gradient flow
   */
  CalmGradient: (
    props: Omit<AnimatedBackgroundProps, "animation" | "colors" | "speed">
  ) => (
    <AnimatedBackground
      animation="gradient"
      colors={["#667eea", "#764ba2", "#f093fb", "#f5576c"]}
      speed={0.5}
      {...props}
    />
  ),

  /**
   * Ocean waves
   */
  OceanWaves: (
    props: Omit<AnimatedBackgroundProps, "animation" | "colors">
  ) => (
    <AnimatedBackground
      animation="wave"
      colors={["#0093E9", "#80D0C7"]}
      {...props}
    />
  ),

  /**
   * Floating bubbles
   */
  FloatingBubbles: (
    props: Omit<
      AnimatedBackgroundProps,
      "animation" | "colors" | "elementCount"
    >
  ) => (
    <AnimatedBackground
      animation="blob"
      colors={["#667eea", "#764ba2", "#f093fb"]}
      elementCount={8}
      {...props}
    />
  ),

  /**
   * Cosmic mesh
   */
  CosmicMesh: (
    props: Omit<AnimatedBackgroundProps, "animation" | "colors">
  ) => (
    <AnimatedBackground
      animation="mesh"
      colors={["#667eea", "#764ba2", "#f093fb", "#f5576c"]}
      {...props}
    />
  ),

  /**
   * Starfield particles
   */
  Starfield: (
    props: Omit<
      AnimatedBackgroundProps,
      "animation" | "colors" | "elementCount"
    >
  ) => (
    <AnimatedBackground
      animation="particles"
      colors={["#ffffff", "#f0f0f0", "#e0e0e0"]}
      elementCount={50}
      intensity={0.5}
      {...props}
    />
  ),

  /**
   * Aurora parallax
   */
  Aurora: (
    props: Omit<AnimatedBackgroundProps, "animation" | "parallaxLayers">
  ) => (
    <AnimatedBackground
      animation="parallax"
      parallaxLayers={[
        { speed: 0.3, color: "#00ff8850", opacity: 0.4 },
        { speed: 0.6, color: "#0080ff50", opacity: 0.3 },
        { speed: 0.9, color: "#8000ff50", opacity: 0.3 },
        { speed: 1.2, color: "#ff008050", opacity: 0.2 },
      ]}
      {...props}
    />
  ),
}

export default AnimatedBackground
