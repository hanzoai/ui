// The `observe` Svelte action. Svelte components have no stable DOM name at
// runtime, so this action stamps one — `use:observe={{ name: 'UserCard' }}` writes
// data-hz-name, and the delegated engine then labels every interaction inside the
// node with it. It also opts a node into visibility capture or out of capture
// entirely. Pure attribute writes: no `svelte` import, yet a valid Svelte action.

import { activeObserver } from './observer'

export interface ObserveParams {
  /** Stamp a stable component name (data-hz-name) — the semantic label of
   *  interactions within this node will carry it. */
  name?: string
  /** Opt this node into visibility capture ($view) via data-hz-view. */
  view?: boolean
  /** Exclude this subtree from capture (data-hz-private). */
  private?: boolean
}

/** The return shape Svelte expects from an action (update + destroy are optional
 *  to Svelte, but we implement update so reactive params re-apply). */
export interface ObserveAction {
  update(params: ObserveParams): void
  destroy(): void
}

function toggle(node: Element, attr: string, on: boolean | undefined): void {
  if (on) node.setAttribute(attr, '')
  else node.removeAttribute(attr)
}

/** use:observe — see ObserveParams. */
export function observe(node: Element, params: ObserveParams = {}): ObserveAction {
  const apply = (p: ObserveParams) => {
    if (p.name) node.setAttribute('data-hz-name', p.name)
    else node.removeAttribute('data-hz-name')
    toggle(node, 'data-hz-view', p.view)
    toggle(node, 'data-hz-private', p.private)
    // A node marked for visibility after the engine started must be registered.
    if (p.view) activeObserver()?.watch(node)
  }
  apply(params)
  return {
    update: apply,
    destroy() {
      /* attributes live and die with the node */
    },
  }
}
