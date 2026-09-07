'use client'

/**
 * Pin3D — a frame that lifts what is inside it while it is hovered.
 *
 * A white wash fades in over the scene at half strength and the scene shrinks
 * to 95% while the pointer is on the frame or, when the frame is a link, while
 * it holds keyboard focus; both ease back over half a second. The frame is a
 * gui `group`, so the wash and the scene each declare their lifted look against
 * the frame's own pseudo state and the whole effect is one compiled stylesheet
 * with nothing held on the client.
 *
 * `href` renders the frame as an anchor; `title` rides along as its tooltip.
 */
import { YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { slot } from './slot'

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const DURATION = 500

/** Inline, as gui's `transition` prop names a driver rung rather than a property. */
const ease = (property: string) => ({ transition: `${property} ${DURATION}ms ${EASE}` })

const Frame = styled(YStack, {
  name: 'Pin3D',
  group: true,
  // A group is a size container unless told otherwise, and inline-size
  // containment shrinks an auto-width frame in a row to nothing.
  containerType: 'normal',
  position: 'relative',
  cursor: 'pointer',
})

const Wash = styled(YStack, {
  name: 'Pin3DWash',
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
  bg: '$white1',
  opacity: 0,
  '$group-hover': { opacity: 0.5 },
  '$group-focusVisible': { opacity: 0.5 },
})

const Scene = styled(YStack, {
  name: 'Pin3DScene',
  scale: 1,
  '$group-hover': { scale: 0.95 },
  '$group-focusVisible': { scale: 0.95 },
})

export type Pin3DProps = ComponentProps<typeof Frame> & {
  /** Tooltip for the destination; carried through as the title attribute. */
  title?: string
  /** Where the pin leads. Renders the frame as a link when set. */
  href?: string
}

export function Pin3D({ title, href, children, ...props }: Pin3DProps) {
  return (
    <Frame
      {...slot('3d-pin')}
      render={href ? 'a' : 'div'}
      {...({ href, title } as object)}
      {...props}
    >
      {/* zIndex is not among gui's typed stack styles, so it rides the inline style. */}
      <Wash {...slot('3d-pin-wash')} style={{ zIndex: 10, ...ease('opacity') }} />
      <Scene {...slot('3d-pin-scene')} style={ease('transform')}>
        {children}
      </Scene>
    </Frame>
  )
}
