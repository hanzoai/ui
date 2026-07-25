'use client'

/**
 * Roving keyboard focus for a menu panel — ArrowUp/Down move focus between enabled
 * `[role="menuitem"]` children, Home/End jump to ends, Escape closes. Web/desktop
 * only (guards on `document`); native menus have no pointer-keyboard nav. Shared by
 * DropdownMenu and ContextMenu so navigation is identical.
 */
import type { KeyboardEvent } from 'react'

export function menuKeyDown(e: KeyboardEvent, onClose?: () => void): void {
  if (e.key === 'Escape') {
    onClose?.()
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
  if (typeof document === 'undefined') return

  const panel = e.currentTarget as HTMLElement
  const items = Array.from(
    panel.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'),
  )
  if (items.length === 0) return
  e.preventDefault()

  const active = document.activeElement as HTMLElement | null
  const current = active ? items.indexOf(active) : -1
  let next: number
  if (e.key === 'Home') next = 0
  else if (e.key === 'End') next = items.length - 1
  else if (e.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % items.length
  else next = current <= 0 ? items.length - 1 : current - 1
  items[next]?.focus()
}
