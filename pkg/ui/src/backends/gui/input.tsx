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
import { masked } from './mask'
import { CONTROL_H, FIELD, GUTTER } from './control'

const HEIGHT = CONTROL_H
/** Width reserved for an adornment inside the field. */
const WELL = 36

export type InputProps = Omit<ComponentProps<typeof GuiInput>, 'children'> & {
  /** Optional leading affordance (icon/text) rendered inside the field. */
  startAdornment?: ReactNode
  /** Optional trailing affordance rendered inside the field. */
  endAdornment?: ReactNode
  /**
   * Whether a masked field draws its own show/hide eye. Default true.
   *
   * `false` when the caller owns the reveal — `SecretInput` does, and so does
   * any field that masks locally — because two controls over one boolean is a
   * field with two states that disagree: press ours and the caller's icon still
   * reads "show", press theirs and ours does. The field is masked by whichever
   * was pressed last and neither control can say which.
   */
  reveal?: boolean
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
  { startAdornment, endAdornment, reveal = true, type, secureTextEntry, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password' || secureTextEntry === true
  const toggle = isPassword && reveal

  const field = (
    <GuiInput
      ref={ref as never}
      {...slot('input')}
      // BOTH spellings, via `masked`, and that is not belt-and-braces.
      //
      // This passed `secureTextEntry` alone and dropped `type` on the floor
      // (destructured out, never forwarded), and gui drops `secureTextEntry` on
      // web — so `<Input type="password">` rendered the password IN PLAIN TEXT
      // in every browser, with the eye sitting next to it offering to reveal
      // what was already visible. `@hanzo/ui/product`'s `masked` was written for
      // exactly this and this component never called it.
      //
      // Only on the password path: `masked(false)` states `type="text"`, which
      // would overwrite a caller's `type="email"` or `type="search"`.
      {...(isPassword ? masked(!revealed) : { type, secureTextEntry })}
      // A pin, and correct here. `<input>` is single-line: no children, no
      // wrapping, so its content CANNOT exceed the box and there is nothing to
      // clip. gui's Input does not accept `minHeight` at all, which is the type
      // system saying the same thing. The floor rule is for controls that hold
      // children — Button and SelectTrigger.
      {...FIELD}
      height={HEIGHT}
      width="100%"
      minW={0}
      placeholderTextColor="$soft"
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
