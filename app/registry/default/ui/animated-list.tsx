"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion, Reorder, Variants } from "motion/react"

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

export interface AnimatedListItem {
  id: string | number
  content: React.ReactNode
  data?: any
}

export interface AnimatedListProps {
  /**
   * List items to render
   */
  items: AnimatedListItem[]
  /**
   * Animation type for list items
   */
  animation?:
    | "slide"
    | "fade"
    | "scale"
    | "slideUp"
    | "slideDown"
    | "slideLeft"
    | "slideRight"
  /**
   * Stagger delay between items in milliseconds
   */
  staggerDelay?: number
  /**
   * Animation duration for each item in milliseconds
   */
  duration?: number
  /**
   * Whether list items are reorderable
   */
  reorderable?: boolean
  /**
   * Whether to enable add/remove animations
   */
  enableAddRemove?: boolean
  /**
   * Layout type
   */
  layout?: "vertical" | "horizontal" | "grid"
  /**
   * Grid columns (for grid layout)
   */
  gridColumns?: number
  /**
   * Custom CSS class
   */
  className?: string
  /**
   * Custom item CSS class
   */
  itemClassName?: string
  /**
   * Custom styling
   */
  style?: React.CSSProperties
  /**
   * Callback when items are reordered
   */
  onReorder?: (items: AnimatedListItem[]) => void
  /**
   * Callback when item is clicked
   */
  onItemClick?: (item: AnimatedListItem, index: number) => void
  /**
   * Whether to show hover effects
   */
  showHoverEffects?: boolean
  /**
   * Custom variants for animations
   */
  customVariants?: Variants
  /**
   * Whether list is virtualized (for performance)
   */
  virtualized?: boolean
  /**
   * Item height for virtualization
   */
  itemHeight?: number
  /**
   * Container height for virtualization
   */
  containerHeight?: number
  /**
   * Whether to auto-start animations
   */
  autoStart?: boolean
  /**
   * Callback when all animations complete
   */
  onAnimationComplete?: () => void
}

const slideVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
}

const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, transition: { duration: 0.3 } },
}

const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
      type: "spring",
      stiffness: 100,
    },
  }),
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
}

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, y: -50, transition: { duration: 0.3 } },
}

const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, y: 50, transition: { duration: 0.3 } },
}

const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
}

const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut",
    },
  }),
  exit: { opacity: 0, x: 50, transition: { duration: 0.3 } },
}

const animationVariants = {
  slide: slideVariants,
  fade: fadeVariants,
  scale: scaleVariants,
  slideUp: slideUpVariants,
  slideDown: slideDownVariants,
  slideLeft: slideLeftVariants,
  slideRight: slideRightVariants,
}

/**
 * Custom hook for virtualized list rendering
 */
function useVirtualizedList(
  items: AnimatedListItem[],
  containerHeight: number,
  itemHeight: number,
  enabled: boolean
) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleItems = useMemo(() => {
    if (!enabled) return items

    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      virtualIndex: startIndex + index,
      style: {
        position: "absolute" as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: "100%",
      },
    }))
  }, [items, scrollTop, itemHeight, containerHeight, enabled])

  const totalHeight = items.length * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    handleScroll,
  }
}

/**
 * Animated list component with stagger animations and reordering
 */
export function AnimatedList({
  items,
  animation = "slideUp",
  staggerDelay = 100,
  duration = 500,
  reorderable = false,
  enableAddRemove = true,
  layout = "vertical",
  gridColumns = 3,
  className,
  itemClassName,
  style,
  onReorder,
  onItemClick,
  showHoverEffects = true,
  customVariants,
  virtualized = false,
  itemHeight = 60,
  containerHeight = 400,
  autoStart = true,
  onAnimationComplete,
}: AnimatedListProps) {
  const [animatedItems, setAnimatedItems] = useState(items)
  const [animationKey, setAnimationKey] = useState(0)
  const prefersReducedMotion = usePrefersReducedMotion()

  const variants = customVariants || animationVariants[animation]
  const shouldAnimate = !prefersReducedMotion && autoStart

  const { visibleItems, totalHeight, handleScroll } = useVirtualizedList(
    items,
    containerHeight,
    itemHeight,
    virtualized
  )

  // Update animated items when items change
  useEffect(() => {
    setAnimatedItems(items)
  }, [items])

  // Update stagger delay in variants
  const updatedVariants = useMemo(() => {
    if (!variants.visible || typeof variants.visible !== "function")
      return variants

    return {
      ...variants,
      visible: (i: number) => {
        // eslint-disable-next-line
        const original = variants.visible as (i: number) => any
        const originalResult = original(i)
        return {
          ...originalResult,
          transition: {
            ...originalResult.transition,
            delay: i * (staggerDelay / 1000),
            duration: duration / 1000,
          },
        }
      },
    }
  }, [variants, staggerDelay, duration])

  const getLayoutClassName = () => {
    switch (layout) {
      case "horizontal":
        return "flex flex-row gap-4 overflow-x-auto"
      case "grid":
        return `grid gap-4 grid-cols-${gridColumns}`
      default:
        return "flex flex-col gap-4"
    }
  }

  const renderListItem = (
    item: AnimatedListItem,
    index: number,
    virtualStyle?: React.CSSProperties
  ) => {
    const itemContent = (
      <motion.div
        key={item.id}
        custom={index}
        variants={updatedVariants}
        initial={shouldAnimate ? "hidden" : "visible"}
        animate="visible"
        exit="exit"
        layout={enableAddRemove}
        className={cn(
          "cursor-pointer select-none",
          showHoverEffects && "hover:scale-105 transition-transform",
          itemClassName
        )}
        style={virtualStyle}
        onClick={() => onItemClick?.(item, index)}
        whileHover={showHoverEffects ? { scale: 1.02 } : undefined}
        whileTap={showHoverEffects ? { scale: 0.98 } : undefined}
        onAnimationComplete={() => {
          if (index === animatedItems.length - 1) {
            onAnimationComplete?.()
          }
        }}
      >
        {item.content}
      </motion.div>
    )

    return itemContent
  }

  if (reorderable && !virtualized) {
    return (
      <Reorder.Group
        axis={layout === "horizontal" ? "x" : "y"}
        values={animatedItems}
        onReorder={(newItems) => {
          setAnimatedItems(newItems)
          onReorder?.(newItems)
        }}
        className={cn(getLayoutClassName(), className)}
        style={style}
      >
        <AnimatePresence mode="popLayout">
          {animatedItems.map((item, index) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={cn(
                "cursor-grab active:cursor-grabbing",
                itemClassName
              )}
              whileDrag={{ scale: 1.05, zIndex: 10 }}
            >
              {item.content}
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>
    )
  }

  if (virtualized) {
    return (
      <div
        className={cn("overflow-auto", className)}
        style={{ height: containerHeight, ...style }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <AnimatePresence mode="popLayout">
            {visibleItems.map((item, index) =>
              renderListItem(item, item.virtualIndex || index, item.style)
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={cn(getLayoutClassName(), className)}
      style={style}
      initial="hidden"
      animate="visible"
      key={animationKey}
    >
      <AnimatePresence mode="popLayout">
        {animatedItems.map((item, index) => renderListItem(item, index))}
      </AnimatePresence>
    </motion.div>
  )
}

/**
 * Preset animated list variations
 */
export const AnimatedListPresets = {
  /**
   * Simple fade in list
   */
  FadeList: (props: Omit<AnimatedListProps, "animation">) => (
    <AnimatedList animation="fade" {...props} />
  ),

  /**
   * Scale up from center
   */
  ScaleList: (props: Omit<AnimatedListProps, "animation">) => (
    <AnimatedList animation="scale" {...props} />
  ),

  /**
   * Slide up from bottom
   */
  SlideUpList: (props: Omit<AnimatedListProps, "animation">) => (
    <AnimatedList animation="slideUp" {...props} />
  ),

  /**
   * Horizontal carousel-style list
   */
  CarouselList: (props: Omit<AnimatedListProps, "layout" | "animation">) => (
    <AnimatedList layout="horizontal" animation="slideLeft" {...props} />
  ),

  /**
   * Grid with scale animation
   */
  GridList: (props: Omit<AnimatedListProps, "layout" | "animation">) => (
    <AnimatedList layout="grid" animation="scale" {...props} />
  ),

  /**
   * Reorderable task list
   */
  TaskList: (props: Omit<AnimatedListProps, "reorderable" | "animation">) => (
    <AnimatedList reorderable animation="slideUp" showHoverEffects {...props} />
  ),
}

export default AnimatedList
