"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const button3DVariants = cva(
  [
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium",
    "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
    "transform-gpu will-change-transform active:scale-95",
    "before:absolute before:inset-0 before:rounded-md before:transition-all before:duration-150",
    "after:absolute after:inset-0 after:rounded-md after:transition-all after:duration-150",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground shadow-md hover:bg-primary/90",
          "before:bg-gradient-to-t before:from-primary/80 before:to-primary before:translate-y-1 before:shadow-lg",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
        ],
        destructive: [
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
          "before:bg-gradient-to-t before:from-destructive/80 before:to-destructive before:translate-y-1 before:shadow-lg",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
        ],
        outline: [
          "border border-input bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground",
          "before:bg-gradient-to-t before:from-muted/50 before:to-background before:translate-y-1 before:border before:border-input",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
        ],
        secondary: [
          "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/80",
          "before:bg-gradient-to-t before:from-secondary/80 before:to-secondary before:translate-y-1 before:shadow-lg",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
        ],
        ghost: [
          "text-foreground hover:bg-accent hover:text-accent-foreground",
          "before:bg-gradient-to-t before:from-accent/30 before:to-accent/10 before:translate-y-1 before:opacity-0",
          "hover:before:opacity-100 hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/10 after:to-transparent after:opacity-0",
          "hover:after:opacity-50",
        ],
        link: [
          "text-primary underline-offset-4 hover:underline",
          "before:hidden after:hidden",
        ],
        neon: [
          "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg",
          "before:bg-gradient-to-t before:from-purple-600 before:to-pink-600 before:translate-y-1 before:shadow-lg",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/30 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
          "hover:shadow-purple-500/25 hover:shadow-2xl",
        ],
        glass: [
          "bg-white/10 backdrop-blur-md border border-white/20 text-foreground shadow-lg",
          "before:bg-gradient-to-t before:from-white/5 before:to-white/20 before:translate-y-1 before:backdrop-blur-md before:border before:border-white/20",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/30 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
        ],
        gradient: [
          "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg",
          "before:bg-gradient-to-t before:from-blue-600 before:via-purple-600 before:to-pink-600 before:translate-y-1 before:shadow-lg",
          "hover:before:translate-y-0.5 active:before:translate-y-0",
          "after:bg-gradient-to-b after:from-white/20 after:to-transparent after:opacity-0",
          "hover:after:opacity-100",
          "hover:bg-gradient-to-r hover:from-blue-400 hover:via-purple-400 hover:to-pink-400",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
      },
      depth: {
        none: "before:translate-y-0",
        sm: "before:translate-y-0.5 hover:before:translate-y-0 active:before:translate-y-0",
        default:
          "before:translate-y-1 hover:before:translate-y-0.5 active:before:translate-y-0",
        lg: "before:translate-y-1.5 hover:before:translate-y-0.5 active:before:translate-y-0",
        xl: "before:translate-y-2 hover:before:translate-y-1 active:before:translate-y-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      depth: "default",
    },
  }
)

interface Button3DProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button3DVariants> {
  asChild?: boolean
  tiltOnHover?: boolean
  glowIntensity?: number
  shadowColor?: string
  pressAnimation?: boolean
}

const Button3D = React.forwardRef<HTMLButtonElement, Button3DProps>(
  (
    {
      className,
      variant,
      size,
      depth,
      tiltOnHover = false,
      glowIntensity = 0,
      shadowColor,
      pressAnimation = true,
      children,
      onMouseEnter,
      onMouseLeave,
      onMouseMove,
      onMouseDown,
      onMouseUp,
      style,
      ...props
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isPressed, setIsPressed] = React.useState(false)
    const [tiltTransform, setTiltTransform] = React.useState({ x: 0, y: 0 })

    const updateTilt = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!tiltOnHover || !buttonRef.current) return

        const rect = buttonRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const deltaX = (e.clientX - centerX) / (rect.width / 2)
        const deltaY = (e.clientY - centerY) / (rect.height / 2)

        setTiltTransform({
          x: deltaY * -10, // Inverted for more natural feel
          y: deltaX * 10,
        })
      },
      [tiltOnHover]
    )

    const resetTilt = React.useCallback(() => {
      setTiltTransform({ x: 0, y: 0 })
    }, [])

    const handleMouseEnter = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsHovered(true)
        onMouseEnter?.(e)
      },
      [onMouseEnter]
    )

    const handleMouseLeave = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsHovered(false)
        resetTilt()
        onMouseLeave?.(e)
      },
      [onMouseLeave, resetTilt]
    )

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (tiltOnHover) {
          updateTilt(e)
        }
        onMouseMove?.(e)
      },
      [onMouseMove, tiltOnHover, updateTilt]
    )

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (pressAnimation) {
          setIsPressed(true)
        }
        onMouseDown?.(e)
      },
      [onMouseDown, pressAnimation]
    )

    const handleMouseUp = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsPressed(false)
        onMouseUp?.(e)
      },
      [onMouseUp]
    )

    React.useImperativeHandle(ref, () => buttonRef.current!)

    const buttonStyle: React.CSSProperties = {
      ...style,
      transform: tiltOnHover
        ? `perspective(1000px) rotateX(${tiltTransform.x}deg) rotateY(${tiltTransform.y}deg) ${isPressed ? "translateY(1px)" : ""}`
        : isPressed
          ? "translateY(1px)"
          : undefined,
      filter:
        glowIntensity > 0
          ? `drop-shadow(0 0 ${glowIntensity * 4}px ${shadowColor || "currentColor"})`
          : undefined,
      transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    }

    return (
      <button
        ref={buttonRef}
        className={cn(button3DVariants({ variant, size, depth }), className)}
        style={buttonStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    )
  }
)
Button3D.displayName = "Button3D"

// Preset button variants for common use cases
const Button3DPreset = {
  Hero: React.forwardRef<
    HTMLButtonElement,
    Omit<Button3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Button3D
      ref={ref}
      variant="gradient"
      size="xl"
      depth="lg"
      tiltOnHover
      glowIntensity={2}
      {...props}
    />
  )),

  CTA: React.forwardRef<
    HTMLButtonElement,
    Omit<Button3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Button3D
      ref={ref}
      variant="neon"
      size="lg"
      depth="default"
      tiltOnHover
      glowIntensity={1}
      {...props}
    />
  )),

  Glass: React.forwardRef<
    HTMLButtonElement,
    Omit<Button3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Button3D
      ref={ref}
      variant="glass"
      size="default"
      depth="sm"
      tiltOnHover
      {...props}
    />
  )),

  Minimal: React.forwardRef<
    HTMLButtonElement,
    Omit<Button3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Button3D ref={ref} variant="ghost" size="default" depth="sm" {...props} />
  )),

  Danger: React.forwardRef<
    HTMLButtonElement,
    Omit<Button3DProps, "variant" | "size" | "depth">
  >((props, ref) => (
    <Button3D
      ref={ref}
      variant="destructive"
      size="default"
      depth="default"
      shadowColor="rgb(239 68 68)"
      {...props}
    />
  )),
}

// Assign display names
Button3DPreset.Hero.displayName = "Button3DPreset.Hero"
Button3DPreset.CTA.displayName = "Button3DPreset.CTA"
Button3DPreset.Glass.displayName = "Button3DPreset.Glass"
Button3DPreset.Minimal.displayName = "Button3DPreset.Minimal"
Button3DPreset.Danger.displayName = "Button3DPreset.Danger"

// Loading button with 3D spinner
const Button3DLoading = React.forwardRef<
  HTMLButtonElement,
  Button3DProps & { loading?: boolean }
>(({ loading = false, children, disabled, ...props }, ref) => {
  return (
    <Button3D ref={ref} disabled={disabled || loading} {...props}>
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
      )}
      {!loading && children}
    </Button3D>
  )
})
Button3DLoading.displayName = "Button3DLoading"

export {
  Button3D,
  Button3DPreset,
  Button3DLoading,
  button3DVariants,
  type Button3DProps,
}
