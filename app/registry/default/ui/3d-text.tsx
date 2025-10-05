"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const text3DVariants = cva(
  [
    "relative inline-block font-bold transform-gpu will-change-transform",
    "before:absolute before:inset-0 before:z-[-1]",
    "after:absolute after:inset-0 after:z-[-2]",
  ],
  {
    variants: {
      variant: {
        extruded: [
          "text-white",
          "before:content-[attr(data-text)] before:text-gray-600 before:translate-x-1 before:translate-y-1",
          "after:content-[attr(data-text)] after:text-gray-700 before:translate-x-2 after:translate-y-2",
        ],
        neon: [
          "text-white",
          "before:content-[attr(data-text)] before:text-purple-500 before:blur-sm before:animate-pulse",
          "after:content-[attr(data-text)] after:text-pink-500 after:blur-md after:animate-pulse after:animation-delay-150",
        ],
        metallic: [
          "bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent",
          "before:content-[attr(data-text)] before:bg-gradient-to-b before:from-gray-400 before:to-gray-700 before:bg-clip-text before:text-transparent before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:bg-gradient-to-b after:from-gray-600 after:to-gray-900 after:bg-clip-text after:text-transparent after:translate-x-1 after:translate-y-1",
        ],
        rainbow: [
          "bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent",
          "before:content-[attr(data-text)] before:bg-gradient-to-r before:from-red-400 before:via-yellow-400 before:via-green-400 before:via-blue-400 before:to-purple-400 before:bg-clip-text before:text-transparent before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:bg-gradient-to-r after:from-red-600 after:via-yellow-600 after:via-green-600 after:via-blue-600 after:to-purple-600 after:bg-clip-text after:text-transparent after:translate-x-1 after:translate-y-1",
        ],
        fire: [
          "bg-gradient-to-t from-red-600 via-orange-500 to-yellow-400 bg-clip-text text-transparent",
          "before:content-[attr(data-text)] before:bg-gradient-to-t before:from-red-700 before:via-orange-600 before:to-yellow-500 before:bg-clip-text before:text-transparent before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:bg-gradient-to-t after:from-red-800 after:via-orange-700 after:to-yellow-600 after:bg-clip-text after:text-transparent after:translate-x-1 after:translate-y-1",
        ],
        ice: [
          "bg-gradient-to-b from-blue-200 via-cyan-300 to-blue-400 bg-clip-text text-transparent",
          "before:content-[attr(data-text)] before:bg-gradient-to-b before:from-blue-300 before:via-cyan-400 before:to-blue-500 before:bg-clip-text before:text-transparent before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:bg-gradient-to-b after:from-blue-400 after:via-cyan-500 after:to-blue-600 after:bg-clip-text after:text-transparent after:translate-x-1 after:translate-y-1",
        ],
        gold: [
          "bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent",
          "before:content-[attr(data-text)] before:bg-gradient-to-b before:from-yellow-300 before:via-yellow-500 before:to-yellow-700 before:bg-clip-text before:text-transparent before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:bg-gradient-to-b after:from-yellow-400 after:via-yellow-600 after:to-yellow-800 after:bg-clip-text after:text-transparent after:translate-x-1 after:translate-y-1",
        ],
        glass: [
          "text-white/90 backdrop-blur-sm",
          "before:content-[attr(data-text)] before:text-white/60 before:blur-[0.5px] before:translate-x-0.5 before:translate-y-0.5",
          "after:content-[attr(data-text)] after:text-white/30 after:blur-[1px] after:translate-x-1 after:translate-y-1",
        ],
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
        "5xl": "text-5xl",
        "6xl": "text-6xl",
      },
      depth: {
        none: "before:translate-x-0 before:translate-y-0 after:translate-x-0 after:translate-y-0",
        sm: "before:translate-x-0.5 before:translate-y-0.5 after:translate-x-1 after:translate-y-1",
        default:
          "before:translate-x-1 before:translate-y-1 after:translate-x-2 after:translate-y-2",
        lg: "before:translate-x-1.5 before:translate-y-1.5 after:translate-x-3 after:translate-y-3",
        xl: "before:translate-x-2 before:translate-y-2 after:translate-x-4 after:translate-y-4",
      },
    },
    defaultVariants: {
      variant: "extruded",
      size: "default",
      depth: "default",
    },
  }
)

interface Text3DProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof text3DVariants> {
  children: React.ReactNode
  animate?: boolean
  rotateOnHover?: boolean
  glowOnHover?: boolean
  pulseAnimation?: boolean
  perspective?: number
}

const Text3D = React.forwardRef<HTMLSpanElement, Text3DProps>(
  (
    {
      className,
      variant,
      size,
      depth,
      children,
      animate = false,
      rotateOnHover = false,
      glowOnHover = false,
      pulseAnimation = false,
      perspective = 1000,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      style,
      ...props
    },
    ref
  ) => {
    const textRef = React.useRef<HTMLSpanElement>(null)
    const [isHovered, setIsHovered] = React.useState(false)
    const [rotateTransform, setRotateTransform] = React.useState({ x: 0, y: 0 })

    const updateRotation = React.useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (!rotateOnHover || !textRef.current) return

        const rect = textRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const deltaX = (e.clientX - centerX) / (rect.width / 2)
        const deltaY = (e.clientY - centerY) / (rect.height / 2)

        setRotateTransform({
          x: deltaY * -15,
          y: deltaX * 15,
        })
      },
      [rotateOnHover]
    )

    const resetRotation = React.useCallback(() => {
      setRotateTransform({ x: 0, y: 0 })
    }, [])

    const handleMouseEnter = React.useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        setIsHovered(true)
        onMouseEnter?.(e)
      },
      [onMouseEnter]
    )

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        setIsHovered(false)
        resetRotation()
        onMouseLeave?.(e)
      },
      [onMouseLeave, resetRotation]
    )

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLSpanElement>) => {
        if (rotateOnHover) {
          updateRotation(e)
        }
        onMouseMove?.(e)
      },
      [onMouseMove, rotateOnHover, updateRotation]
    )

    React.useImperativeHandle(ref, () => textRef.current!)

    const textString = typeof children === "string" ? children : ""

    const textStyle: React.CSSProperties = {
      ...style,
      perspective: `${perspective}px`,
      transform: rotateOnHover
        ? `perspective(${perspective}px) rotateX(${rotateTransform.x}deg) rotateY(${rotateTransform.y}deg)`
        : undefined,
      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      filter:
        glowOnHover && isHovered
          ? "drop-shadow(0 0 20px currentColor) drop-shadow(0 0 40px currentColor)"
          : undefined,
    }

    return (
      <span
        ref={textRef}
        className={cn(
          text3DVariants({ variant, size, depth }),
          animate && "animate-bounce",
          pulseAnimation && "animate-pulse",
          glowOnHover && "transition-all duration-300",
          className
        )}
        style={textStyle}
        data-text={textString}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        {...props}
      >
        {children}
      </span>
    )
  }
)
Text3D.displayName = "Text3D"

// Animated text variants
const Text3DAnimated = React.forwardRef<
  HTMLSpanElement,
  Text3DProps & {
    animationType?: "typewriter" | "wave" | "flip" | "slide"
    duration?: number
    delay?: number
  }
>(
  (
    {
      children,
      animationType = "typewriter",
      duration = 2000,
      delay = 0,
      ...props
    },
    ref
  ) => {
    const [displayText, setDisplayText] = React.useState("")
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const text = typeof children === "string" ? children : ""

    React.useEffect(() => {
      if (animationType === "typewriter") {
        const timer = setTimeout(
          () => {
            if (currentIndex < text.length) {
              setDisplayText((prev) => prev + text[currentIndex])
              setCurrentIndex((prev) => prev + 1)
            }
          },
          delay + (currentIndex * duration) / text.length
        )

        return () => clearTimeout(timer)
      } else {
        setDisplayText(text)
      }
    }, [currentIndex, text, animationType, duration, delay])

    if (animationType === "typewriter") {
      return (
        <Text3D ref={ref} {...props}>
          {displayText}
          <span className="animate-pulse">|</span>
        </Text3D>
      )
    }

    if (animationType === "wave") {
      return (
        <Text3D ref={ref} {...props}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              className="inline-block animate-bounce"
              style={{
                animationDelay: `${delay + index * 100}ms`,
                animationDuration: `${duration}ms`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </Text3D>
      )
    }

    if (animationType === "flip") {
      return (
        <Text3D ref={ref} {...props}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              className="inline-block transition-transform duration-300 hover:rotate-y-180"
              style={{
                transformStyle: "preserve-3d",
                animationDelay: `${delay + index * 50}ms`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </Text3D>
      )
    }

    return (
      <Text3D ref={ref} {...props}>
        {children}
      </Text3D>
    )
  }
)
Text3DAnimated.displayName = "Text3DAnimated"

// Preset text variants
const Text3DPreset = {
  Hero: React.forwardRef<
    HTMLSpanElement,
    Omit<Text3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Text3D
      ref={ref}
      variant="rainbow"
      size="6xl"
      depth="lg"
      rotateOnHover
      glowOnHover
      {...props}
    />
  )),

  Neon: React.forwardRef<
    HTMLSpanElement,
    Omit<Text3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Text3D
      ref={ref}
      variant="neon"
      size="3xl"
      depth="default"
      glowOnHover
      pulseAnimation
      {...props}
    />
  )),

  Metallic: React.forwardRef<
    HTMLSpanElement,
    Omit<Text3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Text3D
      ref={ref}
      variant="metallic"
      size="2xl"
      depth="default"
      rotateOnHover
      {...props}
    />
  )),

  Fire: React.forwardRef<
    HTMLSpanElement,
    Omit<Text3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Text3D
      ref={ref}
      variant="fire"
      size="xl"
      depth="sm"
      glowOnHover
      {...props}
    />
  )),

  Glass: React.forwardRef<
    HTMLSpanElement,
    Omit<Text3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Text3D
      ref={ref}
      variant="glass"
      size="lg"
      depth="sm"
      rotateOnHover
      {...props}
    />
  )),
}

// Assign display names
Text3DPreset.Hero.displayName = "Text3DPreset.Hero"
Text3DPreset.Neon.displayName = "Text3DPreset.Neon"
Text3DPreset.Metallic.displayName = "Text3DPreset.Metallic"
Text3DPreset.Fire.displayName = "Text3DPreset.Fire"
Text3DPreset.Glass.displayName = "Text3DPreset.Glass"

// Text with floating letters effect
const Text3DFloating = React.forwardRef<
  HTMLSpanElement,
  Text3DProps & {
    floatIntensity?: number
    floatSpeed?: number
  }
>(({ children, floatIntensity = 5, floatSpeed = 2, ...props }, ref) => {
  const text = typeof children === "string" ? children : ""

  return (
    <Text3D ref={ref} {...props}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block"
          style={
            {
              animation: `float ${floatSpeed}s ease-in-out infinite`,
              animationDelay: `${index * 0.1}s`,
              "--float-y": `${floatIntensity}px`,
            } as React.CSSProperties
          }
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(var(--float-y, -10px));
          }
        }
      `}</style>
    </Text3D>
  )
})
Text3DFloating.displayName = "Text3DFloating"

export {
  Text3D,
  Text3DAnimated,
  Text3DPreset,
  Text3DFloating,
  text3DVariants,
  type Text3DProps,
}
