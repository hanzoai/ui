/**
 * Svelte actions shared by the behaviour-heavy primitives (dialog, dropdown,
 * popover, tooltip, select). These are the substrate's accessible-primitive
 * layer — the Svelte analogue of what Radix provides the shadcn backend:
 * portalling, outside/Escape dismissal, and focus containment. They are lean
 * and self-contained (no external Svelte-UI dependency); a production host may
 * swap them for `bits-ui`/`melt-ui` builders without changing the component
 * surface (see ./README notes).
 */

/**
 * Move `node` to a target container (default `document.body`) so overlay content
 * escapes `overflow`/`z-index` stacking contexts, and remove it on destroy.
 */
export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
  let container: HTMLElement | null = null

  function mount(t: HTMLElement | string) {
    container = typeof t === 'string' ? document.querySelector<HTMLElement>(t) : t
    container?.appendChild(node)
  }

  mount(target)

  return {
    update: mount,
    destroy() {
      node.parentNode?.removeChild(node)
    },
  }
}

export interface DismissParams {
  onDismiss: () => void
  /** When false, the listeners are inert (used on an always-mounted wrapper). */
  enabled?: boolean
}

/**
 * Call `onDismiss` on Escape or on a pointer press outside `node`. Attach it to
 * the wrapper that contains BOTH the trigger and the content, so the opening
 * press (inside the wrapper) never counts as "outside". `enabled` gates the
 * listeners so the action can sit on a permanent wrapper and only fire while its
 * disclosure is open.
 */
export function dismiss(node: HTMLElement, params: DismissParams) {
  let enabled = params.enabled ?? true
  let onDismiss = params.onDismiss

  function onKeydown(e: KeyboardEvent) {
    if (enabled && e.key === 'Escape') onDismiss()
  }
  function onPointerdown(e: PointerEvent) {
    if (enabled && !node.contains(e.target as Node)) onDismiss()
  }

  document.addEventListener('keydown', onKeydown, true)
  document.addEventListener('pointerdown', onPointerdown, true)

  return {
    update(next: DismissParams) {
      enabled = next.enabled ?? true
      onDismiss = next.onDismiss
    },
    destroy() {
      document.removeEventListener('keydown', onKeydown, true)
      document.removeEventListener('pointerdown', onPointerdown, true)
    },
  }
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

/**
 * Contain Tab focus within `node` (modal dialogs), focusing the first focusable
 * element on mount and restoring focus to the previously-active element on
 * destroy.
 */
export function trapFocus(node: HTMLElement) {
  const previouslyFocused = document.activeElement as HTMLElement | null

  function focusables(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    )
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const items = focusables()
    if (items.length === 0) {
      e.preventDefault()
      node.focus()
      return
    }
    const first = items[0]
    const last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || active === node)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const initial = focusables()[0] ?? node
  initial.focus()
  node.addEventListener('keydown', onKeydown)

  return {
    destroy() {
      node.removeEventListener('keydown', onKeydown)
      previouslyFocused?.focus?.()
    },
  }
}

export interface RovingParams {
  /** Which descendants participate. */
  selector?: string
  /** Focus the first item on mount (menus/listboxes) vs leave focus (tabs). */
  autofocus?: boolean
}

/**
 * Roving keyboard navigation for a menu/listbox/tablist: ArrowUp/Down (and
 * ArrowLeft/Right) move between items, Home/End jump to ends.
 */
export function rovingFocus(node: HTMLElement, params: RovingParams = {}) {
  const selector = params.selector ?? '[role="menuitem"],[role="option"]'
  const autofocus = params.autofocus ?? true

  function items(): HTMLElement[] {
    return Array.from(node.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('data-disabled'),
    )
  }

  function onKeydown(e: KeyboardEvent) {
    const list = items()
    if (list.length === 0) return
    const idx = list.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      list[(idx + 1) % list.length].focus()
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      list[(idx - 1 + list.length) % list.length].focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      list[0].focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      list[list.length - 1].focus()
    }
  }

  node.addEventListener('keydown', onKeydown)
  if (autofocus) items()[0]?.focus()

  return {
    destroy() {
      node.removeEventListener('keydown', onKeydown)
    },
  }
}
