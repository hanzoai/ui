'use client'

/**
 * SlideOver — the ONE right-side (or left) slide-out overlay for the console.
 *
 * It is the single mechanism behind every off-canvas surface: the mobile nav
 * drawer, the item DetailPane, and the account/settings menu. One definition, many
 * mounts (DRY) — so every drawer slides, dims, traps, and closes identically.
 *
 * Smoothness is CSS-transform driven (never a JS layout branch): the panel is
 * ALWAYS mounted and toggles `translateX(0) ↔ translateX(±100%)` via the shared
 * `.slide` class, and the backdrop cross-fades via `.fade`. Because it never
 * unmounts, the EXIT animates too (a `Dialog` that unmounts on close cannot). Both
 * classes are reduced-motion-aware in `globals.css`, so the whole thing snaps
 * instantly for users who ask for that — no bespoke logic here.
 *
 * Responsive by construction: FULL-WIDTH (full-screen) below `lg`, a fixed-width
 * pane at `lg+` (`size`). Uses `100dvh` so the mobile browser chrome never clips it.
 *
 * A11y: `role="dialog" aria-modal`, Escape to close, backdrop click to close, body
 * scroll lock while open (ref-counted so stacked overlays don't fight), and focus
 * moves into the panel on open and returns to the opener on close.
 */
import { useEffect, useRef, type ReactNode } from 'react'
import { Button, ScrollView, Text, XStack, YStack } from '@hanzo/gui'
import { X } from '@hanzogui/lucide-icons-2'

import { asColor, type IconLike } from './color'

/** The lg breakpoint (px) — matches the shell's one responsive threshold. */
const LG = 1024

// ── Body scroll lock, ref-counted so nested/stacked overlays don't clobber it ──
let lockCount = 0
let savedOverflow = ''
function lockScroll() {
  if (typeof document === 'undefined') return
  if (lockCount === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  lockCount++
}
function unlockScroll() {
  if (typeof document === 'undefined') return
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount === 0) document.body.style.overflow = savedOverflow
}

export type SlideOverProps = {
  open: boolean
  onClose: () => void
  /** Which edge the panel slides from. Default right. */
  side?: 'right' | 'left'
  /** Panel width at lg+ (px). Below lg it is always full-screen. Default 420. */
  size?: number
  /** Optional header title — when set, SlideOver renders a header + a scroll body. */
  title?: ReactNode
  /** Optional header icon (tinted with `iconColor`). */
  icon?: IconLike
  iconColor?: string
  /** Extra header content, right-aligned before the close button. */
  headerRight?: ReactNode
  /** Accessible label when no visible title is given. */
  ariaLabel?: string
  /** z-index for stacking (a pane opened over a drawer passes a higher value). */
  zIndex?: number
  children: ReactNode
}

import { useEmit } from './instrument'

export function SlideOver({
  open,
  onClose,
  side = 'right',
  size = 420,
  title,
  icon: Icon,
  iconColor,
  headerRight,
  ariaLabel,
  zIndex = 1000,
  children,
}: SlideOverProps) {
  const track = useEmit()
  const panelRef = useRef<HTMLElement | null>(null)
  const openerRef = useRef<Element | null>(null)

  // One open/close pair per drawer, keyed by its title — the shared way every
  // product reports "a detail pane was looked at".
  useEffect(() => {
    track({ component: 'SlideOver', action: open ? 'open' : 'close', id: typeof title === 'string' ? title : ariaLabel })
    // Only the open/close transition matters; `track` is stable per surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Body scroll lock + focus management, driven by `open`.
  useEffect(() => {
    if (!open) return
    openerRef.current = typeof document !== 'undefined' ? document.activeElement : null
    lockScroll()
    // Move focus into the panel (next frame so it is laid out + on-screen).
    const t = window.setTimeout(() => {
      const el = panelRef.current
      if (el && typeof el.focus === 'function') el.focus()
    }, 0)
    return () => {
      window.clearTimeout(t)
      unlockScroll()
      const opener = openerRef.current
      if (opener && opener instanceof HTMLElement && typeof opener.focus === 'function') opener.focus()
    }
  }, [open])

  // Escape closes.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const offscreen = side === 'right' ? 'translateX(100%)' : 'translateX(-100%)'
  const edge = side === 'right' ? { r: 0 } : { l: 0 }

  return (
    <YStack
      // Fixed to the viewport; overflow hidden so the off-screen panel (absolute
      // child) is CLIPPED and never adds a horizontal scrollbar.
      overflow="hidden"
      pointerEvents={open ? 'auto' : 'none'}
      aria-hidden={!open}
      style={{ position: 'fixed', inset: 0, zIndex }}
    >
      {/* Backdrop — cross-fades; click to dismiss. */}
      <YStack
        position="absolute"
        t={0}
        l={0}
        r={0}
        b={0}
        bg="rgba(0,0,0,0.55)"
        className="fade"
        style={{ opacity: open ? 1 : 0 }}
        onPress={onClose}
      />

      {/* Panel — slides in from the edge. Full-screen below lg, fixed width at lg+. */}
      <YStack
        // Web DOM ref; Gui forwards it to the underlying node. Cast (not @ts-expect-error)
        // so it is env-agnostic — the ref type is strict under the pkg build, loose here.
        ref={panelRef as never}
        tabIndex={-1}
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-label={typeof title === 'string' ? title : ariaLabel}
        position="absolute"
        t={0}
        b={0}
        {...edge}
        width="100%"
        $lg={{ width: size, maxW: '100vw' }}
        bg="$color1"
        borderLeftWidth={side === 'right' ? 1 : 0}
        borderRightWidth={side === 'left' ? 1 : 0}
        borderColor="$borderColor"
        // Material paper depth — the drawer reads as a sheet lifted above the dimmed
        // list behind it (real layered shadow, theme-aware), not a flat panel.
        className="slide elevation-4"
        // Full-height sheet (100dvh — mobile-safe), inset for the notch (top) + home
        // indicator (bottom) so the drawer header + footer actions clear them on
        // notched devices (env insets are 0 elsewhere, so no effect there).
        style={{
          transform: open ? 'translateX(0)' : offscreen,
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {title !== undefined ? (
          <>
            <XStack
              items="center"
              gap="$2.5"
              px="$4"
              height={56}
              borderBottomWidth={1}
              borderColor="$borderColor"
            >
              {Icon ? <Icon size={18} color={iconColor ? asColor(iconColor) : undefined} /> : null}
              <Text flex={1} fontSize="$5" fontWeight="700" color="$color12" numberOfLines={1}>
                {title}
              </Text>
              {headerRight}
              <Button chromeless width={44} height={44} icon={<X size={18} />} onPress={onClose} aria-label="Close" />
            </XStack>
            <ScrollView flex={1}>
              <YStack flex={1} p="$4" gap="$3">
                {children}
              </YStack>
            </ScrollView>
          </>
        ) : (
          // Bare mode — the caller owns the full panel layout (e.g. the nav drawer
          // renders its own header + scroll + footer).
          children
        )}
      </YStack>
    </YStack>
  )
}

export { LG as SLIDEOVER_LG }
