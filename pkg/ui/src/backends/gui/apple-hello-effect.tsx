'use client'

/**
 * AppleHelloEffect — a string that reveals itself one letter at a time. Each
 * letter fades in while rising fifty pixels into place, and the letters start
 * a tenth of a second apart, the way Apple's "Hello" splash plays.
 *
 * `text` is the string and `duration` the seconds each letter's own rise
 * takes; the stagger rides on each letter as `animationDelay`. The keyframe
 * rides along as a hoisted `<style>` keyed by `href`, so any number of these
 * on a page emit it once, and under `prefers-reduced-motion` the letters stand
 * whole and still.
 */
import { SizableText, XStack, styled } from '@hanzo/gui'
import * as React from 'react'
import { slot } from './slot'

const KEYFRAMES = `
@keyframes hello-rise { from { opacity: 0; transform: translateY(50px) } to { opacity: 1; transform: none } }
[data-slot="apple-hello-effect-letter"] { animation-name: hello-rise; animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1); animation-fill-mode: both; will-change: transform, opacity }
@media (prefers-reduced-motion: reduce) { [data-slot="apple-hello-effect-letter"] { animation: none !important } }
`

const Frame = styled(XStack, {
  name: 'AppleHelloEffect',
  position: 'relative',
  items: 'center',
  justify: 'center',
})

const Letter = styled(SizableText, {
  name: 'AppleHelloEffectLetter',
  fontSize: 60,
  lineHeight: 60,
  fontWeight: '700',
})

export type AppleHelloEffectProps = React.ComponentProps<'div'> & {
  /** The string to reveal, one letter at a time. */
  text?: string
  /** Seconds each letter's own rise takes. */
  duration?: number
}

export function AppleHelloEffect({
  text = 'Hello',
  duration = 2,
  ...props
}: AppleHelloEffectProps) {
  return (
    <Frame {...slot('apple-hello-effect')} {...(props as React.ComponentProps<typeof Frame>)}>
      <style href="apple-hello-effect" precedence="default">
        {KEYFRAMES}
      </style>
      {[...text].map((letter, index) => (
        <Letter
          key={index}
          {...slot('apple-hello-effect-letter')}
          style={{ animationDuration: `${duration}s`, animationDelay: `${index / 10}s` }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </Letter>
      ))}
    </Frame>
  )
}
