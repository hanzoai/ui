'use client'

/**
 * Toast — the ONE feedback primitive. Every mutation reports through `useToast()`
 * so success/failure looks and behaves the same everywhere. A single provider
 * holds the queue and renders the viewport (portalled top-right); there is no
 * per-call markup. Built from GUI primitives only.
 *
 * Mount `<ToastProvider>` once (the dashboard layout does). Call:
 *   const toast = useToast()
 *   toast.success('Created my-db')
 *   toast.error(err instanceof ApiError ? err.message : 'Failed to create')
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'
import { CircleCheck, CircleX, Info, TriangleAlert, X } from '@hanzogui/lucide-icons-2'

import { useEmit } from './instrument'

/**
 * The four things a mutation can report. `warning` is here because surfaces
 * genuinely raise it — "saved, but the version did not change", "3 of 5 files
 * downloaded" — and without it those land as `error` (alarming, and wrong) or
 * `info` (invisible). Measured on one surface alone: 14 call sites.
 */
export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export type ToastInput = {
  title: string
  description?: string
  kind?: ToastKind
  /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
  durationMs?: number
  /** Drop the leading icon. Defaults to showing it. */
  showIcon?: boolean
}

/** A toast on screen: an input with its defaults resolved, and an id. */
export type Toast = ToastInput & { id: number; kind: ToastKind; durationMs: number; showIcon: boolean }

/**
 * What `useToast()` answers. Exported because a consumer that passes the api
 * down, or stores it, has to be able to name its type — it could not before,
 * which made the hook awkward to build on.
 */
export type ToastApi = {
  toast: (t: ToastInput) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Theme-aware accent per kind (adapts to light/dark). */
const ACCENT = {
  success: '$green10',
  error: '$red10',
  warning: '$yellow10',
  info: '$quiet',
} as const

const ICON: Record<ToastKind, typeof Info> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
}

/** How long each kind stays. Anything that went wrong is worth re-reading. */
const DURATION: Record<ToastKind, number> = {
  success: 3500,
  error: 6000,
  warning: 6000,
  info: 3500,
}

function ToastCard({ t, onClose }: { t: Toast; onClose: () => void }) {
  const Icon = ICON[t.kind]
  const accent = ACCENT[t.kind]
  return (
    <Card
      width={360}
      maxWidth="90%"
      p="$3"
      gap="$2"
      bg="$panel"
      borderWidth={1}
      borderColor="$borderColor"
      borderLeftWidth={3}
      borderLeftColor={accent}
      rounded="$4"
      elevation="$2"
    >
      <XStack gap="$2.5" items="flex-start">
        {t.showIcon ? (
          <YStack pt={1}>
            <Icon size={18} color={accent} />
          </YStack>
        ) : null}
        <YStack flex={1} gap="$1">
          <Text fontSize="$3" fontWeight="700" color="$ink">
            {t.title}
          </Text>
          {t.description ? (
            <Text fontSize="$2" color="$quiet">
              {t.description}
            </Text>
          ) : null}
        </YStack>
        <Button size="$1" chromeless icon={<X size={14} />} onPress={onClose} aria-label="Dismiss" />
      </XStack>
    </Card>
  )
}

/** Portalled, fixed top-right stack. Rendered only after mount (SSR-safe). */
function ToastViewport({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted || typeof document === 'undefined') return null
  return createPortal(
    <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100000, pointerEvents: 'none' }}>
      <YStack gap="$2" items="flex-end">
        {toasts.map((t) => (
          <YStack key={t.id} pointerEvents="auto">
            <ToastCard t={t} onClose={() => dismiss(t.id)} />
          </YStack>
        ))}
      </YStack>
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const track = useEmit()
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++seq.current
      const kind = input.kind ?? 'info'
      const durationMs = input.durationMs ?? DURATION[kind]
      const showIcon = input.showIcon ?? true
      track({ component: 'Toast', action: kind === 'error' ? 'error' : 'view', id: input.title, value: kind })
      setToasts((ts) => [
        ...ts,
        { id, kind, title: input.title, description: input.description, durationMs, showIcon },
      ])
      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), durationMs),
        )
      }
    },
    [dismiss, track],
  )

  // Clear any pending timers on unmount.
  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  // Memoized because the api is what a consumer holds. Rebuilt every render it
  // is a new identity every render, so any `useCallback`/`useEffect` keyed on it
  // re-runs on each parent render — which is exactly what an adapter wrapping
  // this hook does. `toast` and `dismiss` are already stable.
  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, kind: 'success' }),
      error: (title, description) => toast({ title, description, kind: 'error' }),
      warning: (title, description) => toast({ title, description, kind: 'warning' }),
      info: (title, description) => toast({ title, description, kind: 'info' }),
      dismiss,
    }),
    [toast, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
