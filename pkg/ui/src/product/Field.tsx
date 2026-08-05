'use client'

/**
 * Form field primitives — labeled rows over Hanzo GUI inputs.
 *
 * One way to render a labeled control. Every editor field goes through these, so
 * spacing, disabled styling, and the label column stay consistent. Style props
 * use the v5 shorthand set (p/px/items/justify/...).
 */
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'
import {
  Input,
  Label,
  Switch,
  TextArea,
  Slider,
  Text,
  XStack,
  YStack,
} from '@hanzo/gui'

import { textSize, useEmit, type UiEvent } from './instrument'
import { masked } from './SecretInput'

// The label the caller ALREADY typed on the FieldRow becomes the analytics name —
// so an app never labels a field twice and no field reports as "unnamed".
const FieldNameContext = createContext<string | undefined>(undefined)

/** Every Field* control reports `{component, action:'change', id:<row label>}`;
 *  the VALUE is only ever a scalar or a text LENGTH, never free text. */
function useFieldTrack(component: string): (e: Omit<UiEvent, 'component'>) => void {
  const track = useEmit()
  const name = useContext(FieldNameContext)
  return (e) => track({ component, id: name, ...e })
}

/**
 * Labeled row. STACKED on phones (label full-width above a full-width control) so a
 * form inside a SlideOver stays usable and never clips its labels; a fixed 180px
 * label column + flexing control at $md+ (the two-column desktop/tablet layout).
 */
export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <FieldNameContext.Provider value={label}>
    <XStack gap="$3" items="flex-start" flexWrap="wrap">
      <Label width="100%" pt="$2" color="$color11" fontSize="$3" $md={{ width: 180 }}>
        {label}
      </Label>
      <YStack flex={1} minW={0} $md={{ minW: 240 }}>
        {children}
      </YStack>
    </XStack>
    </FieldNameContext.Provider>
  )
}

export function FieldText({
  value,
  onChange,
  disabled,
  secure,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  secure?: boolean
  placeholder?: string
}) {
  const track = useFieldTrack('FieldText')
  return (
    <Input
      value={value}
      onChangeText={(v: string) => {
        track({ action: 'change', value: secure ? 0 : textSize(v) })
        onChange(v)
      }}
      disabled={disabled}
      // `secureTextEntry` ALONE rendered the secret in plain text on web — gui
      // drops the native spelling there. `masked` sets both names. Every
      // `<FieldText secure>` in the fleet was unmasked until this line.
      {...masked(Boolean(secure))}
      placeholder={placeholder}
      autoCapitalize="none"
    />
  )
}

export function FieldTextArea({
  value,
  onChange,
  disabled,
  rows = 6,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  rows?: number
}) {
  const track = useFieldTrack('FieldTextArea')
  return (
    <TextArea
      value={value}
      onChangeText={(v: string) => {
        track({ action: 'change', value: textSize(v) })
        onChange(v)
      }}
      disabled={disabled}
      numberOfLines={rows}
    />
  )
}

export function FieldSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  const track = useFieldTrack('FieldSwitch')
  return (
    <Switch
      checked={checked}
      onCheckedChange={(v: boolean) => {
        track({ action: 'change', value: v })
        onChange(v)
      }}
      disabled={disabled}
      size="$3"
    >
      <Switch.Thumb />
    </Switch>
  )
}

/**
 * A labeled dropdown.
 *
 * Renders a REAL native `<select>` on web (and the OS-native picker on mobile),
 * NOT the `@hanzo/gui` `<Select native>` — that primitive is broken in gui 7.3.0:
 * `native` emits bare `<option>` elements with NO `<select>` wrapper, so every
 * dropdown across the console (region/size pickers, all edit forms) rendered as a
 * non-interactive flat list of option text that buried the surrounding controls.
 * A native `<select>` is compact, keyboard/ARIA-accessible, gives the native
 * mobile picker (best small-screen UX), and is themed via the Tamagui CSS custom
 * properties (`--background`/`--color12`/`--borderColor`) so it tracks light/dark.
 */
const CHEVRON = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
)}`

function selectStyle(disabled?: boolean): CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    appearance: 'none',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    background: `var(--background) url("${CHEVRON}") no-repeat right 10px center`,
    color: 'var(--color12)',
    border: '1px solid var(--borderColor)',
    borderRadius: 9,
    padding: '9px 34px 9px 12px',
    fontSize: 14,
    lineHeight: '20px',
    fontFamily: 'inherit',
    height: 40,
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
  }
}

const OPTION_STYLE: CSSProperties = { background: 'var(--color2)', color: 'var(--color12)' }

export function FieldSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder = 'Select…',
}: {
  value: string
  options: string[]
  onChange: (v: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  // When the current value isn't one of the options (empty/unset), show the
  // placeholder as a selected-but-disabled row so the control reads honestly.
  const track = useFieldTrack('FieldSelect')
  const showPlaceholder = value === '' || !options.includes(value)
  return (
    <select
      value={showPlaceholder ? '' : value}
      onChange={(e) => {
        track({ action: 'change', value: e.currentTarget.value })
        onChange(e.currentTarget.value)
      }}
      disabled={disabled}
      aria-label={placeholder}
      style={selectStyle(disabled)}
    >
      {showPlaceholder ? (
        <option value="" disabled style={OPTION_STYLE}>
          {placeholder}
        </option>
      ) : null}
      {options.map((opt) => (
        <option key={opt} value={opt} style={OPTION_STYLE}>
          {opt}
        </option>
      ))}
    </select>
  )
}

export function FieldSlider({
  value,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  const track = useFieldTrack('FieldSlider')
  return (
    <XStack gap="$3" items="center">
      <Text width={56} fontSize="$3" color="$color11">
        {value}
      </Text>
      <Slider
        flex={1}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(v) => {
          track({ action: 'change', value: v[0] ?? min })
          onChange(v[0] ?? min)
        }}
        disabled={disabled}
      >
        <Slider.Track>
          <Slider.TrackActive />
        </Slider.Track>
        <Slider.Thumb index={0} circular />
      </Slider>
    </XStack>
  )
}
