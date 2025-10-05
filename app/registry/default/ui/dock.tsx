"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children?: React.ReactNode
  position?: "bottom" | "left" | "right"
  magnification?: number
  distance?: number
}

interface DockItemProps {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  tooltip?: string
  magnification?: number
  distance?: number
}

const DockContext = React.createContext<{
  magnification: number
  distance: number
}>({
  magnification: 60,
  distance: 140,
})

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      position = "bottom",
      magnification = 60,
      distance = 140,
    },
    ref
  ) => {
    const positionClasses = {
      bottom: "bottom-0 left-1/2 -translate-x-1/2 flex-row",
      left: "left-0 top-1/2 -translate-y-1/2 flex-col",
      right: "right-0 top-1/2 -translate-y-1/2 flex-col",
    }

    return (
      <DockContext.Provider value={{ magnification, distance }}>
        <div
          ref={ref}
          className={cn(
            "fixed z-50 flex items-end gap-1 rounded-2xl border border-white/10 bg-black/10 p-2 backdrop-blur-xl",
            "shadow-2xl shadow-black/20",
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50",
            positionClasses[position],
            className
          )}
        >
          {children}
        </div>
      </DockContext.Provider>
    )
  }
)
Dock.displayName = "Dock"

const DockItem = React.forwardRef<HTMLButtonElement, DockItemProps>(
  (
    {
      className,
      children,
      onClick,
      tooltip,
      magnification: itemMagnification,
      distance: itemDistance,
    },
    ref
  ) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const { magnification: contextMagnification, distance: contextDistance } =
      React.useContext(DockContext)
    const magnification = itemMagnification ?? contextMagnification
    const distance = itemDistance ?? contextDistance

    const [isHovered, setIsHovered] = React.useState(false)

    const mouseX = useMotionValue(Infinity)

    const springConfig = { mass: 0.1, stiffness: 150, damping: 12 }
    const size = useSpring(
      useTransform(
        mouseX,
        [-distance, 0, distance],
        [48, 48 + magnification, 48]
      ),
      springConfig
    )

    const handleMouseMove = (e: React.MouseEvent) => {
      if (!buttonRef.current) return
      const rect = buttonRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      mouseX.set(e.clientX - centerX)
    }

    const handleMouseLeave = () => {
      mouseX.set(Infinity)
      setIsHovered(false)
    }

    return (
      <motion.div
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => setIsHovered(true)}
      >
        {tooltip && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-md"
          >
            {tooltip}
            <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-black/80" />
          </motion.div>
        )}
        <motion.button
          ref={buttonRef}
          style={{
            width: size,
            height: size,
          }}
          whileTap={{ scale: 0.9 }}
          onClick={onClick}
          className={cn(
            "relative flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-md transition-colors",
            "hover:bg-white/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            className
          )}
        >
          <motion.div
            style={{
              width: size,
              height: size,
            }}
            className="flex items-center justify-center"
          >
            {children}
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
            }}
          />
        </motion.button>
      </motion.div>
    )
  }
)
DockItem.displayName = "DockItem"

export { Dock, DockItem }
