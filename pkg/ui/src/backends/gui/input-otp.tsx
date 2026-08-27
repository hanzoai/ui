'use client'

/**
 * InputOTP — a one-time code, shown as separate boxes.
 *
 * ONE real `<input>` lies invisibly over the whole control and holds the entire
 * value; the boxes are drawn from it. That is what makes paste, autofill,
 * backspace-across-boxes, and the phone keyboard's "from Messages" suggestion
 * work — all four break the moment the code is six separate inputs that hop
 * focus between themselves, which is how this is usually built.
 *
 * It also means the caller's `onInput`/`onChange` see a normal input event with
 * the whole code on it, which is what a form expects.
 *
 * `render` draws the boxes, because their GROUPING is a design decision — three
 * and three, four and four, one run of six — and it is the caller's.
 */
import * as React from 'react'

import { Box, type BoxProps } from '../../box'
import { cn } from '../../core/cn'

/** One box's worth of state. */
export type OTPSlot = {
  char: string | null
  /** The box the next keystroke lands in. */
  isActive: boolean
  /** Draw a caret here — the real one is hidden with the real input. */
  hasFakeCaret: boolean
}

export type InputOTPProps = Omit<React.ComponentProps<'input'>, 'render' | 'children' | 'size'> & {
  maxLength: number
  render: (props: { slots: OTPSlot[] }) => React.ReactNode
  className?: string
}

export const InputOTP = ({
  maxLength,
  render,
  className,
  value: controlled,
  onChange,
  onFocus,
  onBlur,
  ...props
}: InputOTPProps) => {
  const [held, setHeld] = React.useState('')
  const value = String(controlled ?? held).slice(0, maxLength)
  const [focused, setFocused] = React.useState(false)

  const slots: OTPSlot[] = Array.from({ length: maxLength }, (_, i) => ({
    char: value[i] ?? null,
    isActive: focused && i === Math.min(value.length, maxLength - 1),
    hasFakeCaret: focused && i === value.length && i < maxLength,
  }))

  return (
    <Box className={cn('relative grid grid-flow-col auto-cols-max items-center', className)}>
      {render({ slots })}
      <Box
        tag="input"
        // The phone keyboard's one-time-code suggestion is worth more than any
        // amount of styling here, and it turns on these three attributes alone.
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={maxLength}
        // `as object`: these are an <input>'s own props on their way to an
        // <input>, and Box's polymorphic type collapses to a union of every
        // element when it cannot see the tag from the props alone.
        {...(props as object)}
        value={value}
        onChange={(e) => {
          if (controlled === undefined) setHeld(e.target.value.slice(0, maxLength))
          onChange?.(e)
        }}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={{
          // Over the boxes and transparent — so a click anywhere on the control
          // focuses the thing that actually takes the keystrokes.
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          // The real caret would sit at the left edge of an invisible field,
          // nowhere near the box it belongs to. The drawn one is in the slot.
          caretColor: 'transparent',
        }}
      />
    </Box>
  )
}

export const InputOTPGroup = ({ className, ...props }: React.ComponentProps<typeof Box>) => (
  <Box className={cn('grid grid-flow-col auto-cols-max items-center', className)} {...props} />
)

export const InputOTPSlot = ({
  char,
  isActive,
  hasFakeCaret,
  className,
  ...props
}: BoxProps & OTPSlot) => (
  <Box
    // Not focusable and not announced: the real input holds the value and the
    // focus, and six boxes in the tab order would be six stops for one field.
    aria-hidden="true"
    className={cn(
      'relative grid place-items-center w-10 h-10 border text-sm',
      isActive && 'border-foreground z-10',
      className,
    )}
    {...props}
  >
    {char}
    {hasFakeCaret && <Box className="hz-caret absolute" style={{ width: 1, height: '1em' }} />}
  </Box>
)

export const InputOTPSeparator = ({ children, ...props }: React.ComponentProps<typeof Box>) => (
  <Box role="separator" aria-hidden="true" {...props}>
    {children ?? '-'}
  </Box>
)
