'use client'

import { useCallback, useEffect, useState } from 'react'
import { account, acceptTerms, API, preferences, rename, saveProgress } from './api'
import { chatStep, owesTerms, step, type Accepted, type Policy, type Progress, type Stored } from './state'

export type Track = (name: string, props?: Record<string, unknown>) => void

export interface Session {
  /** Nothing has answered yet. */
  loading: boolean
  progress: Progress
  trainOptIn: boolean | undefined
  /** The display name IAM holds, if any. */
  name: string
  /** The verified address of the account. */
  email: string
  /** The "Let's create your account" page is owed (see `owesTerms`). */
  owesTerms: boolean
  /** Record the acceptance on the IAM user. */
  accept: (policy: Policy) => Promise<Accepted>
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
  const [me, setMe] = useState<{ email: string; createdTime?: string }>({ email: '' })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    Promise.all([preferences(api).catch(() => ({}) as Stored), account(api).catch(() => null)]).then(([prefs, me]) => {
      if (!live) return
      setStored(prefs ?? {})
      const a = me as { displayName?: string; name?: string; email?: string; createdTime?: string } | null
      setNameState(a?.displayName?.trim() ?? '')
      setMe({ email: a?.email ?? '', createdTime: a?.createdTime })
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

  const accept = useCallback(
    async (policy: Policy) => {
      const done = await acceptTerms(api, policy)
      setStored((s) => ({ ...s, terms: done }))
      return done
    },
    [api],
  )

  return { loading, progress: stored.onboarding ?? {}, trainOptIn: stored.train_opt_in, name, email: me.email, owesTerms: owesTerms(stored.terms, me.createdTime), accept, save, setName, setTrain, error }
}

/**
 * Whether this person still has a first-run step to do, from the terms page to
 * the role. A failed read answers `pending: false`, because a broken read must
 * not lock anyone out.
 */
export async function firstRun(api: string = API): Promise<{ pending: boolean; plan: string | undefined }> {
  try {
    const [s, me] = await Promise.all([preferences(api), account(api)])
    const p = s?.onboarding ?? {}
    const pending = owesTerms(s?.terms, me?.createdTime) || step(p) !== 'done' || chatStep(p, Boolean(me?.displayName?.trim())) !== 'done'
    return { pending, plan: p.plan }
  } catch {
    return { pending: false, plan: undefined }
  }
}

/** `firstRun` as a hook: `pending` is `null` while IAM has not answered, so a gate never flashes the wrong screen. */
export function useOnboarded(api: string = API): { pending: boolean | null; plan: string | undefined } {
  const [state, setState] = useState<{ pending: boolean | null; plan: string | undefined }>({ pending: null, plan: undefined })
  useEffect(() => {
    let live = true
    void firstRun(api).then((r) => live && setState(r))
    return () => {
      live = false
    }
  }, [api])
  return state
}
