'use client'

/**
 * Input — single-line field with optional adornments and a password reveal.
 *
 * @hanzogui/input owns the field; the adornment wrapper only appears when an
 * adornment (or the password toggle) is actually asked for, so the common path
 * stays one element.
 */
import { Input as GuiInput, XStack } from '@hanzo/gui'
import { Eye, EyeOff } from '@hanzogui/lucide-icons-2'
import { forwardRef, useState, type ComponentProps, type ReactNode } from 'react'
import { slot } from './slot'
import { touch } from './gesture'

const HEIGHT = 36
const GUTTER = 12
/** Width reserved for an adornment inside the field. */
const WELL = 36

export type InputProps = Omit<ComponentProps<typeof GuiInput>, 'children'> & {
  /** Optional leading affordance (icon/text) rendered inside the field. */
  startAdornment?: ReactNode
  /** Optional trailing affordance rendered inside the field. */
  endAdornment?: ReactNode
  /** Suppress the built-in show/hide control for `secureTextEntry`/`type="password"`. */
  hidePasswordToggle?: boolean
}

const well = (side: 'l' | 'r') =>
  ({
    position: 'absolute' as const,
    [side]: GUTTER,
    t: 0,
    b: 0,
    items: 'center' as const,
    justify: 'center' as const,
  })

const Input = /* @__PURE__ */ forwardRef<HTMLInputElement, InputProps>(function Input(
  { startAdornment, endAdornment, hidePasswordToggle, type, secureTextEntry, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password' || secureTextEntry === true
  const toggle = isPassword && !hidePasswordToggle

  const field = (
    <GuiInput
      ref={ref as never}
      {...slot('input')}
      secureTextEntry={isPassword && !revealed}
      height={HEIGHT}
      width="100%"
      minW={0}
      rounded="$3"
      bg="transparent"
      borderWidth={1}
      borderColor="$borderColor"
      placeholderTextColor="$color10"
      fontSize="$3"
      pl={startAdornment ? WELL : GUTTER}
      pr={endAdornment || toggle ? WELL : GUTTER}
      {...props}
    />
  )

  if (!startAdornment && !endAdornment && !toggle) return field

  return (
    <XStack position="relative" width="100%" items="center">
      {startAdornment ? (
        <XStack {...well('l')} pointerEvents="none" opacity={0.6}>
          {startAdornment}
        </XStack>
      ) : null}
      {field}
      {toggle ? (
        <XStack
          {...well('r')}
          cursor="pointer"
          {...touch(20)}
          onPress={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'Hide password' : 'Show password'}
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </XStack>
      ) : endAdornment ? (
        <XStack {...well('r')} opacity={0.6}>
          {endAdornment}
        </XStack>
      ) : null}
    </XStack>
  )
})

export { Input }
