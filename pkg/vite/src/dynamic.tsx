/**
 * A component whose code loads on its own. Rendered on the server by default,
 * so the page's HTML holds it; `ssr: false` draws `loading` there and on the
 * first client render alike, then loads after hydration. Like the App Router,
 * `ssr: false` belongs in a client component.
 */
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from 'react'

type Loaded<P> = ComponentType<P> | { default: ComponentType<P> }

export interface Options {
  ssr?: boolean
  loading?: (state: { isLoading: boolean; pastDelay: boolean; error: Error | null }) => ReactNode
}

export default function dynamic<P extends object>(load: () => Promise<Loaded<P>>, options: Options = {}): ComponentType<P> {
  const Lazy = lazy(async () => {
    const m = await load()
    return { default: ((m as { default?: ComponentType<P> }).default ?? m) as ComponentType<P> }
  })
  const fallback = options.loading ? options.loading({ isLoading: true, pastDelay: true, error: null }) : null
  const Body = Lazy as unknown as ComponentType<P>
  function Shown(props: P) {
    return (
      <Suspense fallback={fallback}>
        <Body {...props} />
      </Suspense>
    )
  }
  if (options.ssr !== false) return Shown
  function Later(props: P) {
    const [on, set] = useState(false)
    useEffect(() => set(true), [])
    return on ? <Shown {...props} /> : fallback
  }
  return Later
}
