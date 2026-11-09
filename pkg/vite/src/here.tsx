'use client'

/**
 * Where the reader is, for client components: the path the page was rendered
 * for, the query the address carries now, and the router.
 *
 * Moving to another page loads it: every page is a file, and a full load is
 * the one navigation a static site cannot get wrong. A move that changes only
 * the query or the hash stays on the page, through history, and every
 * `useSearchParams` reads the new query.
 */
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react'

const Path = createContext<string>('/')

/** Set once, above the root layout, with the path this page answers. */
export function Here({ path, children }: { path: string; children: ReactNode }) {
  return <Path.Provider value={path}>{children}</Path.Provider>
}

export const usePathname = (): string => useContext(Path)

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  window.addEventListener('popstate', l)
  return () => {
    listeners.delete(l)
    window.removeEventListener('popstate', l)
  }
}

/** The address's query. The export knows none, so the first render reads none, as the server did. */
export function useSearchParams(): URLSearchParams {
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => '')
  return useMemo(() => new URLSearchParams(search), [search])
}

const go = (href: string, replace: boolean) => {
  const to = new URL(href, window.location.href)
  if (to.origin === window.location.origin && to.pathname === window.location.pathname) {
    window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', to)
    notify()
    if (to.hash) document.getElementById(decodeURIComponent(to.hash.slice(1)))?.scrollIntoView()
    return
  }
  if (replace) window.location.replace(to)
  else window.location.assign(to)
}

export interface Router {
  push(href: string): void
  replace(href: string): void
  back(): void
  forward(): void
  refresh(): void
  prefetch(href: string): void
}

const ROUTER: Router = {
  push: (href) => go(href, false),
  replace: (href) => go(href, true),
  back: () => window.history.back(),
  forward: () => window.history.forward(),
  refresh: () => window.location.reload(),
  prefetch: () => undefined,
}

export const useRouter = (): Router => ROUTER
