'use client'

/**
 * The appearance panel — one screen, mounted wherever a product keeps settings.
 *
 * It exists once because the alternative is each surface growing its own, and
 * three near-identical panels is how "the same product" stops looking like it.
 * hanzo.app, hanzo.chat and the console mount THIS.
 *
 * It deliberately imports NO component library. This is the design system's own
 * control, so it is built from the design system's own tokens — which means it
 * matches every Hanzo surface by construction, mounts in one that uses @hanzo/ui
 * and one that does not, and cannot create a build-order coupling (a package
 * whose types come from a sibling's `dist` cannot be built in a matrix beside
 * it). React is the only dependency, and only because a panel has state.
 *
 * Every control writes a knob @hanzo/design publishes and every ramp multiplies
 * by, so the change reaches the whole product rather than the handful of places
 * that happen to read a token directly — including the ~1600 `fontSize="$n"`
 * call sites, which resolve through `var(--text-*)` since @hanzo/ui 8.0.69.
 *
 * The panel offers STEPS, not a slider. The knob is continuous and the API takes
 * any number, but a person choosing their reading size wants three answers, not
 * a hundred — and a step that is named can be described in support, tested, and
 * restored.
 */
import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { TYPE_MIN, TYPE_MAX } from '@hanzo/design'

import { DEFAULT, apply, read, write, type Preference } from './state'

/** The named type steps. Inside design's clamp, so none can be refused. */
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
const ACCENTS: Array<{ label: string; value?: string }> = [
  { label: 'Default' },
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
      const next: Preference = { ...prev, ...patch }
      // Clearing the accent must REMOVE the key, not store undefined, or a round
      // trip through JSON hands back a key whose value is the string "undefined".
      if ('accent' in patch && patch.accent === undefined) delete next.accent
      apply(next)
      write(next)
      return next
    })
  }, [])

  // Reset means "I have no preference", which is an EMPTY one — not the neutral
  // values written out. Storing `{ type: 1, density: 'default' }` renders the
  // same and behaves differently: those become inline properties on <html> that
  // outrank any brand stylesheet, so the person who pressed Reset would be
  // pinned to the generic scale forever. The panel reads an absent axis as
  // Default already, so this still shows Default selected.
  const reset = useCallback(() => {
    apply({})
    write({})
    setPref({})
  }, [])

  return { pref, set, reset }
}

// Tokens, never literals — this panel is the one screen that must not invent a
// value, because it is the screen that explains the system.
const S = {
  group: { display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' } as CSSProperties,
  panel: { display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' } as CSSProperties,
  row: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' } as CSSProperties,
  title: { fontSize: 'var(--text-base)', fontWeight: 'var(--weight-medium)' as CSSProperties['fontWeight'], color: 'var(--foreground)' } as CSSProperties,
  hint: { fontSize: 'var(--text-xs)', lineHeight: 'var(--leading-xs)', color: 'var(--muted-foreground, var(--foreground))', opacity: 0.7, margin: 0 } as CSSProperties,
  swatch: (c: string): CSSProperties => ({ width: 10, height: 10, borderRadius: 'var(--radius-full)', background: c, flex: '0 0 auto' }),
}

const choice = (on: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-1)',
  height: 28,
  padding: '0 var(--space-3)',
  borderRadius: 'var(--radius-md, 8px)',
  border: `1px solid ${on ? 'var(--border-selected, var(--border))' : 'var(--border)'}`,
  background: on ? 'var(--secondary, rgb(255 255 255 / .10))' : 'transparent',
  color: 'var(--foreground)',
  fontSize: 'var(--text-xs)',
  fontFamily: 'inherit',
  cursor: 'pointer',
})

function Choice({ on, onSelect, children }: { on: boolean; onSelect: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onSelect} style={choice(on)}>
      {children}
    </button>
  )
}

function Group({ title, hint, children }: { title: string; hint: string; children: ReactNode }) {
  return (
    <section style={S.group}>
      <div>
        <div style={S.title}>{title}</div>
        <p style={S.hint}>{hint}</p>
      </div>
      <div style={S.row}>{children}</div>
    </section>
  )
}

export function Appearance() {
  const { pref, set, reset } = useAppearance()
  const type = pref.type ?? 1
  const density = pref.density ?? 'default'
  const touched = type !== 1 || density !== 'default' || !!pref.accent

  return (
    <div style={S.panel}>
      <Group title="Text size" hint={`How large text reads across the product. ${Math.round(TYPE_MIN * 100)}–${Math.round(TYPE_MAX * 100)}%.`}>
        {TYPE_STEPS.map((s) => (
          <Choice key={s.label} on={Math.abs(type - s.value) < 0.001} onSelect={() => set({ type: s.value })}>
            {s.label}
          </Choice>
        ))}
      </Group>

      <Group title="Density" hint="How much room sits between things — padding, gaps and section rhythm.">
        {DENSITIES.map((d) => (
          <Choice key={d.value} on={density === d.value} onSelect={() => set({ density: d.value })}>
            {d.label}
          </Choice>
        ))}
      </Group>

      <Group title="Accent" hint="The one hue this monochrome system spends — on actions and on selection.">
        {ACCENTS.map((a) => (
          <Choice key={a.label} on={pref.accent === a.value} onSelect={() => set({ accent: a.value })}>
            {a.value ? <span style={S.swatch(a.value)} /> : null}
            {a.label}
          </Choice>
        ))}
      </Group>

      {/* Only offered once something has changed — a reset for a state that is
          already the default is a control that does nothing. */}
      {touched ? (
        <div>
          <button type="button" onClick={reset} style={{ ...choice(false), opacity: 0.8 }}>
            Reset to defaults
          </button>
        </div>
      ) : null}
    </div>
  )
}
