"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface Carousel3DItem {
  id: string
  content: React.ReactNode
}

interface Carousel3DProps extends React.HTMLAttributes<HTMLDivElement> {
  items: Carousel3DItem[]
  itemWidth?: number
  itemHeight?: number
  spacing?: number
  perspective?: number
  rotateY?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  showControls?: boolean
  infinite?: boolean
  className?: string
}

const Carousel3D = React.forwardRef<HTMLDivElement, Carousel3DProps>(
  (
    {
      items,
      itemWidth = 300,
      itemHeight = 400,
      spacing = 80,
      perspective = 1000,
      rotateY = 40,
      autoRotate = false,
      autoRotateSpeed = 3000,
      showControls = true,
      infinite = true,
      className,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isDragging, setIsDragging] = React.useState(false)
    const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 })
    const [dragOffset, setDragOffset] = React.useState(0)
    const autoRotateRef = React.useRef<NodeJS.Timeout>()

    const totalItems = items.length
    const radius = (itemWidth + spacing) / 2 / Math.tan(Math.PI / totalItems)

    // Auto rotation
    React.useEffect(() => {
      if (autoRotate && !isHovered && !isDragging) {
        autoRotateRef.current = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % totalItems)
        }, autoRotateSpeed)
      } else {
        if (autoRotateRef.current) {
          clearInterval(autoRotateRef.current)
        }
      }

      return () => {
        if (autoRotateRef.current) {
          clearInterval(autoRotateRef.current)
        }
      }
    }, [autoRotate, isHovered, isDragging, autoRotateSpeed, totalItems])

    const goToPrevious = React.useCallback(() => {
      setCurrentIndex((prev) =>
        infinite ? (prev - 1 + totalItems) % totalItems : Math.max(0, prev - 1)
      )
    }, [infinite, totalItems])

    const goToNext = React.useCallback(() => {
      setCurrentIndex((prev) =>
        infinite ? (prev + 1) % totalItems : Math.min(totalItems - 1, prev + 1)
      )
    }, [infinite, totalItems])

    const goToIndex = React.useCallback(
      (index: number) => {
        setCurrentIndex(Math.max(0, Math.min(totalItems - 1, index)))
      },
      [totalItems]
    )

    // Touch and mouse drag handlers
    const handleDragStart = React.useCallback(
      (clientX: number, clientY: number) => {
        setIsDragging(true)
        setDragStart({ x: clientX, y: clientY })
        setDragOffset(0)
      },
      []
    )

    const handleDragMove = React.useCallback(
      (clientX: number, clientY: number) => {
        if (!isDragging) return

        const deltaX = clientX - dragStart.x
        const sensitivity = 0.5
        const newOffset = deltaX * sensitivity
        setDragOffset(newOffset)
      },
      [isDragging, dragStart.x]
    )

    const handleDragEnd = React.useCallback(() => {
      if (!isDragging) return

      const threshold = 50
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset > 0) {
          goToPrevious()
        } else {
          goToNext()
        }
      }

      setIsDragging(false)
      setDragOffset(0)
    }, [isDragging, dragOffset, goToPrevious, goToNext])

    // Mouse events
    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault()
        handleDragStart(e.clientX, e.clientY)
      },
      [handleDragStart]
    )

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent) => {
        handleDragMove(e.clientX, e.clientY)
      },
      [handleDragMove]
    )

    const handleMouseUp = React.useCallback(() => {
      handleDragEnd()
    }, [handleDragEnd])

    // Touch events
    const handleTouchStart = React.useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
          const touch = e.touches[0]
          handleDragStart(touch.clientX, touch.clientY)
        }
      },
      [handleDragStart]
    )

    const handleTouchMove = React.useCallback(
      (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault()
          const touch = e.touches[0]
          handleDragMove(touch.clientX, touch.clientY)
        }
      },
      [handleDragMove]
    )

    const handleTouchEnd = React.useCallback(() => {
      handleDragEnd()
    }, [handleDragEnd])

    // Keyboard navigation
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          goToPrevious()
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          goToNext()
        } else if (e.key >= "1" && e.key <= "9") {
          const index = parseInt(e.key) - 1
          if (index < totalItems) {
            goToIndex(index)
          }
        }
      }

      if (containerRef.current) {
        containerRef.current.addEventListener("keydown", handleKeyDown)
        return () => {
          containerRef.current?.removeEventListener("keydown", handleKeyDown)
        }
      }
    }, [goToPrevious, goToNext, goToIndex, totalItems])

    React.useImperativeHandle(ref, () => containerRef.current!)

    const containerStyle: React.CSSProperties = {
      perspective: `${perspective}px`,
      height: `${itemHeight + 100}px`,
    }

    const carouselStyle: React.CSSProperties = {
      transform: `translateZ(-${radius}px) rotateY(${-currentIndex * (360 / totalItems) + dragOffset / 5}deg)`,
      transition: isDragging
        ? "none"
        : "transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)",
      transformStyle: "preserve-3d",
    }

    return (
      <div
        ref={containerRef}
        className={cn(
          "relative w-full select-none focus:outline-none",
          className
        )}
        style={containerStyle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        tabIndex={0}
        {...props}
      >
        {/* 3D Carousel Container */}
        <div
          className="relative mx-auto"
          style={{
            width: `${itemWidth}px`,
            height: `${itemHeight}px`,
            transformStyle: "preserve-3d",
          }}
        >
          <div className="absolute inset-0" style={carouselStyle}>
            {items.map((item, index) => {
              const angle = (index / totalItems) * 360
              const isCurrent = index === currentIndex

              const itemStyle: React.CSSProperties = {
                transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                width: `${itemWidth}px`,
                height: `${itemHeight}px`,
                position: "absolute",
                backfaceVisibility: "hidden",
                transformStyle: "preserve-3d",
              }

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border bg-card text-card-foreground shadow-lg cursor-pointer",
                    "transition-all duration-300 transform-gpu will-change-transform",
                    isCurrent && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={itemStyle}
                  onClick={() => goToIndex(index)}
                >
                  <div className="w-full h-full overflow-hidden rounded-lg">
                    {item.content}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Navigation Controls */}
        {showControls && (
          <>
            <button
              className={cn(
                "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                "p-2 rounded-full bg-background/80 backdrop-blur-sm",
                "border shadow-lg hover:bg-background transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              onClick={goToPrevious}
              disabled={!infinite && currentIndex === 0}
              aria-label="Previous item"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                "p-2 rounded-full bg-background/80 backdrop-blur-sm",
                "border shadow-lg hover:bg-background transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              onClick={goToNext}
              disabled={!infinite && currentIndex === totalItems - 1}
              aria-label="Next item"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <div className="flex space-x-2 p-2 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg">
            {items.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "bg-primary scale-125"
                    : "bg-muted-foreground/50 hover:bg-muted-foreground/75"
                )}
                onClick={() => goToIndex(index)}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Auto-rotate indicator */}
        {autoRotate && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center space-x-2 p-2 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm">
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  isHovered || isDragging
                    ? "bg-orange-500"
                    : "bg-green-500 animate-pulse"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isHovered || isDragging ? "Paused" : "Auto"}
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }
)
Carousel3D.displayName = "Carousel3D"

// Card component optimized for 3D carousel
const Carousel3DCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full h-full flex flex-col bg-gradient-to-br from-background to-muted/20",
      "border rounded-lg overflow-hidden group",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Carousel3DCard.displayName = "Carousel3DCard"

const Carousel3DCardImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt, ...props }, ref) => (
  <img
    ref={ref}
    className={cn(
      "w-full h-48 object-cover transition-transform duration-300",
      "group-hover:scale-105",
      className
    )}
    alt={alt}
    {...props}
  />
))
Carousel3DCardImage.displayName = "Carousel3DCardImage"

const Carousel3DCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 p-4 flex flex-col justify-between", className)}
    {...props}
  >
    {children}
  </div>
))
Carousel3DCardContent.displayName = "Carousel3DCardContent"

const Carousel3DCardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-lg mb-2 line-clamp-2", className)}
    {...props}
  >
    {children}
  </h3>
))
Carousel3DCardTitle.displayName = "Carousel3DCardTitle"

const Carousel3DCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground line-clamp-3 mb-4", className)}
    {...props}
  >
    {children}
  </p>
))
Carousel3DCardDescription.displayName = "Carousel3DCardDescription"

export {
  Carousel3D,
  Carousel3DCard,
  Carousel3DCardImage,
  Carousel3DCardContent,
  Carousel3DCardTitle,
  Carousel3DCardDescription,
  type Carousel3DItem,
  type Carousel3DProps,
}
