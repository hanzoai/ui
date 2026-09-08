'use client'

/**
 * PixelImage — a source image redrawn as flat pixelation blocks.
 *
 * Sampling one colour per block and filling that block flat is 2D Canvas work
 * — draw the image once, read its pixels back, paint blocks over them — and no
 * gui primitive performs it, so a raw `<canvas>` is mounted inside a gui frame
 * (`YStack`) and everything around it (the frame, the slot marker, the layout
 * props) is ordinary gui. Web-only: `isWeb` gates the canvas draw, and native
 * or a server render gets the empty frame with nothing to choke on.
 */
import { YStack, isWeb, type YStackProps } from '@hanzo/gui'
import { useEffect, useRef, useState } from 'react'
import { slot } from './slot'

export interface PixelImageProps extends Omit<YStackProps, 'children'> {
  /** The image to pixelate. */
  src: string
  /** Edge length, in source pixels, of one pixelation block. */
  pixelSize?: number
  /** Accessible label for the pictured image. */
  alt?: string
}

export function PixelImage({ src, pixelSize = 10, alt, ...props }: PixelImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isWeb) return undefined
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    let cancelled = false
    setLoaded(false)

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (cancelled) return
      canvas.width = img.width
      canvas.height = img.height

      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0)

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let y = 0; y < canvas.height; y += pixelSize) {
        for (let x = 0; x < canvas.width; x += pixelSize) {
          const i = (y * canvas.width + x) * 4
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3] / 255
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
          ctx.fillRect(x, y, pixelSize, pixelSize)
        }
      }
      setLoaded(true)
    }
    img.src = src

    return () => {
      cancelled = true
    }
  }, [src, pixelSize])

  return (
    <YStack {...slot('pixel-image')} maxW="100%" data-loaded={loaded} {...props}>
      {isWeb && (
        <canvas
          ref={canvasRef}
          {...slot('pixel-image-canvas')}
          data-pixel-size={pixelSize}
          aria-label={alt}
          role={alt ? 'img' : undefined}
          style={{ display: 'block', maxWidth: '100%' }}
        />
      )}
    </YStack>
  )
}
