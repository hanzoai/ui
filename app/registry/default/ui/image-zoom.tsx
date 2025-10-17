"use client"

import * as React from "react"
import { ZoomIn } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ImageZoomProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  zoomScale?: number
}

const ImageZoom = React.forwardRef<HTMLDivElement, ImageZoomProps>(
  ({ className, src, alt, zoomScale = 2, ...props }, ref) => {
    const [isZoomed, setIsZoomed] = React.useState(false)
    const [position, setPosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isZoomed) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setPosition({ x, y })
    }

    return (
      <div
        ref={ref}
        className={cn(
          "group relative cursor-zoom-in overflow-hidden rounded-lg",
          className
        )}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={src}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-transform duration-200",
            isZoomed && `scale-${zoomScale * 100}`
          )}
          style={
            isZoomed
              ? {
                  transform: `scale(${zoomScale})`,
                  transformOrigin: `${position.x}% ${position.y}%`,
                }
              : undefined
          }
          {...props}
        />
        <div className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4 text-white" />
        </div>
      </div>
    )
  }
)
ImageZoom.displayName = "ImageZoom"

export { ImageZoom }
