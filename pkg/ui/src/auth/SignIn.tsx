'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { IAM, SecondFactor, type Methods } from '@hanzo/iam'
import { useIam } from '@hanzo/iam/react'
import { HanzoMark } from '@hanzogui/shell'

/**
 * Signing in and signing up, drawn on the host site's own page.
 *
 * IAM is the authority and the only one: it checks the password or the code,
 * creates the account, mints the PKCE-bound code and, at the callback, the
 * tokens. This component is where the person types, and nothing more: no
 * password is kept and no session is made here.
 *
 *   a social provider   a top-level hop through IAM to the provider and back to
 *                       the callback. IAM's own page is never drawn; the
 *                       provider's is, because only the provider can ask.
 *   email, password     `loginWithPassword`: the credential goes to IAM, a code
 *                       comes back, the browser goes to the callback.
 *   email, a code       `sendLoginCode`, then `loginWithCode`.
 *   a new account       `sendLoginCode` proves the address, then `signup`.
 *
 * The credential calls go to `via` (this origin by default), which answers
 * IAM's /v1/iam routes, so no IAM route is opened cross-origin. An account with
 * a second factor finishes on the issuer's page: IAM holds that ceremony in a
 * cookie on the issuer.
 *
 * Styled by `@hanzo/ui/auth.css`, which the host imports once.
 */

export type Mode = 'login' | 'signup'

type Step = 'email' | 'password' | 'code' | 'create'

export interface Provider {
  name: string
  type: string
}

export interface SignInProps {
  mode?: Mode
  /** The product's name on the card: `Hanzo`. */
  site?: string
  /** Where IAM sends the browser with the code. Default `/auth/callback`. */
  callbackPath?: string
  /** What is offered until IAM says. Default: Google and GitHub, the two Hanzo runs. */
  providers?: Provider[]
  /** The origin that answers IAM's credential calls. Default: this page's origin. */
  via?: string
  /** Where the login page is, for the other-mode link. */
  loginPath?: string
  signupPath?: string
  termsPath?: string
  privacyPath?: string
  /** A step the stream should hear: `signup_submitted{method}`, `signup_viewed{mode}`. */
  track?: (name: string, props?: Record<string, unknown>) => void
  /** Decorates an address the browser is about to leave for (the visitor rides along). */
  authorize?: (url: string) => string
  /** The way in the person chose, kept for the callback. */
  onMethod?: (method: string, mode: Mode) => void
  /** The card is drawn (once). */
  onShown?: () => void
}

const FIRST: Methods = {
  password: true,
  code: true,
  signup: true,
  providers: [
    { name: 'provider-google', type: 'Google' },
    { name: 'provider-github', type: 'GitHub' },
  ],
}

const said = (err: unknown): string => (err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.')

const GOOGLE =
  'M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 2.14-5.63 2.14-4.64 0-8.26-3.74-8.26-8.38s3.62-8.38 8.26-8.38c2.5 0 4.34.99 5.69 2.26l2.31-2.31C18.96 1.28 16.46 0 12.48 0 5.72 0 .04 5.5.04 12.28s5.68 12.28 12.44 12.28c3.65 0 6.4-1.2 8.55-3.44 2.21-2.21 2.9-5.32 2.9-7.83 0-.78-.06-1.5-.18-2.1z'
const GITHUB =
  'M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z'

function Brand({ kind }: { kind: string }) {
  const d = kind === 'google' ? GOOGLE : kind === 'github' ? GITHUB : null
  return d ? (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  ) : null
}

export function SignIn({
  mode = 'login',
  site = 'Hanzo',
  callbackPath = '/auth/callback',
  providers,
  via,
  loginPath = '/login',
  signupPath = '/signup',
  termsPath = '/terms',
  privacyPath = '/privacy',
  track,
  authorize = (u) => u,
  onMethod,
  onShown,
}: SignInProps) {
  const { config, sdk } = useIam()
  const [methods, setMethods] = useState<Methods>(providers ? { ...FIRST, providers } : FIRST)
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [wrong, setWrong] = useState<string | null>(null)

  const origin = via ?? (typeof window === 'undefined' ? '' : window.location.origin)
  const iam = useMemo(
    () => new IAM({ ...config, proxyBaseUrl: origin || undefined, redirectUri: origin ? `${origin}${callbackPath}` : config.redirectUri }),
    [config, origin, callbackPath],
  )

  useEffect(() => {
    let live = true
    iam
      .methods()
      .then((m) => {
        // A list with no provider in it is IAM saying none; one that failed to
        // arrive keeps the ones Hanzo runs.
        if (live) setMethods(m)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [iam])

  useEffect(() => {
    track?.('signup_viewed', { mode })
    onShown?.()
    // Once, when the card first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signup = mode === 'signup'

  function commit(method: string) {
    onMethod?.(method, mode)
    if (signup) track?.('signup_submitted', { method })
  }

  /** The issuer's page, for what cannot be typed here, with the address filled in. */
  const issuer = async () => {
    window.location.replace(authorize(await sdk.getSigninUrl({ additionalParams: { login_hint: email.trim(), ...(signup ? { signup: 'true' } : {}) } })))
  }

  async function run(call: () => Promise<string | void>) {
    setBusy(true)
    setWrong(null)
    try {
      const to = await call()
      if (to) window.location.assign(authorize(to))
      else setBusy(false)
    } catch (err) {
      if (err instanceof SecondFactor) {
        await issuer()
        return
      }
      setWrong(said(err))
      setBusy(false)
    }
  }

  function social(provider: string, kind: string) {
    commit(kind.toLowerCase())
    setBusy(true)
    void sdk
      .getSigninUrl({ additionalParams: { provider } })
      .then((u) => window.location.replace(authorize(u)))
      .catch((err: unknown) => {
        setWrong(said(err))
        setBusy(false)
      })
  }

  async function sendCode() {
    await run(async () => {
      await iam.sendLoginCode(email.trim())
      setCode('')
      setStep('code')
    })
  }

  function next(e: FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (!address.includes('@')) {
      setWrong('Enter your email address.')
      return
    }
    if (signup) {
      void run(async () => {
        await iam.sendLoginCode(address)
        setStep('create')
      })
      return
    }
    setWrong(null)
    if (methods.password) setStep('password')
    else void sendCode()
  }

  function finish(e: FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (step === 'password') {
      commit('password')
      void run(() => iam.loginWithPassword(address, password))
    } else if (step === 'code') {
      commit('code')
      void run(() => iam.loginWithCode(address, code.trim()))
    } else if (step === 'create') {
      commit('email')
      void run(() => iam.signup({ email: address, password, code: code.trim(), name: name.trim() || undefined }))
    }
  }

  const back = () => {
    setStep('email')
    setWrong(null)
    setPassword('')
    setCode('')
  }

  const query = typeof window === 'undefined' ? '' : window.location.search
  const title = signup ? `Create your ${site} account` : `Log in to ${site}`

  return (
    <section className="hz-signin" aria-label={signup ? 'Sign up' : 'Log in'}>
      <div className="hz-signin-card">
        <p className="hz-signin-brand">
          <HanzoMark size={20} />
          {site}
        </p>
        <h1 className="hz-signin-title">{title}</h1>

        {step === 'email' ? (
          <>
            {methods.providers.length ? (
              <div className="hz-signin-social">
                {methods.providers.map((p) => (
                  <button key={p.name} type="button" className="hz-action" onClick={() => social(p.name, p.type)} disabled={busy}>
                    <Brand kind={p.type.toLowerCase()} />
                    Continue with {p.type}
                  </button>
                ))}
              </div>
            ) : null}
            {methods.providers.length ? <p className="hz-signin-or">or</p> : null}
            <form onSubmit={next} noValidate>
              <Field label="Email">
                <input
                  type="email"
                  name="email"
                  autoComplete={signup ? 'email' : 'username'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                />
              </Field>
              <Wrong text={wrong} />
              <button type="submit" className="hz-action" data-fill="" disabled={busy}>
                {busy ? 'One moment…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={finish} noValidate>
            <p className="hz-signin-who">
              <button type="button" className="hz-more" onClick={back} aria-label="Use another email">
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m12 19-7-7 7-7M19 12H5" />
                </svg>
              </button>
              <span>{email.trim()}</span>
            </p>
            {step === 'password' ? (
              <Field label="Password">
                <input type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus />
              </Field>
            ) : (
              <>
                <p className="hz-signin-note">We sent a code to {email.trim()}. It is good for a few minutes.</p>
                <Field label="Code">
                  <input name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} required autoFocus />
                </Field>
              </>
            )}
            {step === 'create' ? (
              <>
                <Field label="Your name">
                  <input name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Password">
                  <input type="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Field>
              </>
            ) : null}
            <Wrong text={wrong} />
            <button type="submit" className="hz-action" data-fill="" disabled={busy}>
              {busy ? 'One moment…' : step === 'create' ? 'Create account' : 'Continue'}
            </button>
            {step === 'password' && methods.code ? (
              <button type="button" className="hz-more hz-signin-alt" onClick={() => void sendCode()} disabled={busy}>
                Email me a code instead
              </button>
            ) : null}
            {step !== 'password' ? (
              <button type="button" className="hz-more hz-signin-alt" onClick={() => void sendCode()} disabled={busy}>
                Send a new code
              </button>
            ) : null}
          </form>
        )}

        {signup ? (
          <p className="hz-signin-fine">
            By creating an account you agree to the <a href={termsPath}>Terms</a> and the <a href={privacyPath}>Privacy Policy</a>.
          </p>
        ) : null}
      </div>
      <p className="hz-signin-else">
        {signup ? 'Have an account? ' : `New to ${site}? `}
        <a href={`${signup ? loginPath : signupPath}${query}`}>{signup ? 'Log in' : 'Create an account'}</a>
      </p>
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="hz-signin-field">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Wrong({ text }: { text: string | null }) {
  return text ? (
    <p role="alert" className="hz-signin-wrong">
      {text}
    </p>
  ) : null
}
