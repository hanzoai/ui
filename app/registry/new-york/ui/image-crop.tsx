"use client"

import * as React from "react"
import { Crop, RotateCw, ZoomIn, ZoomOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/new-york/ui/button"

export interface ImageCropProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string
  onCrop?: (croppedImage: string) => void
  aspect?: number
}

const ImageCrop = React.forwardRef<HTMLDivElement, ImageCropProps>(
  ({ className, src, onCrop, aspect = 1, ...props }, ref) => {
    const [zoom, setZoom] = React.useState(1)
    const [rotation, setRotation] = React.useState(0)

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div className="relative aspect-square overflow-hidden rounded-lg border">
          <img
            src={src}
            alt="Crop preview"
            className="h-full w-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: "transform 0.2s",
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setRotation((rotation + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => onCrop?.(src)}>
            <Crop className="mr-2 h-4 w-4" />
            Crop
          </Button>
        </div>
      </div>
    )
  }
)
ImageCrop.displayName = "ImageCrop"

export { ImageCrop }
