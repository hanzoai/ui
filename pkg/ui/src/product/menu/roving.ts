'use client'

/**
 * Roving keyboard focus for a menu panel — ArrowUp/Down move focus between enabled
 * menu items (`menuitem`, `menuitemradio`, `menuitemcheckbox`), wrapping at the
 * ends; Home/End jump to them; Escape closes. Web/desktop only (guards on
 * `document`); native menus have no pointer-keyboard nav. Shared by DropdownMenu,
 * ContextMenu and the account sheets (`UserMenu`, `OrgSwitcher`, `SessionRail`'s
 * menu) so navigation is identical.
 *
 * A key typed into a field inside the panel — a sheet's search box — is the
 * field's: Home and End move its caret, not the menu.
 */
import type { KeyboardEvent } from 'react'

export function menuKeyDown(e: KeyboardEvent, onClose?: () => void): void {
  if (e.key === 'Escape') {
    onClose?.()
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return
  if (typeof document === 'undefined') return
  const target = e.target as HTMLElement | null
  if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return

  const panel = e.currentTarget as HTMLElement
  const items = Array.from(
    panel.querySelectorAll<HTMLElement>(
      ['menuitem', 'menuitemradio', 'menuitemcheckbox'].map((r) => `[role="${r}"]:not([aria-disabled="true"])`).join(', '),
    ),
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
