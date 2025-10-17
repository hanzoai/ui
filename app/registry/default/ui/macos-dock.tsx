"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

import { cn } from "@/lib/utils"

interface DockProps {
  className?: string
  children?: React.ReactNode
  magnification?: number
  distance?: number
}

interface DockItemProps {
  className?: string
  children?: React.ReactNode
  onClick?: () => void
  tooltip?: string
}

const DockContext = React.createContext<{
  magnification: number
  distance: number
  mouseX: any
}>({
  magnification: 60,
  distance: 140,
  mouseX: null,
})

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ className, children, magnification = 60, distance = 140 }, ref) => {
    const mouseX = useMotionValue(Infinity)

    return (
      <DockContext.Provider value={{ magnification, distance, mouseX }}>
        <motion.div
          ref={ref}
          onMouseMove={(e) => mouseX.set(e.pageX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className={cn(
            "mx-auto flex h-16 items-end gap-2 rounded-2xl border border-white/10 bg-black/10 px-3 pb-2 backdrop-blur-xl",
            "shadow-2xl shadow-black/20",
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b before:from-white/10 before:to-transparent before:opacity-50",
            className
          )}
        >
          {children}
        </motion.div>
      </DockContext.Provider>
    )
  }
)
Dock.displayName = "Dock"

const DockItem = React.forwardRef<HTMLButtonElement, DockItemProps>(
  ({ className, children, onClick, tooltip }, ref) => {
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const { magnification, distance, mouseX } = React.useContext(DockContext)
    const [isHovered, setIsHovered] = React.useState(false)

    const distanceCalc = useTransform(mouseX, (val: number) => {
      const bounds = buttonRef.current?.getBoundingClientRect() ?? {
        x: 0,
        width: 0,
      }
      return val - bounds.x - bounds.width / 2
    })

    const widthSync = useTransform(
      distanceCalc,
      [-distance, 0, distance],
      [48, 48 + magnification, 48]
    )

    const width = useSpring(widthSync, {
      mass: 0.1,
      stiffness: 150,
      damping: 12,
    })

    return (
      <motion.div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          style={{ width }}
          whileTap={{ scale: 0.95 }}
          onClick={onClick}
          className={cn(
            "aspect-square w-12 rounded-xl bg-white/10 backdrop-blur-md transition-colors",
            "hover:bg-white/20",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
            "relative overflow-hidden",
            className
          )}
        >
          <div className="flex h-full w-full items-center justify-center">
            {children}
          </div>
          <div
            className="pointer-events-none absolute inset-0 rounded-xl"
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
