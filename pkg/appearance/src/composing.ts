/**
 * How a person's composer behaves — the one setting every Hanzo composer reads.
 *
 * `@hanzo/ui/chat`'s `Composer` reads it (`useComposing`), and Settings →
 * Appearance writes it, so Chat, Dev, Studio and every other surface change
 * together. An axis nobody set is ABSENT, and then the surface's own default
 * holds: Chat opens without the model under the field, Dev with it. That is how
 * one setting stays tuned for chatting and for building at once.
 *
 * Kept like the appearance: this device under `hanzo.composer`, and the person's
 * account under the `composer` member of IAM's preferences blob, so it crosses
 * a domain. No document knob: a composer's keys are behaviour, not paint.
 */
import { useSyncExternalStore } from 'react'

import { get, put, type Account } from './account'

export interface Composing {
  /** Which key sends: Enter (Shift+Enter breaks the line), or ⌘/Ctrl+Enter (Enter breaks it). */
  send?: 'enter' | 'mod'
  /** The chips under the composer. */
  chips?: boolean
  /** The model selector under the composer. */
  model?: boolean
  /** The mode (Auto, Manual, Plan) under the composer. */
  mode?: boolean
}

export const COMPOSING = 'hanzo.composer'

/** Said on this page when the setting changes; another tab hears `storage`. */
const CHANGE = 'hanzo:composer'

/** Only the fields this version knows, each only when it is a value it can obey. */
export function composing(raw: unknown): Composing {
  const v = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Composing = {}
  if (v.send === 'enter' || v.send === 'mod') out.send = v.send
  if (typeof v.chips === 'boolean') out.chips = v.chips
  if (typeof v.model === 'boolean') out.model = v.model
  if (typeof v.mode === 'boolean') out.mode = v.mode
  return out
}

const storage = (): Storage | undefined => {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

let raw: string | null | undefined
let held: Composing = {}
/** A choice the browser would not store, held for the page. */
let memo: Composing | null = null

/** What this device has chosen. Stable while the stored text is, so a hook can subscribe to it. */
export function readComposing(store: Storage | undefined = storage()): Composing {
  if (memo) return memo
  let now: string | null = null
  try {
    now = store?.getItem(COMPOSING) ?? null
  } catch {
    now = null
  }
  if (now === raw) return held
  raw = now
  try {
    held = composing(JSON.parse(now ?? 'null'))
  } catch {
    held = {}
  }
  return held
}

/** Keep a choice on this device, and tell every composer on the page. */
export function writeComposing(next: Composing, store: Storage | undefined = storage()): void {
  const clean = composing(next)
  try {
    if (!store) throw new Error('no storage')
    if (Object.keys(clean).length) store.setItem(COMPOSING, JSON.stringify(clean))
    else store.removeItem(COMPOSING)
    memo = null
  } catch {
    memo = clean
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CHANGE))
}

function subscribe(change: () => void): () => void {
  window.addEventListener(CHANGE, change)
  window.addEventListener('storage', change)
  return () => {
    window.removeEventListener(CHANGE, change)
    window.removeEventListener('storage', change)
  }
}

const NONE: Composing = {}

/** The person's composer setting, live. The server and the first render read none. */
export function useComposing(): Composing {
  return useSyncExternalStore(subscribe, () => readComposing(), () => NONE)
}

/** What the person's account holds, or nothing — the same rule as `load`. */
export async function loadComposing(account: Account): Promise<Composing | undefined> {
  const theirs = await get('composer', account)
  return theirs === undefined ? undefined : composing(theirs)
}

/** Record it on the account, answering whether it stuck. */
export function saveComposing(next: Composing, account: Account): Promise<boolean> {
  return put('composer', composing(next), account)
}
