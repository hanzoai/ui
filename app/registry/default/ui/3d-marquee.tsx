"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

const marquee3DVariants = cva(
  [
    "relative overflow-hidden whitespace-nowrap",
    "transform-gpu will-change-transform",
    "[perspective:1000px]",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-background text-foreground",
          "[&_.marquee-content]:text-current",
        ],
        neon: [
          "bg-black text-cyan-400",
          "[&_.marquee-content]:text-cyan-400",
          "[&_.marquee-content]:drop-shadow-[0_0_10px_currentColor]",
          "[&_.marquee-content]:animate-pulse",
        ],
        rainbow: [
          "bg-black",
          "[&_.marquee-content]:bg-gradient-to-r [&_.marquee-content]:from-red-500 [&_.marquee-content]:via-yellow-500 [&_.marquee-content]:via-green-500 [&_.marquee-content]:via-blue-500 [&_.marquee-content]:to-purple-500",
          "[&_.marquee-content]:bg-clip-text [&_.marquee-content]:text-transparent",
        ],
        metallic: [
          "bg-slate-900",
          "[&_.marquee-content]:bg-gradient-to-b [&_.marquee-content]:from-gray-200 [&_.marquee-content]:via-gray-400 [&_.marquee-content]:to-gray-600",
          "[&_.marquee-content]:bg-clip-text [&_.marquee-content]:text-transparent",
        ],
        fire: [
          "bg-black",
          "[&_.marquee-content]:bg-gradient-to-t [&_.marquee-content]:from-red-600 [&_.marquee-content]:via-orange-500 [&_.marquee-content]:to-yellow-400",
          "[&_.marquee-content]:bg-clip-text [&_.marquee-content]:text-transparent",
          "[&_.marquee-content]:drop-shadow-[0_0_20px_#ff6600]",
        ],
        glass: [
          "bg-white/10 backdrop-blur-sm",
          "[&_.marquee-content]:text-white/90",
          "[&_.marquee-content]:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]",
        ],
      },
      size: {
        sm: "h-8 text-sm [&_.marquee-content]:py-1",
        default: "h-12 text-base [&_.marquee-content]:py-2",
        lg: "h-16 text-lg [&_.marquee-content]:py-3",
        xl: "h-20 text-xl [&_.marquee-content]:py-4",
        "2xl": "h-24 text-2xl [&_.marquee-content]:py-5",
        "3xl": "h-32 text-3xl [&_.marquee-content]:py-6",
      },
      direction: {
        left: "",
        right: "",
        up: "flex-col",
        down: "flex-col",
      },
      perspective: {
        none: "[perspective:none]",
        sm: "[perspective:500px]",
        default: "[perspective:1000px]",
        lg: "[perspective:1500px]",
        xl: "[perspective:2000px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      direction: "left",
      perspective: "default",
    },
  }
)

interface Marquee3DProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof marquee3DVariants> {
  children: React.ReactNode
  speed?: number
  pauseOnHover?: boolean
  reverse?: boolean
  repeat?: number
  gap?: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  autoFill?: boolean
  gradient?: boolean
  gradientColor?: string
  gradientWidth?: number
}

const Marquee3D = React.forwardRef<HTMLDivElement, Marquee3DProps>(
  (
    {
      className,
      variant,
      size,
      direction = "left",
      perspective,
      children,
      speed = 50,
      pauseOnHover = false,
      reverse = false,
      repeat = 5,
      gap = 0,
      rotateX = 0,
      rotateY = 0,
      rotateZ = 0,
      autoFill = false,
      gradient = false,
      gradientColor = "#ffffff",
      gradientWidth = 200,
      style,
      ...props
    },
    ref
  ) => {
    const [containerWidth, setContainerWidth] = React.useState(0)
    const [contentWidth, setContentWidth] = React.useState(0)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)

    // Measure container and content dimensions
    React.useEffect(() => {
      const measureDimensions = () => {
        if (containerRef.current && contentRef.current) {
          const containerRect = containerRef.current.getBoundingClientRect()
          const contentRect = contentRef.current.getBoundingClientRect()

          if (direction === "left" || direction === "right") {
            setContainerWidth(containerRect.width)
            setContentWidth(contentRect.width)
          } else {
            setContainerWidth(containerRect.height)
            setContentWidth(contentRect.height)
          }
        }
      }

      measureDimensions()
      window.addEventListener("resize", measureDimensions)
      return () => window.removeEventListener("resize", measureDimensions)
    }, [direction, children])

    // Calculate animation duration based on speed and content width
    const duration = React.useMemo(() => {
      if (contentWidth === 0) return 20
      return contentWidth / speed
    }, [contentWidth, speed])

    // Calculate number of repeats needed for smooth infinite scroll
    const actualRepeat = React.useMemo(() => {
      if (autoFill && containerWidth > 0 && contentWidth > 0) {
        return Math.ceil(containerWidth / contentWidth) + 2
      }
      return repeat
    }, [autoFill, containerWidth, contentWidth, repeat])

    // Animation variants for different directions
    const getAnimationProps = () => {
      const isVertical = direction === "up" || direction === "down"
      const distance = contentWidth + gap

      let animateProps: any = {}

      if (direction === "left") {
        animateProps = {
          x: reverse ? [distance, -distance] : [-distance, distance],
        }
      } else if (direction === "right") {
        animateProps = {
          x: reverse ? [-distance, distance] : [distance, -distance],
        }
      } else if (direction === "up") {
        animateProps = {
          y: reverse ? [distance, -distance] : [-distance, distance],
        }
      } else if (direction === "down") {
        animateProps = {
          y: reverse ? [-distance, distance] : [distance, -distance],
        }
      }

      return {
        animate: animateProps,
        transition: {
          duration,
          ease: "linear",
          repeat: Infinity,
        },
      }
    }

    // 3D transform style
    const transform3D = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`

    // Gradient mask style
    const gradientMask = gradient
      ? {
          maskImage: `linear-gradient(to right, transparent, ${gradientColor} ${gradientWidth}px, ${gradientColor} calc(100% - ${gradientWidth}px), transparent)`,
          WebkitMaskImage: `linear-gradient(to right, transparent, ${gradientColor} ${gradientWidth}px, ${gradientColor} calc(100% - ${gradientWidth}px), transparent)`,
        }
      : {}

    return (
      <div
        ref={containerRef}
        className={cn(
          marquee3DVariants({ variant, size, direction, perspective }),
          "flex items-center",
          direction === "up" || direction === "down" ? "flex-col" : "flex-row",
          className
        )}
        style={{
          ...style,
          transform: transform3D,
          ...gradientMask,
        }}
        {...props}
      >
        <motion.div
          ref={contentRef}
          className={cn(
            "marquee-content flex shrink-0 font-bold",
            direction === "up" || direction === "down"
              ? "flex-col"
              : "flex-row",
            pauseOnHover && "hover:[animation-play-state:paused]"
          )}
          style={{
            gap: `${gap}px`,
          }}
          {...getAnimationProps()}
        >
          {Array.from({ length: actualRepeat }).map((_, index) => (
            <React.Fragment key={index}>
              <div
                className={cn(
                  "flex shrink-0 items-center justify-center",
                  direction === "up" || direction === "down"
                    ? "flex-col"
                    : "flex-row"
                )}
                style={{
                  transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                {children}
              </div>
              {index < actualRepeat - 1 && gap > 0 && (
                <div
                  style={{
                    width:
                      direction === "up" || direction === "down"
                        ? "100%"
                        : `${gap}px`,
                    height:
                      direction === "up" || direction === "down"
                        ? `${gap}px`
                        : "100%",
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    )
  }
)
Marquee3D.displayName = "Marquee3D"

// Preset marquee variants
const Marquee3DPreset = {
  Hero: React.forwardRef<
    HTMLDivElement,
    Omit<Marquee3DProps, "variant" | "size">
  >((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="rainbow"
      size="3xl"
      speed={30}
      rotateX={-10}
      gradient
      {...props}
    />
  )),

  Neon: React.forwardRef<
    HTMLDivElement,
    Omit<Marquee3DProps, "variant" | "size">
  >((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="neon"
      size="xl"
      speed={40}
      rotateY={5}
      pauseOnHover
      {...props}
    />
  )),

  Metallic: React.forwardRef<
    HTMLDivElement,
    Omit<Marquee3DProps, "variant" | "size">
  >((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="metallic"
      size="lg"
      speed={35}
      rotateX={-5}
      rotateY={2}
      gradient
      gradientColor="#c4c4c4"
      {...props}
    />
  )),

  Fire: React.forwardRef<
    HTMLDivElement,
    Omit<Marquee3DProps, "variant" | "size">
  >((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="fire"
      size="2xl"
      speed={60}
      rotateZ={1}
      gradient
      gradientColor="#ff6600"
      {...props}
    />
  )),

  Glass: React.forwardRef<
    HTMLDivElement,
    Omit<Marquee3DProps, "variant" | "size">
  >((props, ref) => (
    <Marquee3D
      ref={ref}
      variant="glass"
      size="lg"
      speed={25}
      rotateX={-8}
      pauseOnHover
      gradient
      gradientColor="rgba(255,255,255,0.9)"
      {...props}
    />
  )),
}

// Assign display names
Marquee3DPreset.Hero.displayName = "Marquee3DPreset.Hero"
Marquee3DPreset.Neon.displayName = "Marquee3DPreset.Neon"
Marquee3DPreset.Metallic.displayName = "Marquee3DPreset.Metallic"
Marquee3DPreset.Fire.displayName = "Marquee3DPreset.Fire"
Marquee3DPreset.Glass.displayName = "Marquee3DPreset.Glass"

// Marquee with floating 3D text effect
const Marquee3DFloating = React.forwardRef<
  HTMLDivElement,
  Marquee3DProps & {
    floatIntensity?: number
    floatSpeed?: number
  }
>(({ children, floatIntensity = 10, floatSpeed = 3, ...props }, ref) => {
  const text = typeof children === "string" ? children : ""

  return (
    <Marquee3D ref={ref} {...props}>
      {text ? (
        <div className="flex space-x-1">
          {text.split("").map((char, index) => (
            <motion.span
              key={index}
              className="inline-block"
              animate={{
                y: [0, -floatIntensity, 0],
                rotateX: [0, 5, 0],
                rotateY: [0, 2, 0],
              }}
              transition={{
                duration: floatSpeed,
                ease: "easeInOut",
                repeat: Infinity,
                delay: index * 0.1,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </div>
      ) : (
        children
      )}
    </Marquee3D>
  )
})
Marquee3DFloating.displayName = "Marquee3DFloating"

export {
  Marquee3D,
  Marquee3DPreset,
  Marquee3DFloating,
  marquee3DVariants,
  type Marquee3DProps,
}
