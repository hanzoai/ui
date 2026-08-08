'use client'

/**
 * The appearance panel — one screen, mounted wherever a product keeps settings.
 *
 * It exists once because the alternative is each surface growing its own, and
 * three near-identical panels is how "the same product" stops looking like it.
 * hanzo.app, hanzo.chat and the console mount THIS.
 *
 * Every control writes a knob @hanzo/design publishes and every ramp multiplies
 * by, so the change reaches the whole product rather than the handful of places
 * that happen to read a token directly — including the ~1600 `fontSize="$n"`
 * call sites, which resolve through `var(--text-*)` since @hanzo/ui 8.0.69.
 *
 * The panel deliberately offers STEPS, not a slider. The knob is continuous and
 * the API accepts any number, but a person choosing their reading size wants
 * three answers, not a hundred — and a step that is named can be described in
 * support, tested, and restored.
 */
import { useCallback, useEffect, useState } from 'react'
import { XStack, YStack, Paragraph, SizableText, Button } from '@hanzo/ui'
import { TYPE_MIN, TYPE_MAX } from '@hanzo/design'

import { DEFAULT, apply, read, write, type Preference } from './state'

/** The named type steps. Inside design's clamp, so none of them can be refused. */
export const TYPE_STEPS = [
  { label: 'Small', value: 0.9 },
  { label: 'Default', value: 1 },
  { label: 'Large', value: 1.15 },
  { label: 'Larger', value: 1.3 },
] as const

const DENSITIES = [
  { label: 'Compact', value: 'compact' as const },
  { label: 'Default', value: 'default' as const },
  { label: 'Comfortable', value: 'comfortable' as const },
]

/** A monochrome brand spends exactly one hue, so these are starting points, not
 *  a palette — and "Default" is first because most people want the brand. */
const ACCENTS = [
  { label: 'Default', value: undefined },
  { label: 'Olive', value: '#808000' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
]

/**
 * Read the stored preference and keep the document in step with it.
 *
 * Applied on mount as well as on change: the inline boot script sets type and
 * density before first paint, but it deliberately does not validate a colour, so
 * the mount is where an accent actually lands.
 */
export function useAppearance() {
  const [pref, setPref] = useState<Preference>(DEFAULT)

  useEffect(() => {
    const stored = read()
    setPref(stored)
    apply(stored)
  }, [])

  const set = useCallback((patch: Partial<Preference>) => {
    setPref((prev) => {
      const next = { ...prev, ...patch }
      // Clearing the accent must REMOVE it, not store undefined, or read() would
      // hand back a key whose value is the string "undefined" after a round trip.
      if (patch.accent === undefined && 'accent' in patch) delete (next as Preference).accent
      apply(next)
      write(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    apply(DEFAULT)
    write(DEFAULT)
    setPref(DEFAULT)
  }, [])

  return { pref, set, reset }
}

function Row({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2">
      <YStack gap="$0.5">
        <SizableText fontSize="$3" fontWeight="500" color="$color">{title}</SizableText>
        <Paragraph fontSize="$1" color="$color11">{hint}</Paragraph>
      </YStack>
      <XStack flexDirection="row" alignItems="center" gap="$2" flexWrap="wrap">{children}</XStack>
    </YStack>
  )
}

/** One choice in a row. Selected state is a filled surface, not a border move —
 *  an edge that shifts by a hair is a state nobody can see. */
function Choice({ on, onPress, children }: { on: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <Button
      size="sm"
      variant={on ? undefined : 'outline'}
      onClick={onPress}
      aria-pressed={on}
      height={28}
      paddingHorizontal="$3"
      borderRadius="$4"
      backgroundColor={on ? '$color5' : '$color04'}
      borderColor={on ? '$color8' : '$color06'}
      hoverStyle={{ backgroundColor: on ? '$color6' : '$color08' }}
    >
      <SizableText fontSize="$1" color="$color12">{children}</SizableText>
    </Button>
  )
}

export function Appearance() {
  const { pref, set, reset } = useAppearance()
  const type = pref.type ?? 1
  const touched = type !== 1 || (pref.density ?? 'default') !== 'default' || !!pref.accent

  return (
    <YStack gap="$4">
      <Row title="Text size" hint={`How large text reads across the product. ${Math.round(TYPE_MIN * 100)}–${Math.round(TYPE_MAX * 100)}%.`}>
        {TYPE_STEPS.map((s) => (
          <Choice key={s.label} on={Math.abs(type - s.value) < 0.001} onPress={() => set({ type: s.value })}>
            {s.label}
          </Choice>
        ))}
      </Row>

      <Row title="Density" hint="How much room sits between things — padding, gaps and section rhythm.">
        {DENSITIES.map((d) => (
          <Choice key={d.value} on={(pref.density ?? 'default') === d.value} onPress={() => set({ density: d.value })}>
            {d.label}
          </Choice>
        ))}
      </Row>

      <Row title="Accent" hint="The one hue this monochrome system spends — on actions and on selection.">
        {ACCENTS.map((a) => (
          <Choice key={a.label} on={(pref.accent ?? undefined) === a.value} onPress={() => set({ accent: a.value })}>
            <XStack flexDirection="row" alignItems="center" gap="$1.5">
              {a.value ? (
                <XStack width={10} height={10} borderRadius="$10" backgroundColor={a.value} />
              ) : null}
              <SizableText fontSize="$1" color="$color12">{a.label}</SizableText>
            </XStack>
          </Choice>
        ))}
      </Row>

      {/* Only offered once something has changed — a reset for a state that is
          already the default is a control that does nothing. */}
      {touched ? (
        <XStack flexDirection="row">
          <Button size="sm" variant="outline" height={28} paddingHorizontal="$3" borderRadius="$4" onClick={reset}>
            <SizableText fontSize="$1" color="$color11">Reset to defaults</SizableText>
          </Button>
        </XStack>
      ) : null}
    </YStack>
  )
}
