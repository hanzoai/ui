'use client'

/**
 * Look — the person's appearance as `<Hanzo>` resolved it, and the one writer of it.
 *
 * `<Hanzo>` already runs `useAppearance()` with the host's org, install and
 * account layers. A control deeper in the tree that changes the theme must write
 * through THAT call: its own `useAppearance()` would resolve without those
 * layers, repaint the document without an org's accent, and save nowhere but
 * this device. So the root publishes its result here and a control reads it.
 *
 * Absent when a host mounts its own gui provider instead of `<Hanzo>`; a control
 * then writes the device's own layer and repaints, which is the whole stack such
 * a host has.
 */
import { createContext } from 'react'
import type { Preference } from '@hanzo/appearance'

export type Look = {
  /** The resolved preference, every layer applied. */
  pref: Preference
  /** Patch the person's own layer, repaint, and save it where the root saves it. */
  set: (patch: Partial<Preference>) => void
}

export const Look = /* @__PURE__ */ createContext<Look | null>(null)
