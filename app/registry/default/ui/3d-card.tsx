"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface Point {
  x: number
  y: number
}

interface Card3DProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxTilt?: number
  perspective?: number
  scale?: number
  speed?: number
  glare?: boolean
  glareMaxOpacity?: number
  className?: string
}

const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  (
    {
      children,
      maxTilt = 15,
      perspective = 1000,
      scale = 1.05,
      speed = 400,
      glare = true,
      glareMaxOpacity = 0.7,
      className,
      ...props
    },
    ref
  ) => {
    const cardRef = React.useRef<HTMLDivElement>(null)
    const glareRef = React.useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = React.useState(false)
    const [transforms, setTransforms] = React.useState({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      glareX: 50,
      glareY: 50,
      glareOpacity: 0,
    })

    const updateTransforms = React.useCallback(
      (point: Point | null, rect: DOMRect | null) => {
        if (!point || !rect) {
          setTransforms({
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            glareX: 50,
            glareY: 50,
            glareOpacity: 0,
          })
          return
        }

        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const deltaX = (point.x - centerX) / (rect.width / 2)
        const deltaY = (point.y - centerY) / (rect.height / 2)

        const rotateX = -deltaY * maxTilt
        const rotateY = deltaX * maxTilt

        const glareX = ((point.x - rect.left) / rect.width) * 100
        const glareY = ((point.y - rect.top) / rect.height) * 100

        setTransforms({
          rotateX,
          rotateY,
          scale,
          glareX,
          glareY,
          glareOpacity: glare ? glareMaxOpacity : 0,
        })
      },
      [maxTilt, scale, glare, glareMaxOpacity]
    )

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent) => {
        if (!cardRef.current) return

        const rect = cardRef.current.getBoundingClientRect()
        const point = { x: e.clientX, y: e.clientY }
        updateTransforms(point, rect)
      },
      [updateTransforms]
    )

    const handleTouchMove = React.useCallback(
      (e: React.TouchEvent) => {
        if (!cardRef.current || e.touches.length === 0) return

        e.preventDefault()
        const rect = cardRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        const point = { x: touch.clientX, y: touch.clientY }
        updateTransforms(point, rect)
      },
      [updateTransforms]
    )

    const handleMouseEnter = React.useCallback(() => {
      setIsHovered(true)
    }, [])

    const handleMouseLeave = React.useCallback(() => {
      setIsHovered(false)
      updateTransforms(null, null)
    }, [updateTransforms])

    const handleTouchStart = React.useCallback(() => {
      setIsHovered(true)
    }, [])

    const handleTouchEnd = React.useCallback(() => {
      setIsHovered(false)
      updateTransforms(null, null)
    }, [updateTransforms])

    const cardStyle: React.CSSProperties = {
      transform: `perspective(${perspective}px) rotateX(${transforms.rotateX}deg) rotateY(${transforms.rotateY}deg) scale(${transforms.scale})`,
      transition: isHovered
        ? "none"
        : `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
      transformStyle: "preserve-3d",
    }

    const glareStyle: React.CSSProperties = {
      background: `radial-gradient(circle at ${transforms.glareX}% ${transforms.glareY}%, rgba(255,255,255,${transforms.glareOpacity}) 0%, transparent 50%)`,
      transition: isHovered ? "none" : `opacity ${speed}ms ease-out`,
    }

    React.useImperativeHandle(ref, () => cardRef.current!)

    return (
      <div
        ref={cardRef}
        className={cn(
          "relative rounded-lg border bg-card text-card-foreground shadow-lg cursor-pointer",
          "transform-gpu will-change-transform",
          className
        )}
        style={cardStyle}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}
      >
        {/* Content Layer */}
        <div className="relative z-10">{children}</div>

        {/* Glare Effect */}
        {glare && (
          <div
            ref={glareRef}
            className="absolute inset-0 rounded-lg pointer-events-none z-20"
            style={glareStyle}
          />
        )}
      </div>
    )
  }
)
Card3D.displayName = "Card3D"

// Depth layer components that work with 3D transforms
const Card3DHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { depth?: number }
>(({ className, depth = 20, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    style={{
      transform: `translateZ(${depth}px)`,
      ...style,
    }}
    {...props}
  />
))
Card3DHeader.displayName = "Card3DHeader"

const Card3DTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & { depth?: number }
>(({ className, depth = 30, style, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    style={{
      transform: `translateZ(${depth}px)`,
      ...style,
    }}
    {...props}
  />
))
Card3DTitle.displayName = "Card3DTitle"

const Card3DDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & { depth?: number }
>(({ className, depth = 10, style, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    style={{
      transform: `translateZ(${depth}px)`,
      ...style,
    }}
    {...props}
  />
))
Card3DDescription.displayName = "Card3DDescription"

const Card3DContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { depth?: number }
>(({ className, depth = 25, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)}
    style={{
      transform: `translateZ(${depth}px)`,
      ...style,
    }}
    {...props}
  />
))
Card3DContent.displayName = "Card3DContent"

const Card3DFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { depth?: number }
>(({ className, depth = 15, style, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    style={{
      transform: `translateZ(${depth}px)`,
      ...style,
    }}
    {...props}
  />
))
Card3DFooter.displayName = "Card3DFooter"

export {
  Card3D,
  Card3DHeader,
  Card3DTitle,
  Card3DDescription,
  Card3DContent,
  Card3DFooter,
}
