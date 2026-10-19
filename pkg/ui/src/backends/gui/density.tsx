'use client'

/**
 * Density — how tight the controls under it sit.
 *
 * `regular` is every Hanzo surface as it is: 36px fields and buttons, 14px text.
 * `compact` is the record density a CRM, a data table or a settings page wants —
 * 32px controls with 13px text and an 8px gutter, the box a cell editor and a
 * filter value are drawn in (twenty-ui's default rung, MIT). It changes what a
 * control renders when it names no `size`; a control that names one keeps it.
 *
 * A context rather than a prop on each control, because the decision belongs to
 * the shell: the CRM sets it once at its root and every Input, Select, Textarea
 * and Button inside agrees, including the ones a library renders that the app
 * never sees. A portalled panel (a menu, a select's list) re-provides the
 * density it was opened from, as `PortalTheme` re-provides the theme.
 */
import { createContext, useContext, type ReactNode } from 'react'
import type { FieldSize } from './control'

export type DensityName = 'regular' | 'compact'

const DensityContext = /* @__PURE__ */ createContext<DensityName>('regular')

export function Density({ value, children }: { value: DensityName; children?: ReactNode }) {
  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
}

/** The density the nearest `Density` names; `regular` with none. */
export const useDensity = (): DensityName => useContext(DensityContext)

/** The box a field draws: its own `size` when it names one, else the density's. */
export const fieldSize = (size: FieldSize | null | undefined, density: DensityName): FieldSize =>
  size ?? (density === 'compact' ? 'sm' : 'default')
