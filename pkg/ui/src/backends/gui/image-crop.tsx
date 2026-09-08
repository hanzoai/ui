'use client'

/**
 * ImageCrop — a zoom, rotate and crop preview for a single image.
 *
 * The frame is `AspectRatio`, held to the caller's `aspect`; the image inside
 * carries a live `scale`/`rotate` transform driven by local zoom/rotation
 * state. The actual pixel crop is the caller's — `onCrop` hands back the same
 * `src` the preview shows, exactly as the source component's contract does —
 * so this file owns the preview and the four controls under it, nothing more.
 */
import { Image, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Crop, RotateCw, ZoomIn, ZoomOut } from '@hanzogui/lucide-icons-2'
import { useState } from 'react'
import { AspectRatio } from './aspect-ratio'
import { Button } from './button'
import { slot } from './slot'

const STEP = 0.1
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3
const ICON = 16

export interface ImageCropProps extends Omit<YStackProps, 'children'> {
  /** The image to preview and crop. */
  src: string
  /** Called with `src` when the Crop button is pressed. */
  onCrop?: (croppedImage: string) => void
  /** Width divided by height of the crop frame. Square by default. */
  aspect?: number
}

export function ImageCrop({ src, onCrop, aspect = 1, ...props }: ImageCropProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - STEP).toFixed(2)))
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + STEP).toFixed(2)))
  const rotate = () => setRotation((r) => (r + 90) % 360)

  return (
    <YStack {...slot('image-crop')} gap="$4" {...props}>
      <AspectRatio
        {...slot('image-crop-preview')}
        ratio={aspect}
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <Image
          src={src}
          alt="Crop preview"
          width="100%"
          height="100%"
          objectFit="contain"
          data-zoom={zoom}
          data-rotation={rotation}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s',
          }}
        />
      </AspectRatio>
      <XStack {...slot('image-crop-controls')} items="center" justify="center" gap="$2">
        <Button
          {...slot('image-crop-zoom-out')}
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          onPress={zoomOut}
        >
          <ZoomOut size={ICON} />
        </Button>
        <Button
          {...slot('image-crop-zoom-in')}
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          onPress={zoomIn}
        >
          <ZoomIn size={ICON} />
        </Button>
        <Button
          {...slot('image-crop-rotate')}
          variant="outline"
          size="icon"
          aria-label="Rotate"
          onPress={rotate}
        >
          <RotateCw size={ICON} />
        </Button>
        <Button {...slot('image-crop-crop')} onPress={() => onCrop?.(src)}>
          <Crop size={ICON} />
          Crop
        </Button>
      </XStack>
    </YStack>
  )
}
