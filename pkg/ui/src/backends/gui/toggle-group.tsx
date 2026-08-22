'use client'

/**
 * ToggleGroup — the segmented control, on @hanzogui/toggle-group.
 *
 * gui ships the group machinery (single/multiple selection, roving arrow-key
 * focus, `data-state="on|off"`, `aria-pressed`), so this file flattens
 * `ToggleGroup` + `ToggleGroup.Item` into the two shadcn names, adds the
 * `variant`/`size` recipe those names carry, and repairs three things gui does
 * not do for itself.
 *
 * NO RENAMES. type / value / defaultValue / onValueChange / disabled /
 * orientation / rovingFocus / loop / dir / variant / size are the Radix +
 * shadcn spellings, and `variant`/`size` still resolve the shadcn way: set on
 * the GROUP they win for every item, otherwise each item decides for itself.
 *
 * WORKED AROUND, 1 — SELECTION WAS UNREADABLE TO A SCREEN READER in `single`
 * mode. Radix gives a single-select group `role="radiogroup"` and each item
 * `role="radio"` + `aria-checked`; gui keeps `role="group"` and, for single,
 * deletes `aria-pressed` (correct — an exclusive choice is not a pressed
 * button) without putting the radio semantics back. So the selected segment
 * announced as an ordinary unlabelled button with no state at all. The roles
 * are restored here, `toolbar` + `aria-pressed` for `multiple` exactly as Radix
 * has it, and that is why this file mirrors the value at all: `aria-checked`
 * needs to know which item is on, and gui's value context is internal.
 *
 * The mirror is not a second source of truth — it is THE source. gui is handed
 * `value` + `onValueChange` from it, i.e. driven as a controlled component, so
 * there is exactly one place the current value lives whether the call site
 * controls it or not.
 *
 * WORKED AROUND, 2 — a horizontal group laid out VERTICALLY. `ToggleGroupImpl`
 * consumes `orientation` for the roving-focus axis and never forwards it, and
 * its frame is a plain `View`, which stacks. Radix's was a `<div>` that call
 * sites made a row with `flex`. The axis is restored here from the same prop.
 *
 * WORKED AROUND, 3 — `size` on a gui toggle means a SQUARE (its variant sets
 * width AND height from one token), which is not what `size="sm"` means on a
 * labelled segment. Items render `unstyled` and this file supplies the whole
 * recipe, so the shadcn ladder (height + horizontal padding + type scale) is
 * what the prop actually does.
 */
import { ToggleGroup as GuiToggleGroup, useControllableState } from '@hanzo/gui'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'
import { ink } from './ink'
import { slot } from './slot'
import { touch } from './gesture'

export type ToggleGroupVariant = 'default' | 'outline'
export type ToggleGroupSize = 'default' | 'sm' | 'lg'

/** Density ladder — the Button's, so a toggle and a button line up in a row. */
const HEIGHT: Record<ToggleGroupSize, number> = { default: 36, sm: 32, lg: 40 }
const PAD = { default: '$3', sm: '$2.5', lg: '$4' } as const
const TYPE = { default: '$3', sm: '$2', lg: '$3' } as const

/** Resting fill per variant. `outline` is the one that draws its own edge. */
const REST = {
  default: {
    backgroundColor: '$hover',
    borderColor: 'transparent',
    hoverStyle: { backgroundColor: '$edge' },
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '$borderColor',
    hoverStyle: { backgroundColor: '$hover' },
  },
} as const

/**
 * The ON treatment. gui merges `activeStyle` into hover and focus as well as
 * rest, so the selected segment keeps its fill under the pointer — which is the
 * whole reason this is `activeStyle` and not a conditional prop. Fill AND edge
 * move together: one step of grey is what a segmented control has to say with,
 * and the label brightens alongside it (see `ink` below).
 */
const ON = {
  default: { backgroundColor: '$rim', borderColor: '$bound' },
  outline: { backgroundColor: '$raised', borderColor: '$bound' },
} as const

/** The system's WCAG-checked ring — `unstyled` items lose gui's, so restore it. */
const RING = { outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' } as const

type Value = string | string[]

/**
 * What the group knows and the item needs: the selection (for `aria-checked`
 * and the label colour), the type (for which role to wear), and the recipe the
 * group set — held UNRESOLVED, because shadcn's rule is that a group-level
 * `variant`/`size` wins and an absent one lets each item choose.
 */
type GroupContextValue = {
  type: 'single' | 'multiple'
  selected: readonly string[]
  variant?: ToggleGroupVariant
  size?: ToggleGroupSize
  disabled?: boolean
}

const GroupContext = /* @__PURE__ */ createContext<GroupContextValue>({
  type: 'multiple',
  selected: [],
})

export type ToggleGroupProps = Omit<ComponentProps<typeof GuiToggleGroup>, 'size'> & {
  variant?: ToggleGroupVariant
  size?: ToggleGroupSize
  children?: ReactNode
}

function ToggleGroup({
  type,
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  disableDeactivation,
  variant,
  size,
  disabled,
  children,
  ...props
}: ToggleGroupProps) {
  const [current, setCurrent] = useControllableState<Value>({
    prop: value,
    defaultProp: defaultValue!,
    onChange: onValueChange as (next: Value) => void,
  })
  const selected = current ? (Array.isArray(current) ? current : [current]) : []

  return (
    <GuiToggleGroup
      {...slot('toggle-group')}
      // One cast, for the discriminated quartet only: `type` narrows `value`,
      // `onValueChange` and `disableDeactivation` in gui's union, and this
      // component's own props are that same union widened by variant/size — TS
      // cannot re-narrow it from destructured variables. They travel together
      // through the cast so that none of them survives in `...props` to be
      // checked against the wrong arm. Everything else stays type-checked.
      {...({
        type,
        value: current,
        onValueChange: setCurrent,
        disableDeactivation,
      } as ComponentProps<typeof GuiToggleGroup>)}
      role={type === 'single' ? 'radiogroup' : 'toolbar'}
      orientation={orientation}
      disabled={disabled}
      flexDirection={orientation === 'vertical' ? 'column' : 'row'}
      items="center"
      gap="$1"
      {...props}
    >
      <GroupContext.Provider value={{ type, selected, variant, size, disabled }}>
        {children}
      </GroupContext.Provider>
    </GuiToggleGroup>
  )
}

export type ToggleGroupItemProps = Omit<
  ComponentProps<typeof GuiToggleGroup.Item>,
  'size'
> & {
  variant?: ToggleGroupVariant
  size?: ToggleGroupSize
}

function ToggleGroupItem({ variant, size, disabled, children, ...props }: ToggleGroupItemProps) {
  const group = useContext(GroupContext)
  const v = group.variant ?? variant ?? 'default'
  const s = group.size ?? size ?? 'default'
  const on = group.selected.includes(props.value)
  const off = disabled || group.disabled

  return (
    <GuiToggleGroup.Item
      {...slot('toggle-group-item')}
      data-variant={v}
      data-size={s}
      // The two Radix semantics gui drops in `single` mode. `aria-pressed` is
      // left alone for `multiple`, where gui already sets it from the same state.
      role={group.type === 'single' ? 'radio' : undefined}
      aria-checked={group.type === 'single' ? on : undefined}
      unstyled
      flexDirection="row"
      items="center"
      justify="center"
      height={HEIGHT[s]}
      px={PAD[s]}
      gap="$1.5"
      borderWidth={1}
      rounded="$3"
      select="none"
      disabled={off}
      opacity={off ? 0.5 : 1}
      cursor={off ? 'not-allowed' : 'pointer'}
      focusVisibleStyle={RING}
      {...REST[v]}
      activeStyle={ON[v]}
      {...touch(HEIGHT[s], 44, 'y')}
      {...props}
    >
      {/* The label carries the state too. A fill that moves one rung of grey is
          legible next to its neighbours and invisible on its own — a page of
          screenshots, a narrow column and a low-vision reader all lose it. The
          text colour is read from the same value the fill is. */}
      {ink(children, undefined, {
        size: TYPE[s],
        fontWeight: '500',
        color: on ? '$ink' : '$quiet',
      })}
    </GuiToggleGroup.Item>
  )
}

export { ToggleGroup, ToggleGroupItem }
