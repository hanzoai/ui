"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface PixelImageProps
  extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  src: string
  pixelSize?: number
}

const PixelImage = React.forwardRef<HTMLCanvasElement, PixelImageProps>(
  ({ className, src, pixelSize = 10, ...props }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = src

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        for (let y = 0; y < canvas.height; y += pixelSize) {
          for (let x = 0; x < canvas.width; x += pixelSize) {
            const pixelIndex = (y * canvas.width + x) * 4
            const r = imageData.data[pixelIndex]
            const g = imageData.data[pixelIndex + 1]
            const b = imageData.data[pixelIndex + 2]
            const a = imageData.data[pixelIndex + 3] / 255

            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
            ctx.fillRect(x, y, pixelSize, pixelSize)
          }
        }
      }
    }, [src, pixelSize])

    return (
      <canvas
        ref={canvasRef}
        className={cn("max-w-full", className)}
        {...props}
      />
    )
  }
)
PixelImage.displayName = "PixelImage"

export { PixelImage }
