'use client'
import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

import { cn } from '../util'
import { useState } from 'react'

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    trackBgClx?: string
    rangeBgClx?: string
    thumbClx?: string
    thumbSlidingClx?: string
  }
>(({ 
  className,
  trackBgClx='bg-level-2',
  rangeBgClx='bg-primary',
  thumbClx='',
  thumbSlidingClx='',
  onValueChange,
  onValueCommit,
  ...rest 
}, ref) => { 

  const [sliding, setSliding] = useState<boolean>(false)

  const _onChange = (value: number[]): void => {
    if (!sliding) {
      setSliding(true)
    }
    if (onValueChange) {
      onValueChange(value)
    }
  }

  const _onCommit = (value: number[]): void => {
    setSliding(false)
    if (onValueCommit) {
      onValueCommit(value)
    }
  }

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      onValueChange={_onChange}
      onValueCommit={_onCommit}
      {...rest}
    >
      <SliderPrimitive.Track data-vaul-no-drag className={'relative h-2 w-full grow overflow-hidden rounded-full ' + trackBgClx}>
        <SliderPrimitive.Range data-vaul-no-drag className={'absolute h-full ' + rangeBgClx} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb data-vaul-no-drag className={cn(
        'block h-5 w-5 rounded-full border-2 border-primary bg-background ',
        'ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 ', 
        'focus-visible:ring-muted-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
        thumbClx,
        (sliding ? thumbSlidingClx : '')
      )}/>
    </SliderPrimitive.Root>
  )
})

Slider.displayName = SliderPrimitive.Root.displayName

export default Slider 
