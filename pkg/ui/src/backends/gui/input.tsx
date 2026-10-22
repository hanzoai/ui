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
import { forwardRef, useContext, useEffect, useState, type ComponentProps, type ReactNode } from 'react'
import { slot } from './slot'
import { touch } from './gesture'
import { masked } from './mask'
import { BOX, FIELD, FILL, type FieldSize } from './control'
import { fieldSize, useDensity } from './density'
import { GroupContext } from './input-group'
import { invalidOf, useField } from './field'
import { ltr } from './dir'

/** What an adornment takes past the gutter: its 16px mark and 8 beside it. */
const MARK = 24

/** The height a field takes under a coarse pointer: a thumb, not a cursor (Button's floor). */
const TOUCH = 44

export type InputProps = Omit<ComponentProps<typeof GuiInput>, 'children' | 'size'> & {
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
  /**
   * The box: `default` 36 high, `lg` 46 for a page's own form, `sm` 32 and `xs`
   * 24 for the record density (control.ts `BOX`). Unset, the nearest `<Density>`
   * decides; inside an `InputGroup` the group's box is the field's.
   */
  size?: FieldSize
  /** On the raised ground instead of a bare edge (control.ts `FILL`). */
  fill?: boolean
}

const well = (side: 'start' | 'end', gutter: number) =>
  ({
    position: 'absolute' as const,
    [side === 'start' ? 'insetInlineStart' : 'insetInlineEnd']: gutter,
    t: 0,
    b: 0,
    items: 'center' as const,
    justify: 'center' as const,
  })

const Input = /* @__PURE__ */ forwardRef<HTMLInputElement, InputProps>(function Input(
  { startAdornment, endAdornment, reveal = true, type, secureTextEntry, size, fill = false, ...props },
  ref,
) {
  const [revealed, setRevealed] = useState(false)
  const density = useDensity()
  const group = useContext(GroupContext)
  const isPassword = type === 'password' || secureTextEntry === true
  const machine = type === 'email' || type === 'url'
  const toggle = isPassword && reveal
  const box = BOX[group?.size ?? fieldSize(size, density)]
  const inset = box.gutter + MARK
  // Its own `aria-invalid` first, else the enclosing Field's stated validity —
  // the one rule Textarea and SelectTrigger read too (field.tsx `invalidOf`).
  const enclosing = useField()
  const invalid = invalidOf((props as { 'aria-invalid'?: unknown })['aria-invalid'], enclosing)
  const disabled = !!(props as { disabled?: boolean }).disabled
  const report = group?.report
  useEffect(() => report?.({ invalid, disabled }), [report, invalid, disabled])

  // Inside a group the GROUP is the box — its edge, its fill, its focus — and the
  // field is the text that fills the space its adornments leave.
  if (group) {
    const { onFocus, onBlur } = props as { onFocus?: (e: unknown) => void; onBlur?: (e: unknown) => void }
    return (
      <GuiInput
        ref={ref as never}
        {...slot('input')}
        {...(isPassword ? masked(!revealed) : { type, secureTextEntry })}
        flex={1}
        minW={0}
        height={box.h - 2}
        px={0}
        borderWidth={0}
        rounded={0}
        bg="transparent"
        color="$ink"
        placeholderTextColor="$placeholderColor"
        fontSize={box.font}
        {...(invalid ? { 'aria-invalid': true } : null)}
        {...props}
        // The group draws the one focus ring, round the whole box. Inline,
        // because design's `:focus-visible` outline is a stylesheet rule and
        // only an inline declaration is certain to outrank it here.
        style={{ ...((props as { style?: object }).style ?? null), outlineStyle: 'none' }}
        onFocus={(e: unknown) => {
          group.focus(true)
          onFocus?.(e)
        }}
        onBlur={(e: unknown) => {
          group.focus(false)
          onBlur?.(e)
        }}
      />
    )
  }

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
      // The record density's ground: a field that reads as a field on a page of
      // cells and chips, the 3% panel rung under its hairline.
      {...(density === 'compact' ? { bg: '$panel' } : null)}
      {...(fill ? FILL : null)}
      {...(invalid ? { borderColor: '$red7', focusStyle: { borderColor: '$red8' } } : null)}
      height={box.h}
      // Raised, never lowered: a caller that states its own height keeps it.
      {...('height' in props ? null : { $touchable: { height: Math.max(box.h, TOUCH) } })}
      width="100%"
      minW={0}
      // The value at the full ink, the hint at the placeholder token. gui's
      // Input sub-theme draws its value at 80% grey, which left a typed value
      // and a sample placeholder one rung apart.
      color="$ink"
      placeholderTextColor="$placeholderColor"
      fontSize={box.font}
      {...(invalid ? { 'aria-invalid': true } : null)}
      paddingInlineStart={startAdornment ? inset : box.gutter}
      paddingInlineEnd={endAdornment || toggle ? inset : box.gutter}
      {...props}
    />
  )

  if (!startAdornment && !endAdornment && !toggle) return field

  return (
    // An email or URL reads left to right in any language, and its wells sit
    // where its text starts and ends: the whole field is one LTR island, or the
    // text's own padding (LTR) and the wells (the page's RTL) name opposite sides.
    <XStack position="relative" width="100%" items="center" {...(machine ? ltr : null)}>
      {startAdornment ? (
        <XStack {...well('start', box.gutter)} pointerEvents="none" opacity={0.6}>
          {startAdornment}
        </XStack>
      ) : null}
      {field}
      {toggle ? (
        <XStack
          // Before `well`: on web `touch` writes `position: relative`, which
          // after the well's `absolute` put the eye in flow beside the input,
          // 4px past the field's edge instead of inside its end well.
          {...touch(20)}
          {...well('end', box.gutter)}
          cursor="pointer"
          onPress={() => setRevealed((v) => !v)}
          aria-label={revealed ? 'Hide password' : 'Show password'}
        >
          {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
        </XStack>
      ) : endAdornment ? (
        <XStack {...well('end', box.gutter)} opacity={0.6}>
          {endAdornment}
        </XStack>
      ) : null}
    </XStack>
  )
})

export { Input }
