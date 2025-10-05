"use client"

import * as React from "react"
import {
  AnimatePresence,
  motion,
  PanInfo,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "./button"
import { Card } from "./card"

export interface CarouselCard {
  id: string
  title: string
  subtitle?: string
  description?: string
  image?: string
  gradient?: string
  content?: React.ReactNode
}

interface AppleCardsCarouselProps {
  cards: CarouselCard[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  cardClassName?: string
  showArrows?: boolean
  showDots?: boolean
  parallaxOffset?: number
  stackOffset?: number
  stackScale?: number
  swipeThreshold?: number
}

export function AppleCardsCarousel({
  cards,
  autoPlay = false,
  autoPlayInterval = 5000,
  className,
  cardClassName,
  showArrows = true,
  showDots = true,
  parallaxOffset = 50,
  stackOffset = 10,
  stackScale = 0.95,
  swipeThreshold = 50,
}: AppleCardsCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(autoPlay)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dragX = useMotionValue(0)

  // Calculate card positions
  const getCardStyle = (index: number) => {
    const offset = index - currentIndex
    const absOffset = Math.abs(offset)
    const sign = Math.sign(offset)

    // Only show 3 cards at a time for performance
    if (absOffset > 2) {
      return {
        display: "none",
        x: 0,
        scale: 1,
        opacity: 0,
        zIndex: 0,
      }
    }

    const baseX = offset * stackOffset
    const scale = Math.pow(stackScale, absOffset)
    const opacity = Math.max(0, 1 - absOffset * 0.3)
    const zIndex = cards.length - absOffset

    return {
      display: "block",
      x: baseX,
      scale,
      opacity,
      zIndex,
    }
  }

  // Navigate to next card
  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % cards.length)
  }, [cards.length])

  // Navigate to previous card
  const goToPrevious = React.useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
  }, [cards.length])

  // Navigate to specific card
  const goToCard = React.useCallback((index: number) => {
    setCurrentIndex(index)
  }, [])

  // Handle drag end
  const handleDragEnd = React.useCallback(
    (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info

      // Determine if we should navigate based on drag distance and velocity
      if (Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500) {
        if (offset.x > 0) {
          goToPrevious()
        } else {
          goToNext()
        }
      }
    },
    [goToNext, goToPrevious, swipeThreshold]
  )

  // Auto-play functionality
  React.useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(goToNext, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlaying, goToNext, autoPlayInterval])

  // Pause auto-play on hover
  const handleMouseEnter = React.useCallback(() => {
    if (autoPlay) {
      setIsAutoPlaying(false)
    }
  }, [autoPlay])

  const handleMouseLeave = React.useCallback(() => {
    if (autoPlay) {
      setIsAutoPlaying(true)
    }
  }, [autoPlay])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToNext, goToPrevious])

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full max-w-6xl mx-auto px-4 py-8", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cards Container */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => {
            const style = getCardStyle(index)
            const isActive = index === currentIndex

            return (
              <motion.div
                key={card.id}
                className={cn(
                  "absolute inset-0 w-full h-full",
                  !isActive && "pointer-events-none"
                )}
                initial={false}
                animate={{
                  x: style.x,
                  scale: style.scale,
                  opacity: style.opacity,
                  zIndex: style.zIndex,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                drag={isActive ? "x" : false}
                dragSnapToOrigin
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                whileDrag={{ cursor: "grabbing" }}
                style={{
                  x: dragX,
                  display: style.display,
                }}
              >
                <Card
                  className={cn(
                    "relative w-full h-full overflow-hidden cursor-grab",
                    "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950",
                    "shadow-2xl hover:shadow-3xl transition-shadow duration-300",
                    cardClassName
                  )}
                  style={{
                    background: card.gradient,
                  }}
                >
                  {/* Parallax Background Image */}
                  {card.image && (
                    <motion.div
                      className="absolute inset-0 w-full h-full"
                      style={{
                        x: useTransform(
                          dragX,
                          [-200, 0, 200],
                          [parallaxOffset, 0, -parallaxOffset]
                        ),
                      }}
                    >
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </motion.div>
                  )}

                  {/* Card Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-8 md:p-12">
                    {card.content ? (
                      card.content
                    ) : (
                      <>
                        <motion.h3
                          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          {card.title}
                        </motion.h3>

                        {card.subtitle && (
                          <motion.p
                            className="text-xl md:text-2xl text-white/80 mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            {card.subtitle}
                          </motion.p>
                        )}

                        {card.description && (
                          <motion.p
                            className="text-base md:text-lg text-white/70 max-w-2xl"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: isActive ? 1 : 0.7, y: 0 }}
                            transition={{ delay: 0.3 }}
                          >
                            {card.description}
                          </motion.p>
                        )}
                      </>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Arrows */}
      {showArrows && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-20",
              "bg-white/10 backdrop-blur-md hover:bg-white/20",
              "text-white border border-white/20",
              "hidden md:flex"
            )}
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous card</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-20",
              "bg-white/10 backdrop-blur-md hover:bg-white/20",
              "text-white border border-white/20",
              "hidden md:flex"
            )}
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next card</span>
          </Button>
        </>
      )}

      {/* Dot Indicators */}
      {showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {cards.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                "bg-white/40 hover:bg-white/60",
                index === currentIndex && "w-8 bg-white"
              )}
              onClick={() => goToCard(index)}
            >
              <span className="sr-only">Go to card {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Preset gradients for demo purposes
export const gradientPresets = {
  sunset: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  ocean: "linear-gradient(135deg, #667eea 0%, #4ca1af 100%)",
  fire: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  forest: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  galaxy: "linear-gradient(135deg, #7303c0 0%, #ec38bc 50%, #fdeff9 100%)",
  aurora: "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
  peach: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
  lavender: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
}
