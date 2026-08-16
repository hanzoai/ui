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

import { load, save, type Account } from './account'
import { TYPE_MIN, TYPE_MAX } from '@hanzo/design'

import type { Face, Measure } from '@hanzo/design'

import { DEFAULT, apply, current, read, write, type Preference } from './state'
import { layerFor, type Layer, type Resolved, type Scope } from './scope'

/** The named type steps. Inside design's clamp, so none can be refused. */
export const TYPE_STEPS = [
  { label: 'S', title: 'Small', value: 0.9 },
  { label: 'M', title: 'Default', value: 1 },
  { label: 'L', title: 'Large', value: 1.15 },
  { label: 'XL', title: 'Larger', value: 1.3 },
] as const

/** How far apart the rungs sit. Named for what they DO to a page, because
 *  "1.25" describes the arithmetic and not the reading. */
export const RATIO_STEPS = [
  { label: 'Flat', title: 'Sizes sit close together — dense screens', value: 0.85 },
  { label: 'Default', title: 'The published scale', value: 1 },
  { label: 'Airy', title: 'Headings lead further — reading pages', value: 1.2 },
] as const

/**
 * The classical modular scales, named the way designers name them.
 *
 * "Default" is the ABSENCE of one — the authored ramp, which is tuned rather
 * than generated and is what almost everyone should read. The rest replace the
 * display half with a geometric scale; the interface rungs never move, because
 * a geometric scale has no 13px nav label in it.
 *
 * Golden is exactly 1.618. Its top rungs are enormous by construction — a
 * classical scale is used with about four steps and this ramp has eight — which
 * is why design clamps every rung at both ends rather than clamping the ratio
 * down to something that is no longer golden.
 */
export const MODULAR_STEPS: Array<{ label: string; title: string; value?: number }> = [
  { label: 'Default', title: 'The authored ramp — tuned, not generated' },
  { label: 'Minor 3rd', title: 'A gentle scale (1.2)', value: 1.2 },
  { label: 'Major 3rd', title: 'What this ramp already approximates (1.25)', value: 1.25 },
  { label: '4th', title: 'A perfect fourth (1.333) — strong headings', value: 1.3333 },
  { label: 'Golden', title: 'The golden ratio (1.618) — display-first', value: 1.618 },
]

const DENSITIES = [
  { label: 'Tight', value: 'compact' as const },
  { label: 'Default', value: 'default' as const },
  { label: 'Roomy', value: 'comfortable' as const },
]

/** The faces `tokens/fonts.css` declares. Each option is SET in the face it
 *  names, so the control shows its own answer instead of describing it. */
const FACES: Array<{ label: string; value: Face; preview?: string }> = [
  { label: 'Sans', value: 'default' },
  { label: 'System', value: 'system', preview: 'ui-sans-serif, system-ui' },
  { label: 'Serif', value: 'serif', preview: 'var(--font-serif)' },
  { label: 'Mono', value: 'mono', preview: 'var(--font-mono)' },
]

/** How far the page runs before it wraps — the measure, not the window. */
const MEASURES: Array<{ label: string; value: Measure }> = [
  { label: 'Narrow', value: 'narrow' },
  { label: 'Default', value: 'default' },
  { label: 'Wide', value: 'wide' },
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
export function useAppearance({
  org,
  install,
  orgPref,
  account,
}: {
  org?: string
  install?: Preference
  orgPref?: Preference
  /**
   * The signed-in person's account, if there is one. Given it, the preference
   * belongs to the PERSON and follows them to every origin; without it the device
   * is all there is, which is the honest best for someone signed out.
   */
  account?: Account
} = {}) {
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

  // What the PERSON chose, which the device may not have seen: they set it on
  // another origin, or on another machine. It lands in the device layer because
  // that is the layer the panel edits and the boot script reads, so the next load
  // paints it before a fetch could return.
  //
  // Absent means the account has nothing to say -- signed out, offline, never set
  // -- and then the device's own answer stands rather than being cleared by a
  // round trip that failed.
  useEffect(() => {
    if (!account) return
    let live = true
    void load(account).then((theirs) => {
      if (!live || !theirs) return
      write(theirs, { scope: 'everywhere' })
      refresh()
    })
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.base, account?.token])

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
      // The device has it either way; the account is what makes it travel. A
      // failed save is not surfaced because the choice is already in effect here
      // and reconciles on the next successful write.
      if (account && scope === 'everywhere') void save(next, account)
    },
    [scope, org, refresh, account],
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
    if (account && scope === 'everywhere') void save({}, account)
  }, [scope, org, refresh, account])

  return { pref, set, reset, scope, setScope: (s: Scope) => refresh(s), from, layer: layerFor(scope) }
}

// Tokens, never literals — this panel is the one screen that must not invent a
// value, because it is the screen that explains the system.
//
// The layout is ROWS: a label on the left, its control on the right, one per
// axis. It reads as a preferences list rather than a settings page, which is
// what lets the same component sit in a popover and in a settings tab without a
// second layout to keep in step.
const S = {
  panel: { display: 'flex', flexDirection: 'column' } as CSSProperties,
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    minHeight: 40,
    paddingBlock: 'var(--space-2)',
    flexWrap: 'wrap',
  } as CSSProperties,
  label: { fontSize: 'var(--text-sm)', color: 'var(--foreground)', whiteSpace: 'nowrap' } as CSSProperties,
  note: {
    fontSize: 'var(--text-xs)',
    lineHeight: 'var(--leading-xs)',
    color: 'var(--muted-foreground, var(--foreground))',
    opacity: 0.6,
    margin: 0,
  } as CSSProperties,
  // One track, the options inside it — so the choice reads as one control with a
  // position, not as N buttons that happen to sit together.
  track: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    padding: 2,
    borderRadius: 'var(--radius-full)',
    background: 'var(--secondary, rgb(255 255 255 / .06))',
  } as CSSProperties,
  swatch: (c?: string): CSSProperties => ({
    width: 14,
    height: 14,
    borderRadius: 'var(--radius-full)',
    background: c ?? 'var(--foreground)',
    opacity: c ? 1 : 0.35,
    flex: '0 0 auto',
  }),
}

const choice = (on: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 'var(--space-1)',
  height: 24,
  padding: '0 var(--space-2)',
  borderRadius: 'var(--radius-full)',
  border: '1px solid transparent',
  background: on ? 'var(--surface-card, rgb(255 255 255 / .10))' : 'transparent',
  color: on ? 'var(--foreground)' : 'var(--muted-foreground, var(--foreground))',
  opacity: on ? 1 : 0.7,
  fontSize: 'var(--text-xs)',
  fontFamily: 'inherit',
  cursor: 'pointer',
})

function Choice({
  on,
  onSelect,
  children,
  title,
  style,
}: {
  on: boolean
  onSelect: () => void
  children: ReactNode
  /** The long name, when the label had to be short enough to fit the track. */
  title?: string
  style?: CSSProperties
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onSelect}
      title={title}
      aria-label={title}
      style={{ ...choice(on), ...style }}
    >
      {children}
    </button>
  )
}

/** One axis: what it is, and the control that sets it. */
function Row({
  label,
  children,
  by,
  scope,
  org,
}: {
  label: string
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
            ? 'Your setting for everywhere'
            : `Your setting for ${org || 'this organization'}`
      : null

  return (
    <div style={S.row}>
      <div>
        <div style={S.label}>{label}</div>
        {inherited ? <p style={S.note}>{inherited}</p> : null}
      </div>
      <div style={S.track}>{children}</div>
    </div>
  )
}

export function Appearance({ org, orgName, install, orgPref, account }: { org?: string; orgName?: string; install?: Preference; orgPref?: Preference; account?: Account } = {}) {
  const { pref, set, reset, scope, setScope, from } = useAppearance({ org, install, orgPref, account })
  const type = pref.type ?? 1
  const ratio = pref.ratio ?? 1
  const near = (a: number, b: number) => Math.abs(a - b) < 0.001
  const touched =
    type !== 1 || ratio !== 1 || pref.modular !== undefined || (pref.density ?? 'default') !== 'default' ||
    (pref.font ?? 'default') !== 'default' || (pref.width ?? 'default') !== 'default' || !!pref.accent
  const here = orgName || org

  return (
    <div style={S.panel}>
      {/* Only asked when there is something to ask about. With one org in scope
          — or none — "everywhere" is the only meaning available, and offering a
          choice between one option and itself is noise. */}
      {org ? (
        <Row label="Applies to">
          <Choice on={scope === 'everywhere'} onSelect={() => setScope('everywhere')}>
            Everywhere
          </Choice>
          <Choice on={scope === 'org'} onSelect={() => setScope('org')}>
            {here}
          </Choice>
        </Row>
      ) : null}

      <Row label="Text size" by={from.type} scope={scope} org={here}>
        {TYPE_STEPS.map((s) => (
          <Choice key={s.label} on={near(type, s.value)} onSelect={() => set({ type: s.value })} title={s.title}>
            {s.label}
          </Choice>
        ))}
      </Row>

      <Row label="Scale" by={from.ratio} scope={scope} org={here}>
        {RATIO_STEPS.map((s) => (
          <Choice key={s.label} on={near(ratio, s.value)} onSelect={() => set({ ratio: s.value })} title={s.title}>
            {s.label}
          </Choice>
        ))}
      </Row>

      <Row label="Scale system" by={from.modular} scope={scope} org={here}>
        {MODULAR_STEPS.map((m) => (
          <Choice
            key={m.label}
            on={m.value === undefined ? pref.modular === undefined : Math.abs((pref.modular ?? 0) - m.value) < 0.001}
            onSelect={() => set({ modular: m.value })}
            title={m.title}
          >
            {m.label}
          </Choice>
        ))}
      </Row>

      <Row label="Spacing" by={from.density} scope={scope} org={here}>
        {DENSITIES.map((d) => (
          <Choice key={d.value} on={(pref.density ?? 'default') === d.value} onSelect={() => set({ density: d.value })}>
            {d.label}
          </Choice>
        ))}
      </Row>

      <Row label="Font" by={from.font} scope={scope} org={here}>
        {FACES.map((f) => (
          <Choice
            key={f.value}
            on={(pref.font ?? 'default') === f.value}
            onSelect={() => set({ font: f.value })}
            // The option is set in the face it names, so the choice shows its
            // own answer rather than describing it.
            style={{ fontFamily: f.preview }}
          >
            {f.label}
          </Choice>
        ))}
      </Row>

      <Row label="Width" by={from.width} scope={scope} org={here}>
        {MEASURES.map((m) => (
          <Choice key={m.value} on={(pref.width ?? 'default') === m.value} onSelect={() => set({ width: m.value })}>
            {m.label}
          </Choice>
        ))}
      </Row>

      <Row label="Accent" by={from.accent} scope={scope} org={here}>
        {ACCENTS.map((a) => (
          <Choice key={a.label} on={pref.accent === a.value} onSelect={() => set({ accent: a.value })} title={a.label}>
            <span style={S.swatch(a.value)} />
          </Choice>
        ))}
      </Row>

      {/* Only offered once something has changed — a reset for a state that is
          already the default is a control that does nothing. */}
      {touched ? (
        <div style={{ ...S.row, justifyContent: 'flex-end' }}>
          <button type="button" onClick={reset} style={{ ...choice(false), opacity: 0.8 }}>
            {scope === 'org' ? `Reset for ${here}` : 'Reset'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
