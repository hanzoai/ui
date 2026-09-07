'use client'

/**
 * AnimatedTooltip — a floating label that fades up above whatever it wraps
 * while the pointer or keyboard focus rests there.
 *
 * `content` is the label, `children` the trigger, and `delay` holds the
 * entrance for that many milliseconds. The panel mounts only while visible, so
 * mounting is the animation: `hz-fade-up` from `styles/motion.css` plays on
 * every appearance, its `animation-delay` carries `delay`, and the
 * reduced-motion guard lives in that stylesheet. It unmounts with no exit,
 * the same trade AnimatedTestimonials makes. The keyframe owns
 * `transform`, so the panel is centred by layout — an anchor spanning the
 * trigger's width aligns it — never by a translate the animation would
 * overwrite.
 */
import { XStack, YStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { ink } from './ink'
import { slot } from './slot'

const Frame = styled(XStack, {
  name: 'AnimatedTooltip',
  display: 'inline-flex',
  position: 'relative',
})

const Anchor = styled(YStack, {
  name: 'AnimatedTooltipAnchor',
  position: 'absolute',
  b: '100%',
  l: 0,
  r: 0,
  mb: '$2',
  items: 'center',
  z: 50,
})

const Panel = styled(YStack, {
  name: 'AnimatedTooltipPanel',
  position: 'relative',
  bg: '$panel',
  borderColor: '$borderColor',
  borderWidth: 1,
  rounded: '$3',
  px: '$3',
  py: '$1.5',
})

const Arrow = styled(YStack, {
  name: 'AnimatedTooltipArrow',
  position: 'absolute',
  t: '100%',
  l: '50%',
  ml: -4,
  width: 0,
  height: 0,
  borderLeftWidth: 4,
  borderRightWidth: 4,
  borderTopWidth: 4,
  borderLeftColor: 'transparent',
  borderRightColor: 'transparent',
  borderTopColor: '$panel',
})

export type AnimatedTooltipProps = Omit<React.ComponentProps<typeof Frame>, 'content'> & {
  /** What the floating panel shows. */
  content: React.ReactNode
  children: React.ReactNode
  /** Milliseconds to hold before the entrance animation starts. */
  delay?: number
}

export function AnimatedTooltip({
  content,
  children,
  delay = 0,
  ...props
}: AnimatedTooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <Frame
      {...slot('animated-tooltip')}
      data-state={isVisible ? 'visible' : 'hidden'}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      {...props}
    >
      {children}
      {isVisible && (
        <Anchor {...slot('animated-tooltip-anchor')}>
          <Panel
            {...slot('animated-tooltip-panel')}
            role="tooltip"
            className="hz-fade-up"
            style={{ animationDelay: `${delay}ms` }}
          >
            {ink(content, undefined, { size: '$1', whiteSpace: 'nowrap' })}
            <Arrow {...slot('animated-tooltip-arrow')} />
          </Panel>
        </Anchor>
      )}
    </Frame>
  )
}
