"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface AnimatedCursorProps {
  /**
   * Whether the cursor is visible
   */
  isVisible?: boolean
  /**
   * Cursor size in pixels
   */
  size?: number
  /**
   * Main cursor color
   */
  color?: string
  /**
   * Trail cursor color
   */
  trailColor?: string
  /**
   * Animation duration in milliseconds
   */
  animationDuration?: number
  /**
   * Whether to show trail effect
   */
  showTrail?: boolean
  /**
   * Number of trail elements
   */
  trailLength?: number
  /**
   * Blend mode for cursor
   */
  blendMode?:
    | "normal"
    | "multiply"
    | "screen"
    | "overlay"
    | "darken"
    | "lighten"
    | "color-dodge"
    | "color-burn"
    | "hard-light"
    | "soft-light"
    | "difference"
    | "exclusion"
  /**
   * Scale factor on hover
   */
  hoverScale?: number
  /**
   * Whether to hide on touch devices
   */
  hideOnTouch?: boolean
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Click animation duration
   */
  clickAnimationDuration?: number
  /**
   * Z-index for cursor
   */
  zIndex?: number
}

export interface CursorPosition {
  x: number
  y: number
}

export interface CursorState {
  position: CursorPosition
  isHovering: boolean
  isClicking: boolean
  cursorType: "default" | "pointer" | "text" | "grab" | "grabbing"
}

const INTERACTIVE_SELECTORS = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
  ".cursor-pointer",
  '[data-cursor="pointer"]',
].join(", ")

const TEXT_SELECTORS = [
  'input[type="text"]',
  'input[type="email"]',
  'input[type="password"]',
  'input[type="search"]',
  "textarea",
  '[contenteditable="true"]',
  '[data-cursor="text"]',
].join(", ")

const GRAB_SELECTORS = ['[data-cursor="grab"]', ".cursor-grab"].join(", ")

const GRABBING_SELECTORS = [
  '[data-cursor="grabbing"]',
  ".cursor-grabbing",
].join(", ")

/**
 * Detects if the device supports touch
 */
function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  )
}

/**
 * Custom hook for managing cursor state
 */
function useCursorState() {
  const [cursorState, setCursorState] = useState<CursorState>({
    position: { x: 0, y: 0 },
    isHovering: false,
    isClicking: false,
    cursorType: "default",
  })

  const updatePosition = useCallback((x: number, y: number) => {
    setCursorState((prev) => ({
      ...prev,
      position: { x, y },
    }))
  }, [])

  const updateHoverState = useCallback(
    (
      isHovering: boolean,
      cursorType: CursorState["cursorType"] = "default"
    ) => {
      setCursorState((prev) => ({
        ...prev,
        isHovering,
        cursorType,
      }))
    },
    []
  )

  const updateClickState = useCallback((isClicking: boolean) => {
    setCursorState((prev) => ({
      ...prev,
      isClicking,
    }))
  }, [])

  return {
    cursorState,
    updatePosition,
    updateHoverState,
    updateClickState,
  }
}

/**
 * Custom hook for managing cursor trail
 */
function useCursorTrail(trailLength: number, position: CursorPosition) {
  const [trail, setTrail] = useState<CursorPosition[]>([])
  const trailRef = useRef<CursorPosition[]>([])

  useEffect(() => {
    trailRef.current.push(position)

    if (trailRef.current.length > trailLength) {
      trailRef.current.shift()
    }

    setTrail([...trailRef.current])
  }, [position, trailLength])

  return trail
}

/**
 * AnimatedCursor component providing customizable animated cursor with trail effects
 */
export function AnimatedCursor({
  isVisible = true,
  size = 20,
  color = "#000000",
  trailColor = "#00000050",
  animationDuration = 200,
  showTrail = true,
  trailLength = 8,
  blendMode = "normal",
  hoverScale = 1.5,
  hideOnTouch = true,
  className,
  clickAnimationDuration = 100,
  zIndex = 9999,
}: AnimatedCursorProps) {
  const { cursorState, updatePosition, updateHoverState, updateClickState } =
    useCursorState()

  const trail = useCursorTrail(trailLength, cursorState.position)
  const [isTouch, setIsTouch] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check for touch device on mount
  useEffect(() => {
    setIsTouch(isTouchDevice())
    setMounted(true)
  }, [])

  // Mouse move handler
  useEffect(() => {
    if (!mounted || (hideOnTouch && isTouch)) return

    const handleMouseMove = (e: MouseEvent) => {
      try {
        requestAnimationFrame(() => {
          updatePosition(e.clientX, e.clientY)
        })
      } catch (error) {
        console.warn("AnimatedCursor: Error updating position", error)
      }
    }

    const handleMouseOver = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement

        if (target?.closest?.(INTERACTIVE_SELECTORS)) {
          updateHoverState(true, "pointer")
        } else if (target?.closest?.(TEXT_SELECTORS)) {
          updateHoverState(true, "text")
        } else if (target?.closest?.(GRAB_SELECTORS)) {
          updateHoverState(true, "grab")
        } else if (target?.closest?.(GRABBING_SELECTORS)) {
          updateHoverState(true, "grabbing")
        } else {
          updateHoverState(false, "default")
        }
      } catch (error) {
        console.warn("AnimatedCursor: Error handling mouse over", error)
        updateHoverState(false, "default")
      }
    }

    const handleMouseDown = () => {
      updateClickState(true)
    }

    const handleMouseUp = () => {
      updateClickState(false)
    }

    const handleMouseLeave = () => {
      updateHoverState(false, "default")
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseover", handleMouseOver)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseover", handleMouseOver)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [
    mounted,
    hideOnTouch,
    isTouch,
    updatePosition,
    updateHoverState,
    updateClickState,
  ])

  // Hide default cursor
  useEffect(() => {
    if (!mounted || (hideOnTouch && isTouch)) return

    try {
      const originalCursor = document.body.style.cursor
      document.body.style.cursor = "none"

      return () => {
        try {
          document.body.style.cursor = originalCursor
        } catch (error) {
          console.warn("AnimatedCursor: Error restoring cursor style", error)
        }
      }
    } catch (error) {
      console.warn("AnimatedCursor: Error hiding cursor", error)
    }
  }, [mounted, hideOnTouch, isTouch])

  // Don't render on server or touch devices (if hideOnTouch is true)
  if (!mounted || !isVisible || (hideOnTouch && isTouch)) {
    return null
  }

  const currentScale = cursorState.isHovering ? hoverScale : 1
  const clickScale = cursorState.isClicking ? 0.8 : 1
  const finalScale = currentScale * clickScale

  const getCursorShape = () => {
    switch (cursorState.cursorType) {
      case "text":
        return "h-6 w-0.5"
      case "grab":
      case "grabbing":
        return "rounded-md"
      default:
        return "rounded-full"
    }
  }

  return (
    <div className={cn("pointer-events-none fixed inset-0", className)}>
      {/* Trail */}
      {showTrail &&
        trail.map((point, index) => {
          const opacity = ((index + 1) / trail.length) * 0.5
          const scale = ((index + 1) / trail.length) * 0.8

          return (
            <div
              key={index}
              className="absolute"
              style={{
                left: point.x - size / 2,
                top: point.y - size / 2,
                width: size,
                height: size,
                backgroundColor: trailColor,
                borderRadius: "50%",
                opacity,
                transform: `scale(${scale})`,
                zIndex: zIndex - index - 1,
                mixBlendMode: blendMode,
              }}
            />
          )
        })}

      {/* Main cursor */}
      <div
        className={cn(
          "absolute transition-transform duration-100 ease-out",
          getCursorShape()
        )}
        style={{
          left: cursorState.position.x - size / 2,
          top: cursorState.position.y - size / 2,
          width: cursorState.cursorType === "text" ? 2 : size,
          height: cursorState.cursorType === "text" ? 24 : size,
          backgroundColor: color,
          transform: `scale(${finalScale})`,
          transitionDuration: `${animationDuration}ms`,
          zIndex,
          mixBlendMode: blendMode,
        }}
      />

      {/* Hover ring */}
      {cursorState.isHovering && cursorState.cursorType !== "text" && (
        <div
          className="absolute rounded-full border-2 transition-all duration-200 ease-out"
          style={{
            left: cursorState.position.x - (size * hoverScale) / 2,
            top: cursorState.position.y - (size * hoverScale) / 2,
            width: size * hoverScale,
            height: size * hoverScale,
            borderColor: color,
            opacity: 0.3,
            zIndex: zIndex - 1,
            mixBlendMode: blendMode,
          }}
        />
      )}
    </div>
  )
}

export default AnimatedCursor
