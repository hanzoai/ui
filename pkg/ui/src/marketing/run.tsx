'use client'

/**
 * Run — a light crosses a set of things that are all true at once.
 *
 * Prose states invariants one at a time, and a reader has finished the first
 * before the fourth exists; a run lays the set out and sweeps it, so several
 * are lit together and none is ever "next". Each DIRECT child says where it
 * stands with `data-beat={n}`, and is lit `n` steps after the first:
 *
 *   <Run step={0.31}>{steps.map((s, i) => <Chip key={s} data-beat={i}>{s}</Chip>)}</Run>
 *
 * `step` is the delay per beat, short against the 5.4s cycle so several are lit
 * at once; an ORDERED set takes a step near cycle/n, and the order is the
 * content's to say, so the caller says it. `rest` is the ink the sweep returns
 * to, because the animation owns `color` for the whole cycle.
 *
 * The keyframe is `@hanzo/ui/styles/motion.css`, keyed on `data-motion`, and
 * reduced motion stills it. The two knobs ride this element's own custom
 * properties, which no gui prop names. Colour and edge only, so it composes
 * with an entrance that owns transform and opacity.
 */
import { View, type ViewProps } from '@hanzo/gui'
import type { CSSProperties, ReactNode } from 'react'

import type { Loose } from './loose'

export type RunProps = Loose<Omit<ViewProps, 'children'>> & {
  children?: ReactNode
  /** Seconds between one beat and the next. */
  step?: number
  /** The ink a lit child returns to. */
  rest?: string
}

const Run = ({ step = 0.22, rest, ...p }: RunProps) => (
  <View
    data-motion="run"
    {...(p as object)}
    style={{ '--run-step': `${step}s`, ...(rest ? { '--run-rest': rest } : null) } as CSSProperties}
  />
)

export { Run }
