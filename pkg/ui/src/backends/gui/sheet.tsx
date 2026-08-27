'use client'

/**
 * Sheet — a dialog that arrives from an edge.
 *
 * It IS the Dialog: same portal, same overlay, same focus trap, same escape and
 * same `aria-modal`. What differs is where the content sits — pinned to one
 * side and filling that axis — so this file is the geometry and nothing else.
 * Building it as a second dialog would be a second set of those behaviours to
 * keep correct.
 *
 * `side` defaults to `right`, which is where a navigation or a history panel
 * belongs in a left-to-right reading order: it opens away from the content
 * rather than pushing across it.
 */
import * as React from 'react'
import { sx } from '../../sx'

import { cn } from '../../core/cn'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  type DialogContentProps,
} from './dialog'

export const Sheet = Dialog
export const SheetTrigger = DialogTrigger
export const SheetClose = DialogClose
export const SheetPortal = DialogPortal
export const SheetOverlay = DialogOverlay
export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription
export const SheetFooter = DialogFooter

export type SheetSide = 'top' | 'right' | 'bottom' | 'left'

/**
 * Where the sheet sits, per side.
 *
 * A sheet fills the axis it does NOT slide along — a right sheet is full height
 * and as wide as its content needs; a top sheet is full width. `maxW`/`maxH` are
 * a ceiling rather than a size, so a narrow phone gets the whole viewport and a
 * desk does not get a 1600px panel.
 *
 * Only the two corners facing the content are rounded. Rounding the outer pair
 * shows a sliver of page through them at the screen edge.
 */
const PLACE: Record<SheetSide, Record<string, unknown>> = {
  right: { t: 0, b: 0, r: 0, height: '100%', width: '100%', maxW: 384, btlr: '$5', bblr: '$5', btrr: 0, bbrr: 0 },
  left: { t: 0, b: 0, l: 0, height: '100%', width: '100%', maxW: 384, btrr: '$5', bbrr: '$5', btlr: 0, bblr: 0 },
  top: { t: 0, l: 0, r: 0, width: '100%', maxW: '100%', maxH: '80%', bblr: '$5', bbrr: '$5', btlr: 0, btrr: 0 },
  bottom: { b: 0, l: 0, r: 0, width: '100%', maxW: '100%', maxH: '80%', btlr: '$5', btrr: '$5', bblr: 0, bbrr: 0 },
}

export type SheetContentProps = DialogContentProps & {
  side?: SheetSide
}

export const SheetContent = ({ side = 'right', className, ...props }: SheetContentProps) => (
  <DialogContent
    {...slot(side)}
    // The dialog centres itself; a sheet is pinned, so the placement above has
    // to outrank that — hence `position` here rather than relying on the frame.
    position="fixed"
    {...PLACE[side]}
    {...sx(className)}
    {...props}
  />
)

/** A marker a host can select on, matching the rest of the library's parts. */
const slot = (side: SheetSide) => ({ 'data-slot': 'sheet-content', 'data-side': side })

export const SheetHeader = ({ className, ...props }: React.ComponentProps<typeof DialogHeader>) => (
  <DialogHeader {...sx(className)} {...props} />
)
