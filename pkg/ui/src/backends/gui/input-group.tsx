'use client'

/**
 * InputGroup — one field box holding an input and the things that belong to it:
 * a leading search glyph, a currency or calling-code picker, a unit, a clear
 * button, a pair of actions.
 *
 * The box is the group's, not the input's. Its edge, its ground, its height and
 * its focus are drawn here, and an `Input` inside renders as bare text filling
 * whatever its neighbours leave. That is the whole difference from `Input`'s own
 * `startAdornment`, which floats a decoration over the text at 60% and cannot be
 * pressed: an element here takes part in the row, so a picker can open and an
 * action can be clicked, and the text never runs under either.
 *
 * gui has no `:focus-within` and no `:has()`, so focus, invalidity and disabling
 * are lifted from the field through context: the Input reports, the group draws:
 * under focus, its own edge brightened a step and no ring outside it.
 *
 * Structure and states after twenty-ui's InputGroup (MIT, see NOTICE): a row
 * with a 4px gap on the field box, start and end elements that never shrink,
 * the adornments quiet at rest and lifted while the field has focus.
 */
import { XStack } from '@hanzo/gui'
import { createContext, useCallback, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import { BOX, FIELD, FILL, type FieldSize } from './control'
import { fieldSize, useDensity } from './density'
import { slot } from './slot'

type Report = { invalid: boolean; disabled: boolean }

/** What a grouped field reads: the group's box, and the two callbacks it reports through. */
export const GroupContext = /* @__PURE__ */ createContext<{
  size: FieldSize
  focus: (on: boolean) => void
  report: (r: Report) => void
} | null>(null)

export type InputGroupProps = Omit<ComponentProps<typeof XStack>, 'children'> & {
  /** Before the field: an icon, a unit, a picker trigger. */
  start?: ReactNode
  /** After the field: a clear button, actions, a unit. */
  end?: ReactNode
  /** The box (control.ts `BOX`). Unset, the nearest `<Density>` decides. */
  size?: FieldSize
  /** On the raised ground instead of a bare edge (control.ts `FILL`). */
  fill?: boolean
  children?: ReactNode
}

/** The edge under focus: a third of the ink, in either theme (glass.css says the same for the composer). */
const LIT = 'color-mix(in srgb, var(--foreground) 32%, transparent)' as `var(--${string})`

/** Quiet at rest, lifted under focus, dimmer still when the field is disabled. */
const tone = (focused: boolean, disabled: boolean) => (disabled ? 0.4 : focused ? 0.9 : 0.6)

export function InputGroup({ start, end, size, fill = false, children, ...props }: InputGroupProps) {
  const density = useDensity()
  const resolved = fieldSize(size, density)
  const box = BOX[resolved]
  const [focused, setFocused] = useState(false)
  const [state, setState] = useState<Report>({ invalid: false, disabled: false })
  const report = useCallback(
    (r: Report) => setState((s) => (s.invalid === r.invalid && s.disabled === r.disabled ? s : r)),
    [],
  )
  const ctx = useMemo(() => ({ size: resolved, focus: setFocused, report }), [resolved, report])

  // Focus is the box's own edge brightened a step, as the composer's is: one
  // line in place, never a second ring a gap outside it.
  const edge = state.invalid ? (focused ? '$red8' : '$red7') : focused ? LIT : '$borderColor'

  return (
    <GroupContext.Provider value={ctx}>
      <XStack
        {...slot('input-group')}
        data-focused={focused ? '' : undefined}
        data-invalid={state.invalid ? '' : undefined}
        data-disabled={state.disabled ? '' : undefined}
        // The Input sub-theme, so the edge under focus is the Input's own.
        componentName="Input"
        {...FIELD}
        {...(density === 'compact' ? { bg: '$panel' } : null)}
        {...(fill ? FILL : null)}
        borderColor={edge}
        hoverStyle={state.disabled || focused ? undefined : { borderColor: '$borderColorHover' }}
        items="center"
        gap="$1"
        height={box.h}
        width="100%"
        minW={0}
        px={box.gutter}
        cursor={state.disabled ? 'not-allowed' : undefined}
        {...props}
      >
        {start ? (
          <XStack {...slot('input-group-start')} shrink={0} items="center" opacity={tone(focused, state.disabled)}>
            {start}
          </XStack>
        ) : null}
        {children}
        {end ? (
          <XStack {...slot('input-group-end')} shrink={0} items="center" gap="$1" opacity={tone(focused, state.disabled)}>
            {end}
          </XStack>
        ) : null}
      </XStack>
    </GroupContext.Provider>
  )
}
