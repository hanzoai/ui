'use client'

import { useCallback, useEffect, useState } from 'react'
import { account, API, preferences, rename, saveProgress } from './api'
import type { Progress, Stored } from './state'

export type Track = (name: string, props?: Record<string, unknown>) => void

export interface Session {
  /** Nothing has answered yet. */
  loading: boolean
  progress: Progress
  trainOptIn: boolean | undefined
  /** The display name IAM holds, if any. */
  name: string
  /** Merge a step into the stored progress (and the screen). */
  save: (patch: Progress) => Promise<void>
  setName: (name: string) => Promise<void>
  setTrain: (on: boolean) => Promise<void>
  error: string | null
}

/**
 * The person's onboarding, read from IAM once and written through as each step
 * finishes. A failed read leaves the flow at the start rather than blocking it.
 */
export function useSession(api: string = API): Session {
  const [loading, setLoading] = useState(true)
  const [stored, setStored] = useState<Stored>({})
  const [name, setNameState] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([preferences(api).catch(() => ({}) as Stored), account(api).catch(() => null)]).then(([prefs, me]) => {
      if (!live) return
      setStored(prefs ?? {})
      const a = me as { displayName?: string; name?: string } | null
      setNameState(a?.displayName?.trim() ?? '')
      setLoading(false)
    })
    return () => {
      live = false
    }
  }, [api])

  const save = useCallback(
    async (patch: Progress) => {
      setStored((s) => ({ ...s, onboarding: { ...(s.onboarding ?? {}), ...patch } }))
      try {
        await saveProgress(api, patch)
        setError(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save. Try again.')
      }
    },
    [api],
  )

  const setName = useCallback(
    async (n: string) => {
      await rename(api, n)
      setNameState(n)
      await save({ named: true })
    },
    [api, save],
  )

  const setTrain = useCallback(
    async (on: boolean) => {
      setStored((s) => ({ ...s, train_opt_in: on }))
      await preferences(api, { train_opt_in: on })
    },
    [api],
  )

  return { loading, progress: stored.onboarding ?? {}, trainOptIn: stored.train_opt_in, name, save, setName, setTrain, error }
}
