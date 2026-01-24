"use client"

import * as React from "react"
import { motion, useDragControls, PanInfo } from "framer-motion"
import { X, Minus, Maximize2, Minimize2 } from "lucide-react"
import { cn } from "../utils"

export interface WindowProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  onFocus?: () => void
  defaultWidth?: number
  defaultHeight?: number
  defaultX?: number
  defaultY?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  resizable?: boolean
  draggable?: boolean
  centered?: boolean
  hideControls?: boolean
  variant?: 'default' | 'dark' | 'light' | 'transparent'
}

export interface WindowControlsProps {
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  isMaximized?: boolean
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  isMaximized = false,
}) => {
  return (
    <div className="flex items-center gap-2 group">
      <button
        onClick={onClose}
        className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group-hover:shadow-sm"
        title="Close"
        aria-label="Close window"
      >
        <X className="w-2 h-2 text-red-900 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        onClick={onMinimize}
        className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center group-hover:shadow-sm"
        title="Minimize"
        aria-label="Minimize window"
      >
        <Minus className="w-2 h-2 text-yellow-900 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <button
        onClick={onMaximize}
        className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group-hover:shadow-sm"
        title={isMaximized ? "Restore" : "Maximize"}
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
      >
        {isMaximized ? (
          <Minimize2 className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
        ) : (
          <Maximize2 className="w-2 h-2 text-green-900 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>
    </div>
  )
}

const variantStyles = {
  default: "bg-gray-900/95 border-white/10",
  dark: "bg-black/95 border-white/5",
  light: "bg-white/95 border-gray-200 text-gray-900",
  transparent: "bg-gray-900/80 border-white/10",
}

export const Window = React.forwardRef<HTMLDivElement, WindowProps>(
  (
    {
      title,
      icon,
      children,
      className,
      onClose,
      onMinimize,
      onMaximize,
      onFocus,
      defaultWidth = 600,
      defaultHeight = 400,
      defaultX,
      defaultY,
      minWidth = 200,
      minHeight = 100,
      maxWidth,
      maxHeight,
      resizable = true,
      draggable = true,
      centered = true,
      hideControls = false,
      variant = 'default',
    },
    ref
  ) => {
    const dragControls = useDragControls()
    const [isMaximized, setIsMaximized] = React.useState(false)
    const [position, setPosition] = React.useState(() => {
      if (typeof window !== 'undefined') {
        const x = defaultX ?? (centered ? (window.innerWidth - defaultWidth) / 2 : 100)
        const y = defaultY ?? (centered ? (window.innerHeight - defaultHeight) / 2 : 100)
        return { x, y }
      }
      return { x: 100, y: 100 }
    })
    const [size, setSize] = React.useState({ width: defaultWidth, height: defaultHeight })
    const [preMaximizeState, setPreMaximizeState] = React.useState<{
      position: { x: number; y: number }
      size: { width: number; height: number }
    } | null>(null)
    const [initialMount, setInitialMount] = React.useState(true)

    // Update position only on prop changes after initial mount
    React.useEffect(() => {
      if (initialMount) {
        setInitialMount(false)
        return
      }
      if (typeof window !== 'undefined') {
        const x = defaultX ?? (centered ? (window.innerWidth - defaultWidth) / 2 : 100)
        const y = defaultY ?? (centered ? (window.innerHeight - defaultHeight) / 2 : 100)
        setPosition({ x, y })
      }
    }, [defaultX, defaultY, defaultWidth, defaultHeight, centered])

    const handleMaximize = () => {
      if (isMaximized) {
        // Restore
        if (preMaximizeState) {
          setPosition(preMaximizeState.position)
          setSize(preMaximizeState.size)
        }
        setIsMaximized(false)
      } else {
        // Maximize
        setPreMaximizeState({ position, size })
        setPosition({ x: 0, y: 28 }) // Account for menu bar
        setSize({
          width: typeof window !== 'undefined' ? window.innerWidth : defaultWidth,
          height: typeof window !== 'undefined' ? window.innerHeight - 28 : defaultHeight,
        })
        setIsMaximized(true)
      }
      onMaximize?.()
    }

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setPosition((prev) => ({
        x: prev.x + info.offset.x,
        y: prev.y + info.offset.y,
      }))
    }

    return (
      <motion.div
        ref={ref}
        role="dialog"
        aria-labelledby={`window-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
        drag={draggable && !isMaximized}
        dragControls={dragControls}
        dragMomentum={false}
        dragListener={false}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: position.x,
          width: size.width,
          height: size.height,
        }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          minWidth,
          minHeight,
          maxWidth: isMaximized ? undefined : maxWidth,
          maxHeight: isMaximized ? undefined : maxHeight,
          zIndex: 1000,
        }}
        onClick={onFocus}
        className={cn(
          "flex flex-col rounded-xl border shadow-2xl backdrop-blur-xl overflow-hidden",
          variantStyles[variant],
          className
        )}
      >
        {/* Title Bar */}
        <div
          onPointerDown={(e) => {
            if (draggable && !isMaximized) {
              dragControls.start(e)
            }
          }}
          onDoubleClick={handleMaximize}
          className={cn(
            "flex items-center justify-between h-10 px-3 select-none cursor-default shrink-0",
            "border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent"
          )}
        >
          {/* Window Controls */}
          {!hideControls && (
            <WindowControls
              onClose={onClose}
              onMinimize={onMinimize}
              onMaximize={handleMaximize}
              isMaximized={isMaximized}
            />
          )}

          {/* Title */}
          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {icon && <span className="w-4 h-4">{icon}</span>}
            <span
              id={`window-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-sm font-medium text-white/90 truncate max-w-[200px]"
            >
              {title}
            </span>
          </div>

          {/* Spacer for alignment */}
          <div className="w-14" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">{children}</div>

        {/* Resize Handle */}
        {resizable && !isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.3) 50%)',
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const startX = e.clientX
              const startY = e.clientY
              const startWidth = size.width
              const startHeight = size.height

              const handleMove = (moveEvent: PointerEvent) => {
                const deltaX = moveEvent.clientX - startX
                const deltaY = moveEvent.clientY - startY
                const newWidth = Math.max(minWidth, Math.min(startWidth + deltaX, maxWidth ?? Infinity))
                const newHeight = Math.max(minHeight, Math.min(startHeight + deltaY, maxHeight ?? Infinity))
                setSize({ width: newWidth, height: newHeight })
              }

              const handleUp = () => {
                document.removeEventListener('pointermove', handleMove)
                document.removeEventListener('pointerup', handleUp)
              }

              document.addEventListener('pointermove', handleMove)
              document.addEventListener('pointerup', handleUp)
            }}
          />
        )}
      </motion.div>
    )
  }
)

Window.displayName = "Window"

export default Window
