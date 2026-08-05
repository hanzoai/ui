// The ONE place a shared component says what a user just did.
//
// Instrumenting the COMPONENT beats instrumenting 100 apps: a product that
// renders `DataTable`, `PrimaryButton`, `SlideOver`, `ConfirmDelete`, `Field*`,
// `ComboBox`, `Segmented`, `SearchInput`, `OrgSwitcher`, `MenuItemView`,
// `EmptyState` or `ThemeToggle` reports the SAME interaction vocabulary with
// zero app code. Nothing to wire, nothing to remember, nothing to drift.
//
//   import { emit, useEmit, InstrumentSurface } from '@hanzo/ui/product'
//   <InstrumentSurface value="billing">…</InstrumentSurface>   // optional context
//
// This is the CURATED half. `<Hanzo analytics>` already reports every click,
// change, submit and route change on its own, annotated with the component it
// happened on — what autocapture cannot know is that a click WAS a checkout.
// That is what this names. Same client, same stream, same front door.
//
// ONE event name, structured properties — the taxonomy in @hanzo/event is a
// CLOSED set, and its own rule for a product-specific moment is "the `action`
// property, never a new event name". So every UI interaction is
// EVENTS.FEATURE_USED carrying { component, action, surface, id, value }.
// Funnel moments (signup, checkout, deploy) keep their own dedicated names and
// are emitted by the surface that owns them, not by a button.
//
// One stream: `track` from @hanzogui/telemetry — already a dependency of this
// package and already THE front door (POST api.hanzo.ai/v1/event). No second
// client, no CDN script, no `window` poking. It is SSR-safe, consent-aware,
// honors DNT/GPC, and is fail-soft by construction, so this module inherits all
// of that and adds no error policy of its own.

import { createContext, useCallback, useContext } from 'react'
// ONE dependency edge: @hanzogui/telemetry owns the transport AND re-exports the
// @hanzo/event vocabulary, so this package never names a second source of truth.
import { EVENTS, track } from '@hanzogui/telemetry'

/** What a user did to a component. A closed set — it is the verb half of the
 *  vocabulary, and a closed verb set is what makes cross-product funnels join. */
export type UiAction =
  | 'click'
  | 'open'
  | 'close'
  | 'select'
  | 'change'
  | 'sort'
  | 'filter'
  | 'search'
  | 'confirm'
  | 'cancel'
  | 'dismiss'
  | 'expand'
  | 'view'
  | 'error'

/** One interaction. `component` + `action` are required; everything else is the
 *  detail a lens groups by. Values are scrubbed downstream by @hanzo/event. */
export interface UiEvent {
  /** The shared component that observed it — `DataTable`, `PrimaryButton`, … */
  component: string
  action: UiAction
  /** The thing acted on: a column key, an option value, a menu item id. */
  id?: string
  /** A small scalar detail (sort direction, boolean state, count). Never PII —
   *  free-text values (search terms, field contents) are reported as a LENGTH,
   *  by the caller, not as the text. */
  value?: string | number | boolean
  /** The product area, when the app declared one via `<InstrumentSurface/>`. */
  surface?: string
}

/** The enclosing product area (route/module). Optional: with no provider the
 *  events still carry component+action, and the product+path already come from
 *  the telemetry client. */
const SurfaceContext = createContext<string | undefined>(undefined)

/** Names the product area every shared component inside it reports under.
 *  Plain provider, no element — it must not perturb any layout. */
export const InstrumentSurface = SurfaceContext.Provider

/** The current product area, or undefined outside a provider. */
export const useSurface = (): string | undefined => useContext(SurfaceContext)

/** Report an interaction. Callable from anywhere (module scope, event handler,
 *  a non-React host) — the ambient telemetry client is built on first use. */
export function emit(e: UiEvent): void {
  track(EVENTS.FEATURE_USED, {
    component: e.component,
    action: e.action,
    ...(e.id !== undefined ? { id: e.id } : null),
    ...(e.value !== undefined ? { value: e.value } : null),
    ...(e.surface !== undefined ? { surface: e.surface } : null),
  })
}

/** `emit` with the surrounding `<InstrumentSurface/>` already bound — what the
 *  shared components themselves use, so an app never labels a surface twice. */
export function useEmit(): (e: UiEvent) => void {
  const surface = useSurface()
  return useCallback(
    (e: UiEvent) => emit(surface !== undefined && e.surface === undefined ? { ...e, surface } : e),
    [surface],
  )
}

/** A component's own children ARE its identity — "Deploy", "Log in with Hanzo
 *  Cloud". React hands them over as a string, or as an ARRAY when the label is
 *  interpolated (`Log in with {brand}`), which is the common case; flattening the
 *  string parts is the difference between a named event and an anonymous one.
 *  Anything non-textual (an icon element) yields undefined rather than a guess. */
export function labelOf(children: unknown): string | undefined {
  if (typeof children === 'string') return children.trim() || undefined
  if (Array.isArray(children)) {
    const text = children.filter((c) => typeof c === 'string' || typeof c === 'number').join('')
    return text.trim() || undefined
  }
  return undefined
}

/** Free text (a search box, a text field) is reported as its LENGTH — the shape
 *  of the behaviour without the content. One helper so no component invents its
 *  own idea of "safe to send". */
export const textSize = (s: string | undefined): number => (s ? s.length : 0)
