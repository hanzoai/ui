// The first-run CLI step's logic, apart from any drawing: what the commands are, how a phone sends them, how
// the wait for `hanzo` to register the computer is read. Hosts that draw their own surface (platform.hanzo.ai) import this alone,
// so they do not carry the checkout the rest of onboarding reaches.
'use client'

import { useEffect, useRef, useState } from 'react'
import { links } from './api'

/**
 * The two commands of the first run: install, then `hanzo`, which signs in through the browser, links Hanzo Tabs,
 * asks once which coding agent the person uses and starts it; after that `hanzo` alone starts it.
 */
export const COMMANDS = [
  { key: 'install', label: 'Install', run: 'curl -fsSL hanzo.sh | sh' },
  { key: 'start', label: 'Start', run: 'hanzo' },
] as const

/** Where the same commands are written down, for the link a phone sends to a computer. */
const GUIDE = 'https://hanzo.ai/cli'

/** What a phone sends to the person's computer: the commands and where they are explained. */
export const message = (): string => `Set up the Hanzo CLI on your computer. In a terminal:\n\n${COMMANDS.map((c) => c.run).join('\n')}\n\n${GUIDE}`

/** Copy text where the browser lets a page: the clipboard, else the selection of a hidden field. */
export async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const field = document.createElement('textarea')
    field.value = text
    field.setAttribute('readonly', '')
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px'
    document.body.appendChild(field)
    field.select()
    try {
      return document.execCommand('copy')
    } catch {
      return false
    } finally {
      document.body.removeChild(field)
    }
  }
}

/** A phone is a touch screen narrower than a tablet: nobody types a terminal command into one. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(pointer: coarse) and (max-width: 820px)')
    const sync = () => setPhone(q.matches)
    sync()
    q.addEventListener('change', sync)
    return () => q.removeEventListener('change', sync)
  }, [])
  return phone
}

const POLL = 3000
const GIVE_UP = 30 * 60 * 1000

/** Answers the host's name once a computer has signed the CLI in, else null. A failed read is a rejection. */
export type Read = () => Promise<string | null>

/** The cloud's link registry: `hanzo` registers the computer there, and its first entry ends the wait. */
export const readLinks =
  (api: string): Read =>
  async () => {
    const r = await links(api)
    const seen = (r?.devices ?? []).length > 0 ? r.devices : (r?.links ?? []).filter((l) => l.status !== 'revoked')
    return seen && seen.length > 0 ? seen[0]?.host?.trim() || 'your computer' : null
  }

/**
 * Watches for the CLI's sign-in. A failed read keeps waiting (the person can still skip); a hidden tab does not
 * poll; it gives up after half an hour.
 */
export function useComputer(read: Read): string | null {
  const [host, setHost] = useState<string | null>(null)
  const reader = useRef(read)
  reader.current = read
  useEffect(() => {
    let live = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const stop = Date.now() + GIVE_UP
    const tick = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const h = await reader.current()
          if (live && h) {
            setHost(h)
            return
          }
        } catch {
          // Not readable yet (no organization, offline): keep waiting.
        }
      }
      if (live && Date.now() < stop) timer = setTimeout(tick, POLL)
    }
    void tick()
    return () => {
      live = false
      if (timer) clearTimeout(timer)
    }
  }, [])
  return host
}

