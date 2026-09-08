import { Button, H4, Text, View, XStack, YStack } from '@hanzo/gui'
import { SlidersHorizontal, X } from '@hanzogui/lucide-icons-2'
import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * A person's own reading of the system — text size, spacing, width, accent —
 * on the contract @hanzo/appearance keeps: one localStorage key, one preference
 * shape, the knobs @hanzo/design multiplies into every ramp. The <Hanzo> root
 * reads that key and puts the preference back on the document on every mount,
 * so a choice made here persists; this file owns only the change: write the
 * key, then set the properties the root would.
 */
export const KEY = 'hanzo.appearance'

type Density = 'compact' | 'default' | 'comfortable'
type Measure = 'narrow' | 'default' | 'wide'
type Face = 'default' | 'system' | 'serif' | 'mono'
type Pref = { type?: number; ratio?: number; density?: Density; font?: Face; width?: Measure; accent?: string }

const TYPE = [
  { label: 'S', title: 'Small', value: 0.9 },
  { label: 'M', title: 'Default', value: 1 },
  { label: 'L', title: 'Large', value: 1.15 },
  { label: 'XL', title: 'Larger', value: 1.3 },
]
const DENSITY: { label: string; value: Density }[] = [
  { label: 'Tight', value: 'compact' },
  { label: 'Default', value: 'default' },
  { label: 'Roomy', value: 'comfortable' },
]
const MEASURE: { label: string; value: Measure }[] = [
  { label: 'Narrow', value: 'narrow' },
  { label: 'Default', value: 'default' },
  { label: 'Wide', value: 'wide' },
]
/** A monochrome brand spends one hue; these are starting points, and Default is the brand's. */
const ACCENT: { label: string; value?: string }[] = [
  { label: 'Default' },
  { label: 'Olive', value: '#808000' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Violet', value: '#8b5cf6' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Amber', value: '#f59e0b' },
]

const read = (): Pref => {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}')
    return p && typeof p === 'object' ? p : {}
  } catch {
    return {}
  }
}

const write = (p: Pref) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {}
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const DENSE: Record<Density, string> = { compact: '0.85', default: '1', comfortable: '1.15' }
const FACES: Partial<Record<Face, string>> = {
  system: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
  serif: 'var(--font-serif)',
  mono: 'var(--font-mono)',
}
const WIDTHS: Partial<Record<Measure, [string, string, string]>> = {
  narrow: ['64rem', '40rem', '58rem'],
  wide: ['96rem', '56rem', '86rem'],
}
const KNOBS = [
  '--type-scale',
  '--type-ratio',
  '--density',
  '--font-sans',
  '--container-max',
  '--container-prose',
  '--container-wide',
  '--primary',
  '--accent',
]

/** The custom properties a preference becomes — the axes offered here, and the ones another surface may have stored. */
function vars(p: Pref): Record<string, string> {
  const out: Record<string, string> = {}
  if (typeof p.type === 'number') out['--type-scale'] = String(clamp(p.type, 0.85, 1.4))
  if (typeof p.ratio === 'number') out['--type-ratio'] = String(clamp(p.ratio, 0.75, 1.5))
  if (p.density && p.density in DENSE) out['--density'] = DENSE[p.density]
  const face = p.font ? FACES[p.font] : undefined
  if (face) out['--font-sans'] = face
  const measure = p.width ? WIDTHS[p.width] : undefined
  if (measure) [out['--container-max'], out['--container-prose'], out['--container-wide']] = measure
  if (p.accent && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(p.accent)) out['--primary'] = out['--accent'] = p.accent
  return out
}

/** Put a preference on the document. An axis it does not set is removed, so the stylesheet answers. */
function apply(p: Pref) {
  const style = document.documentElement.style
  const v = vars(p)
  for (const k of KNOBS) v[k] ? style.setProperty(k, v[k]) : style.removeProperty(k)
}

/** The panel, behind one control in the header. Escape or a click outside closes it. */
export function Appearance() {
  const [open, setOpen] = useState(false)
  const [pref, setPref] = useState<Pref>({})
  const box = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    setPref(read())
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', key)
    }
  }, [open])

  // Patch what is stored, not what is shown: clearing the accent removes the
  // key, or a trip through JSON hands back the string "undefined".
  const set = (patch: Pref) => {
    const next = { ...read(), ...patch }
    if ('accent' in patch && patch.accent === undefined) delete next.accent
    write(next)
    apply(next)
    setPref(next)
  }
  // No preference is an EMPTY one — neutral values written out would pin the
  // person to the generic scale over any brand that set its own.
  const reset = () => {
    write({})
    apply({})
    setPref({})
  }
  const near = (a: number, b: number) => Math.abs(a - b) < 0.001

  return (
    <YStack ref={box as any} position="relative">
      <Button
        size="$3"
        circular
        chromeless
        aria-expanded={open}
        aria-label="Appearance"
        icon={<SlidersHorizontal size={18} />}
        onPress={() => setOpen((v) => !v)}
      />
      {open ? (
        <YStack
          role="dialog"
          aria-label="Appearance"
          position="absolute"
          t={44}
          r={0}
          z={200}
          width={340}
          maxW="calc(100vw - 32px)"
          p="$4"
          rounded="$6"
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          elevation="$4"
        >
          <XStack items="center" justify="space-between" mb="$2">
            <H4 size="$3">Appearance</H4>
            <Button size="$2" circular chromeless aria-label="Close" icon={<X size={14} />} onPress={() => setOpen(false)} />
          </XStack>
          <Row label="Text size">
            {TYPE.map((s) => (
              <Choice key={s.label} on={near(pref.type ?? 1, s.value)} title={s.title} onSelect={() => set({ type: s.value })}>
                {s.label}
              </Choice>
            ))}
          </Row>
          <Row label="Spacing">
            {DENSITY.map((d) => (
              <Choice key={d.value} on={(pref.density ?? 'default') === d.value} onSelect={() => set({ density: d.value })}>
                {d.label}
              </Choice>
            ))}
          </Row>
          <Row label="Width">
            {MEASURE.map((m) => (
              <Choice key={m.value} on={(pref.width ?? 'default') === m.value} onSelect={() => set({ width: m.value })}>
                {m.label}
              </Choice>
            ))}
          </Row>
          <Row label="Accent">
            {ACCENT.map((a) => (
              <Choice key={a.label} on={pref.accent === a.value} title={a.label} onSelect={() => set({ accent: a.value })}>
                <View width={14} height={14} rounded="$10" bg={(a.value ?? '$color12') as any} opacity={a.value ? 1 : 0.35} />
              </Choice>
            ))}
          </Row>
          {Object.keys(pref).length ? (
            <XStack justify="flex-end" pt="$2">
              <Choice onSelect={reset}>Reset</Choice>
            </XStack>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}

/** One axis: what it is, and one track holding the choices, so it reads as a control with a position. */
const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <XStack items="center" justify="space-between" gap="$3" minH={40} py="$2" flexWrap="wrap">
    <Text fontSize={13}>{label}</Text>
    <XStack items="center" gap={2} p={2} rounded="$10" bg="$color2">
      {children}
    </XStack>
  </XStack>
)

const Choice = ({ on = false, title, onSelect, children }: { on?: boolean; title?: string; onSelect: () => void; children: ReactNode }) => (
  <Button
    size="$2"
    chromeless
    rounded="$10"
    height={24}
    px="$2"
    aria-pressed={on}
    aria-label={title}
    bg={on ? '$color5' : 'transparent'}
    color={on ? '$color12' : '$color11'}
    fontSize={11}
    onPress={onSelect}
  >
    {children}
  </Button>
)
