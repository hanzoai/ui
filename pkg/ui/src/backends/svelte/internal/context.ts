/**
 * Typed Svelte context for the compound primitives. Each family (dialog,
 * dropdown, popover, tooltip, tabs, select) shares state between its root and
 * its parts through a keyed context created by the root — the idiomatic Svelte
 * analogue of a React compound component's provider.
 */
import { getContext, hasContext, setContext } from 'svelte'
import { writable, type Writable } from 'svelte/store'

let uid = 0
/** Stable, collision-free id for aria wiring (aria-controls / aria-labelledby). */
export function useId(prefix = 'hz'): string {
  uid += 1
  return `${prefix}-${uid}`
}

/** An open/closed disclosure shared by a trigger and its content. */
export interface Disclosure {
  open: Writable<boolean>
  contentId: string
  triggerId: string
  labelId: string
  descId: string
  toggle: () => void
  close: () => void
  openIt: () => void
}

export function createDisclosure(key: symbol, prefix: string): Disclosure {
  const open = writable(false)
  const ctx: Disclosure = {
    open,
    contentId: useId(`${prefix}-content`),
    triggerId: useId(`${prefix}-trigger`),
    labelId: useId(`${prefix}-label`),
    descId: useId(`${prefix}-desc`),
    toggle: () => open.update((v) => !v),
    close: () => open.set(false),
    openIt: () => open.set(true),
  }
  setContext(key, ctx)
  return ctx
}

export function getDisclosure(key: symbol, name: string): Disclosure {
  if (!hasContext(key)) {
    throw new Error(`<${name}> must be used inside its matching root component.`)
  }
  return getContext<Disclosure>(key)
}

export const DIALOG = Symbol('hz-dialog')
export const DROPDOWN = Symbol('hz-dropdown')
export const POPOVER = Symbol('hz-popover')
export const TOOLTIP = Symbol('hz-tooltip')

/** Single-select value shared by a Tabs root and its parts. */
export interface Selection {
  value: Writable<string>
  select: (v: string) => void
}

export function createSelection(key: symbol, initial = ''): Selection {
  const value = writable(initial)
  const ctx: Selection = { value, select: (v: string) => value.set(v) }
  setContext(key, ctx)
  return ctx
}

export function getSelection(key: symbol, name: string): Selection {
  if (!hasContext(key)) {
    throw new Error(`<${name}> must be used inside its matching root component.`)
  }
  return getContext<Selection>(key)
}

export const TABS = Symbol('hz-tabs')

/**
 * Select combines a disclosure (open listbox) with a selected value and a
 * value→label registry so the trigger can render the chosen option's text
 * without the caller repeating it.
 */
export interface SelectCtx {
  open: Writable<boolean>
  value: Writable<string>
  labels: Writable<Record<string, string>>
  contentId: string
  triggerId: string
  toggle: () => void
  close: () => void
  choose: (v: string) => void
  registerLabel: (v: string, label: string) => void
}

export const SELECT = Symbol('hz-select')

export function createSelect(initial = ''): SelectCtx {
  const open = writable(false)
  const value = writable(initial)
  const labels = writable<Record<string, string>>({})
  const ctx: SelectCtx = {
    open,
    value,
    labels,
    contentId: useId('select-content'),
    triggerId: useId('select-trigger'),
    toggle: () => open.update((v) => !v),
    close: () => open.set(false),
    choose: (v: string) => {
      value.set(v)
      open.set(false)
    },
    registerLabel: (v: string, label: string) =>
      labels.update((m) => ({ ...m, [v]: label })),
  }
  setContext(SELECT, ctx)
  return ctx
}

export function getSelect(name: string): SelectCtx {
  if (!hasContext(SELECT)) {
    throw new Error(`<${name}> must be used inside <Select>.`)
  }
  return getContext<SelectCtx>(SELECT)
}
