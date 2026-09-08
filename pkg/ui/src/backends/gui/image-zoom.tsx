'use client'

/**
 * ImageZoom — a photograph that magnifies toward the pointer.
 *
 * Hovering the frame scales the image up by `zoomScale`, keeping the point
 * under the cursor fixed, and fades in a small zoom-in glyph over the corner.
 * Leaving the frame eases the image back to its rest size.
 *
 * The live transform is an inline style, not a style prop: gui compiles a
 * style prop to one class per distinct value, and the pointer takes a new
 * position on every pixel of travel (the same trade `Card3D` makes).
 */
import { Image, XStack, styled } from '@hanzo/gui'
import { ZoomIn } from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps, type PointerEvent } from 'react'
import { slot } from './slot'

const EASE = 'cubic-bezier(0.03, 0.98, 0.52, 0.99)'

const Frame = styled(XStack, {
  name: 'ImageZoom',
  position: 'relative',
  overflow: 'hidden',
  rounded: '$4',
  cursor: 'zoom-in',
})

const Glyph = styled(XStack, {
  name: 'ImageZoomGlyph',
  position: 'absolute',
  t: '$2',
  r: '$2',
  p: '$1.5',
  rounded: 1000,
  bg: 'rgba(0,0,0,0.5)',
  opacity: 0,

  variants: {
    zoomed: {
      true: { opacity: 1 },
    },
  } as const,
})

/** The pointer as a percentage of the frame, 0..100 from its top-left corner. */
const CENTRE = { x: 50, y: 50, live: false }

export type ImageZoomProps = Omit<ComponentProps<typeof Frame>, 'children'> & {
  src?: string
  alt?: string
  /** How far the image magnifies while the pointer is over it. */
  zoomScale?: number
  /** How long the image takes to settle back, in ms. */
  speed?: number
}

export function ImageZoom({ src, alt, zoomScale = 2, speed = 200, ...props }: ImageZoomProps) {
  const [at, setAt] = useState(CENTRE)

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setAt({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, live: true })
  }
  const leave = () => setAt((a) => ({ ...a, live: false }))

  return (
    <Frame
      {...slot('image-zoom')}
      data-state={at.live ? 'zoomed' : 'idle'}
      onPointerMove={move}
      onPointerLeave={leave}
      {...props}
    >
      <Image
        {...slot('image-zoom-image')}
        src={src}
        alt={alt}
        width="100%"
        height="100%"
        objectFit="cover"
        style={{
          transform: `scale(${at.live ? zoomScale : 1})`,
          transformOrigin: `${at.x}% ${at.y}%`,
          transition: at.live ? 'none' : `transform ${speed}ms ${EASE}`,
        }}
      />
      <Glyph {...slot('image-zoom-glyph')} zoomed={at.live} style={{ transition: 'opacity 200ms ease' }}>
        <ZoomIn size={16} color="white" />
      </Glyph>
    </Frame>
  )
}
