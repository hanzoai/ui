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

import { DEFAULT, apply, current, read, write, type Preference } from './state'
import { layerFor, type Layer, type Resolved, type Scope } from './scope'

/** The named type steps. Inside design's clamp, so none can be refused. */
export const TYPE_STEPS = [
  { label: 'Small', value: 0.9 },
  { label: 'Default', value: 1 },
  { label: 'Large', value: 1.15 },
  { label: 'Larger', value: 1.3 },
] as const

/** How far apart the rungs sit. Named for what they DO to a page, because
 *  "1.25" describes the arithmetic and not the reading. */
export const RATIO_STEPS = [
  { label: 'Flat', value: 0.85 },
  { label: 'Default', value: 1 },
  { label: 'Airy', value: 1.2 },
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
export function useAppearance({ org, install, orgPref }: { org?: string; install?: Preference; orgPref?: Preference } = {}) {
  const [pref, setPref] = useState<Preference>(DEFAULT)
  const [from, setFrom] = useState<Resolved['from']>({})
  // Which of the two personal layers a save lands in. It defaults to everywhere
  // — the answer that is right for the person with one org, who is most people,
  // and the only answer that exists when there is no org in scope at all.
  const [scope, setScope] = useState<Scope>('everywhere')

  // The document always shows the RESOLVED stack, never the layer being edited.
  // Editing the org layer while the everywhere layer wins would otherwise paint
  // a preview of a setting that is not in effect.
  const refresh = useCallback(
    (nextScope: Scope = scope) => {
      const r = current({ install, org: orgPref, orgId: org })
      setPref(r.pref)
      setFrom(r.from)
      apply(r.pref)
      setScope(nextScope)
      return r
    },
    [install, orgPref, org, scope],
  )

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, install, orgPref])

  const set = useCallback(
    (patch: Partial<Preference>) => {
      // Patch the LAYER being edited, not the resolved value — writing the
      // resolved one back would copy an org's accent into the person's own
      // preference, and it would stop tracking the org the moment they changed
      // their type size.
      const layer = read({ scope, org })
      const next: Preference = { ...layer, ...patch }
      // Clearing the accent must REMOVE the key, not store undefined, or a round
      // trip through JSON hands back a key whose value is the string "undefined".
      if ('accent' in patch && patch.accent === undefined) delete next.accent
      write(next, { scope, org })
      refresh()
    },
    [scope, org, refresh],
  )

  // Reset means "I have no preference", which is an EMPTY one — not the neutral
  // values written out. Storing `{ type: 1, density: 'default' }` renders the
  // same and behaves differently: those become inline properties on <html> that
  // outrank any brand stylesheet, so the person who pressed Reset would be
  // pinned to the generic scale forever. The panel reads an absent axis as
  // Default already, so this still shows Default selected.
  //
  // It clears the layer in SCOPE and nothing else: resetting a per-org override
  // hands the person back their own everywhere preference rather than wiping
  // that too, and then the org's own setting shows through again — which is why
  // it re-resolves instead of assuming the answer is empty.
  const reset = useCallback(() => {
    write({}, { scope, org })
    refresh()
  }, [scope, org, refresh])

  return { pref, set, reset, scope, setScope: (s: Scope) => refresh(s), from, layer: layerFor(scope) }
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

function Group({
  title,
  hint,
  children,
  by,
  scope,
  org,
}: {
  title: string
  hint: string
  children: ReactNode
  /** Who decided this axis, when it was not decided at the scope being edited. */
  by?: Layer
  scope?: Scope
  org?: string
}) {
  // Say where a value came from when it did not come from here. Without it the
  // panel shows an org's accent as though the person had picked it, and pressing
  // Reset appears to do nothing — the org sets it again on the next resolve.
  const inherited =
    by && by !== layerFor(scope ?? 'everywhere')
      ? by === 'org'
        ? `Set by ${org || 'your organization'}`
        : by === 'install'
          ? 'A default for this install'
          : by === 'user'
            ? 'From your settings for everywhere'
            : `Your setting for ${org || 'this organization'}`
      : null

  return (
    <section style={S.group}>
      <div>
        <div style={S.title}>{title}</div>
        <p style={S.hint}>{hint}</p>
        {inherited ? <p style={{ ...S.hint, opacity: 0.65 }}>{inherited}</p> : null}
      </div>
      <div style={S.row}>{children}</div>
    </section>
  )
}

export function Appearance({ org, orgName, install, orgPref }: { org?: string; orgName?: string; install?: Preference; orgPref?: Preference } = {}) {
  const { pref, set, reset, scope, setScope, from } = useAppearance({ org, install, orgPref })
  const type = pref.type ?? 1
  const ratio = pref.ratio ?? 1
  const density = pref.density ?? 'default'
  const touched = type !== 1 || ratio !== 1 || density !== 'default' || !!pref.accent
  const here = orgName || org

  return (
    <div style={S.panel}>
      {/* Only asked when there is something to ask about. With one org in scope
          — or none — "everywhere" is the only meaning available, and offering a
          choice between one option and itself is noise. */}
      {org ? (
        <Group title="Applies to" hint={`Whether these settings follow you everywhere, or stay with ${here}.`}>
          <Choice on={scope === 'everywhere'} onSelect={() => setScope('everywhere')}>
            Everywhere
          </Choice>
          <Choice on={scope === 'org'} onSelect={() => setScope('org')}>
            Only {here}
          </Choice>
        </Group>
      ) : null}

      <Group
        title="Text size"
        hint={`How large text reads across the product. ${Math.round(TYPE_MIN * 100)}–${Math.round(TYPE_MAX * 100)}%.`}
        by={from.type}
        scope={scope}
        org={here}
      >
        {TYPE_STEPS.map((s) => (
          <Choice key={s.label} on={Math.abs(type - s.value) < 0.001} onSelect={() => set({ type: s.value })}>
            {s.label}
          </Choice>
        ))}
      </Group>

      <Group
        title="Scale"
        hint="How far apart the sizes sit — flat for dense screens, airy where headings should lead."
        by={from.ratio}
        scope={scope}
        org={here}
      >
        {RATIO_STEPS.map((s) => (
          <Choice key={s.label} on={Math.abs(ratio - s.value) < 0.001} onSelect={() => set({ ratio: s.value })}>
            {s.label}
          </Choice>
        ))}
      </Group>

      <Group title="Density" hint="How much room sits between things — padding, gaps and section rhythm." by={from.density} scope={scope} org={here}>
        {DENSITIES.map((d) => (
          <Choice key={d.value} on={density === d.value} onSelect={() => set({ density: d.value })}>
            {d.label}
          </Choice>
        ))}
      </Group>

      <Group title="Accent" hint="The one hue this monochrome system spends — on actions and on selection." by={from.accent} scope={scope} org={here}>
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
            {scope === 'org' ? `Reset for ${here}` : 'Reset to defaults'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
