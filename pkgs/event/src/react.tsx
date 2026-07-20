// React bindings for @hanzo/event — a provider, an accessor hook, a route-change
// pageview hook, and an error boundary. Framework-neutral: it takes the current
// path as an argument (the Next app wires usePathname(); a Vite/router app passes
// its own), so this file never imports next/*.
//
//   'use client'
//   import { AnalyticsProvider, useAnalytics, usePageview, ErrorBoundary } from '@hanzo/event/react'
//
//   <AnalyticsProvider config={{ product: 'console' }}>…</AnalyticsProvider>
//   const a = useAnalytics(); usePageview(usePathname())

import {
  Component,
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from 'react'
import { Analytics, createAnalytics } from './core'
import type { AnalyticsConfig } from './types'

const Ctx = createContext<Analytics | null>(null)

export interface AnalyticsProviderProps {
  /** Provide a pre-built client, or a config to build one. */
  client?: Analytics
  config?: AnalyticsConfig
  /** Fire a pageview for the initial load (default true). */
  autoPageview?: boolean
  children: ReactNode
}

export function AnalyticsProvider(props: AnalyticsProviderProps) {
  const { client, config, autoPageview = true, children } = props
  const instance = useMemo<Analytics>(() => {
    if (client) return client
    if (config) return createAnalytics(config)
    throw new Error('AnalyticsProvider requires `client` or `config`')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client])

  useEffect(() => {
    instance.init()
    if (autoPageview) instance.pageview()
  }, [instance, autoPageview])

  return createElement(Ctx.Provider, { value: instance }, children)
}

/** useAnalytics returns the client. Outside a provider it returns a no-op-safe
 *  null-guarded proxy so calls never throw during SSR/tests. */
export function useAnalytics(): Analytics {
  const a = useContext(Ctx)
  if (!a) return noop
  return a
}

/** usePageview fires a pageview on every route CHANGE (not the initial mount —
 *  the provider's autoPageview covers that, so pages are counted exactly once). */
export function usePageview(path: string | null | undefined): void {
  const a = useContext(Ctx)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (a && path) a.pageview(path)
  }, [a, path])
}

// A shared no-op client for use outside a provider — keeps call sites total.
const noop = new Analytics({ product: 'unknown', enabled: false })

export interface ErrorBoundaryProps {
  children: ReactNode
  /** Rendered when a child throws. A function receives the error + a reset. */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  /** Explicit client; defaults to the one from AnalyticsProvider. */
  client?: Analytics
}

interface ErrorBoundaryState {
  error: Error | null
}

/** ErrorBoundary reports React render errors to the client as error events —
 *  React swallows these before window.onerror sees them, so a boundary is the
 *  ONLY way to capture them. This is the React half of the @sentry replacement.
 *  Pair it with AnalyticsProvider (it reads the client from context), or pass an
 *  explicit `client`. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static contextType = Ctx
  declare context: React.ContextType<typeof Ctx>
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const client = this.props.client ?? this.context ?? undefined
    client?.captureError(error, {
      handled: false,
      properties: { componentStack: info.componentStack, react: true },
    })
  }

  private reset = () => this.setState({ error: null })

  render(): ReactNode {
    const { error } = this.state
    if (error === null) return this.props.children
    const { fallback } = this.props
    if (typeof fallback === 'function') return fallback(error, this.reset)
    return fallback ?? null
  }
}
