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
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, Text, XStack, YStack } from '@hanzo/gui'
import { CircleCheck, CircleX, Info, X } from '@hanzogui/lucide-icons-2'

export type ToastKind = 'success' | 'error' | 'info'

export type ToastInput = {
  title: string
  description?: string
  kind?: ToastKind
  /** Auto-dismiss after this many ms; 0 keeps it until dismissed. */
  durationMs?: number
}

type Toast = Required<Omit<ToastInput, 'description'>> & { id: number; description?: string }

type ToastApi = {
  toast: (t: ToastInput) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)

/** Theme-aware accent per kind (adapts to light/dark). */
const ACCENT = {
  success: '$green10',
  error: '$red10',
  info: '$color11',
} as const

const ICON: Record<ToastKind, typeof Info> = {
  success: CircleCheck,
  error: CircleX,
  info: Info,
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
      bg="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      borderLeftWidth={3}
      borderLeftColor={accent}
      rounded="$4"
      elevation="$2"
    >
      <XStack gap="$2.5" items="flex-start">
        <YStack pt={1}>
          <Icon size={18} color={accent} />
        </YStack>
        <YStack flex={1} gap="$1">
          <Text fontSize="$3" fontWeight="700" color="$color12">
            {t.title}
          </Text>
          {t.description ? (
            <Text fontSize="$2" color="$color11">
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
      const durationMs = input.durationMs ?? (kind === 'error' ? 6000 : 3500)
      setToasts((ts) => [...ts, { id, kind, title: input.title, description: input.description, durationMs }])
      if (durationMs > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), durationMs),
        )
      }
    },
    [dismiss],
  )

  // Clear any pending timers on unmount.
  useEffect(() => {
    const map = timers.current
    return () => map.forEach((t) => clearTimeout(t))
  }, [])

  const api: ToastApi = {
    toast,
    success: (title, description) => toast({ title, description, kind: 'success' }),
    error: (title, description) => toast({ title, description, kind: 'error' }),
    info: (title, description) => toast({ title, description, kind: 'info' }),
    dismiss,
  }

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
