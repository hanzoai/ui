'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import * as Iam from '@hanzo/iam'
import { IAM, SecondFactor, type Methods } from '@hanzo/iam'
import { useIam } from '@hanzo/iam/react'
import { HanzoMark } from '@hanzogui/shell'
import { ArrowLeft } from '@hanzogui/lucide-icons-2'
import { SiApple, SiGithub, SiGoogle } from '@icons-pack/react-simple-icons'
import { Button } from '../backends/gui/button'
import { Card, CardContent } from '../backends/gui/card'
import { Field, FieldError, FieldLabel, FieldSeparator } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'
import { CreateAccount } from '../onboarding/account'
import { live } from './session'
import type { Policy } from '../onboarding/state'

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
 * Drawn from @hanzo/ui components in the theme's tokens: the host mounts
 * `<Hanzo>` (or its own GuiProvider) and imports no stylesheet.
 */

export type Mode = 'login' | 'signup'

type Step = 'email' | 'password' | 'code' | 'create' | 'terms'

export interface Provider {
  name: string
  type: string
}

export interface SignInProps {
  mode?: Mode
  /**
   * Draw the card alone, for a page that has its own brand, headline and other-mode
   * line (a hero): no outer padding or minimum height, no brand row, no heading and
   * no "New to Hanzo?" line. Default true.
   */
  frame?: boolean
  /**
   * The versions of the Terms and the Acceptable Use Policy. An address proved by a
   * code that holds no account is asked to accept them on "Let's create your
   * account" before IAM makes the account. Without it, that address is refused as
   * it always was.
   */
  policy?: Policy
  aupPath?: string
  /**
   * Offer Google One Tap to a visitor with no session who is signed in to Google:
   * the Google Identity Services script is loaded after first paint, the client id
   * comes from IAM's auth/methods, and the credential goes to IAM
   * (`loginWithGoogleCredential`). Drawn only when IAM advertises a Google client id
   * and the SDK has that call; otherwise nothing is loaded. Default false.
   */
  oneTap?: boolean
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

/** IAM's answer to a proven code for an address with no account (the SDK's typed `SignupRequired`). */
const signupRequired = (err: unknown): boolean => {
  const kind = (Iam as Record<string, unknown>).SignupRequired
  return (typeof kind === 'function' && err instanceof (kind as new (...args: never[]) => Error)) || (err as { name?: string } | null)?.name === 'SignupRequired'
}

/** The SDK call that makes the account with the code and the accepted versions; absent from an SDK that predates it. */
type Creating = { createAccountWithCode: (email: string, code: string, policy: Policy) => Promise<string | void> }
const creates = (client: unknown): client is Creating => typeof (client as Partial<Creating>).createAccountWithCode === 'function'

const said = (err: unknown): string => (err instanceof Error && err.message ? err.message : 'Something went wrong. Try again.')

/** The providers in the order they are offered: Google, Apple, GitHub, then any others as IAM lists them. */
const RANK = ['google', 'apple', 'github']
const rank = (p: Provider): number => {
  const i = RANK.indexOf(p.type.toLowerCase())
  return i < 0 ? RANK.length : i
}
export const inOrder = (providers: Provider[]): Provider[] => [...providers].sort((a, b) => rank(a) - rank(b))

/** What IAM's auth/methods says beyond the SDK's own reading: a phone sign-in, and Google's client id for One Tap. */
interface Extras {
  phone: boolean
  google?: { clientId: string; nonce?: string }
}

async function readMethods(serverUrl: string, clientId: string): Promise<{ methods: Methods; extras: Extras }> {
  const url = new URL(`${serverUrl.replace(/\/+$/, '')}/v1/iam/auth/methods`)
  url.searchParams.set('clientId', clientId)
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } })
  const body = (await res.json()) as { status?: string; data?: Record<string, unknown> } & Record<string, unknown>
  if (!res.ok) throw new Error('could not read the sign-in methods')
  const data = (body.status ? body.data : body) ?? {}
  const oauth = (Array.isArray(data.oauth) ? data.oauth : []) as Record<string, unknown>[]
  const named = oauth.filter((p) => typeof p.name === 'string' && typeof p.type === 'string')
  const google = named.find((p) => p.name === 'provider-google')
  const id = google?.clientId ?? google?.client_id
  return {
    methods: { password: data.password === true, code: data.code === true, signup: data.signup === true, providers: named.map((p) => ({ name: p.name as string, type: p.type as string })) },
    extras: { phone: data.phone === true || data.sms === true, google: typeof id === 'string' && id ? { clientId: id, nonce: typeof google?.nonce === 'string' ? google.nonce : undefined } : undefined },
  }
}

/** The SDK call that signs in with Google's One Tap credential; absent from an SDK that predates it. */
type Tapping = { loginWithGoogleCredential: (credential: string, nonce: string) => Promise<string> }
const taps = (client: unknown): client is Tapping => typeof (client as Partial<Tapping>).loginWithGoogleCredential === 'function'

interface Gsi {
  accounts: { id: { initialize: (o: Record<string, unknown>) => void; prompt: () => void; cancel: () => void } }
}
const GSI = 'https://accounts.google.com/gsi/client'

/** Load Google Identity Services once, after the page has painted and is idle. */
function loadGsi(): Promise<Gsi> {
  const w = window as unknown as { google?: Gsi }
  if (w.google?.accounts?.id) return Promise.resolve(w.google)
  return new Promise((resolve, reject) => {
    const tag = document.createElement('script')
    tag.src = GSI
    tag.async = true
    tag.onload = () => (w.google?.accounts?.id ? resolve(w.google) : reject(new Error('Google Identity Services did not load')))
    tag.onerror = () => reject(new Error('Google Identity Services did not load'))
    document.head.appendChild(tag)
  })
}

const whenIdle = (run: () => void): (() => void) => {
  let done = false
  const go = () => {
    if (!done) run()
  }
  const arm = () => {
    const ric = (window as unknown as { requestIdleCallback?: (f: () => void) => void }).requestIdleCallback
    if (ric) ric(go)
    else window.setTimeout(go, 1200)
  }
  if (document.readyState === 'complete') arm()
  else window.addEventListener('load', arm, { once: true })
  return () => {
    done = true
    window.removeEventListener('load', arm)
  }
}

/** A nonce for one One Tap prompt: IAM's when it sends one, else sixteen random bytes. */
const nonceFor = (given?: string): string => given ?? Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')

const PHONE = /^\+?[\d\s().-]{7,}$/

export function SignIn({
  mode = 'login',
  frame = true,
  policy,
  aupPath = '/aup',
  oneTap = false,
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
  const [extras, setExtras] = useState<Extras>({ phone: false })
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
    let current = true
    readMethods(config.serverUrl, config.clientId)
      .then((m) => {
        // A list with no provider in it is IAM saying none; one that failed to
        // arrive keeps the ones Hanzo runs.
        if (!current) return
        setMethods(m.methods)
        setExtras(m.extras)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [config.serverUrl, config.clientId])

  useEffect(() => {
    track?.('signup_viewed', { mode })
    onShown?.()
    // Once, when the card first appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signup = mode === 'signup'

  // Google One Tap, for a visitor with no session, once IAM has named the client and the SDK can take the credential.
  const client = extras.google
  useEffect(() => {
    if (!oneTap || !client || !taps(iam) || live()) return
    const nonce = nonceFor(client.nonce)
    const stop = whenIdle(() => {
      loadGsi()
        .then((g) => {
          g.accounts.id.initialize({
            client_id: client.clientId,
            nonce,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (r: { credential?: string }) => {
              if (!r.credential) return
              onMethod?.('google_one_tap', mode)
              track?.('signin_clicked', { method: 'google_one_tap' })
              void run(() => iam.loginWithGoogleCredential(r.credential as string, nonce))
            },
          })
          g.accounts.id.prompt()
        })
        .catch(() => {})
    })
    return () => {
      stop()
      ;(window as unknown as { google?: Gsi }).google?.accounts?.id?.cancel()
    }
    // One prompt per card and client.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneTap, client?.clientId, iam])

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
    // An address gets an emailed code; digits get a texted one, where IAM offers a phone sign-in.
    if (!address.includes('@') && !(extras.phone && PHONE.test(address))) {
      setWrong(extras.phone ? 'Enter your email address or phone number.' : 'Enter your email address.')
      return
    }
    // A sign-up whose SDK cannot make an account from a code keeps the password form.
    if (signup && !creates(iam)) {
      void run(async () => {
        await iam.sendLoginCode(address)
        setStep('create')
      })
      return
    }
    setWrong(null)
    if (methods.code) void sendCode()
    else setStep('password')
  }

  function finish(e: FormEvent) {
    e.preventDefault()
    const address = email.trim()
    if (step === 'password') {
      commit('password')
      void run(() => iam.loginWithPassword(address, password))
    } else if (step === 'code') {
      commit('code')
      void run(async () => {
        try {
          return await iam.loginWithCode(address, code.trim())
        } catch (err) {
          // The code is good and the address has no account: ask for the terms before making one.
          if (!signupRequired(err) || !policy || !creates(iam)) throw err
          setStep('terms')
        }
      })
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
  if (step === 'terms' && policy && creates(iam)) {
    return (
      <YStack position="fixed" t={0} l={0} r={0} b={0} z={1000} bg="$background" overflow="scroll">
        <CreateAccount
          site={site}
          email={email.trim()}
          busy={busy}
          wrong={wrong}
          termsPath={termsPath}
          aupPath={aupPath}
          onOther={back}
          onCreate={() => {
            commit('email')
            track?.('terms_accepted', { method: 'email-code' })
            void run(() => iam.createAccountWithCode(email.trim(), code.trim(), policy))
          }}
        />
      </YStack>
    )
  }
  const title = signup ? `Create your ${site} account` : `Log in to ${site}`
  const one = busy ? 'One moment…' : null

  return (
    <YStack render="section" aria-label={signup ? 'Sign up' : 'Log in'} items="center" gap="$5" {...(frame ? { minH: 560, pt: 112, pb: 96, px: '$4' } : {})}>
      <Card width="100%" maxW={400}>
        <CardContent gap="$5">
          {frame ? (
            <>
              <XStack items="center" gap="$2.5">
                <HanzoMark size={20} />
                <SizableText size="$5" fontWeight="500" color="$ink">
                  {site}
                </SizableText>
              </XStack>
              <Heading render="h1" size="$8" fontWeight="500" color="$ink" m={0}>
                {title}
              </Heading>
            </>
          ) : null}

          {step === 'email' ? (
            <>
              {methods.providers.length ? (
                <YStack gap="$2.5">
                  {inOrder(methods.providers).map((p) => (
                    <Button key={p.name} type="button" variant="secondary" size="lg" rounded="$10" width="100%" disabled={busy} onClick={() => social(p.name, p.type)}>
                      <Brand kind={p.type.toLowerCase()} />
                      {`Continue with ${p.type}`}
                    </Button>
                  ))}
                </YStack>
              ) : null}
              {methods.providers.length ? <FieldSeparator>or</FieldSeparator> : null}
              <YStack render={<form onSubmit={next} noValidate />} gap="$4">
                <Field gap="$2">
                  <FieldLabel htmlFor="hanzo-email">{extras.phone ? 'Email or phone' : 'Email'}</FieldLabel>
                  <Input id="hanzo-email" type={extras.phone ? 'text' : 'email'} name="email" autoComplete={signup ? 'email' : 'username'} value={email} onChangeText={setEmail} placeholder={extras.phone ? 'you@company.com or +1 555 010 0100' : 'you@company.com'} autoFocus />
                </Field>
                <Wrong text={wrong} />
                <Go busy={busy}>{one ?? 'Continue'}</Go>
              </YStack>
            </>
          ) : (
            <YStack render={<form onSubmit={finish} noValidate />} gap="$4">
              <XStack items="center" gap="$2" minW={0}>
                <Button type="button" variant="ghost" size="icon" aria-label={extras.phone ? 'Use another email or phone' : 'Use another email'} onClick={back}>
                  <ArrowLeft size={16} />
                </Button>
                <SizableText size="$2" color="$ink" numberOfLines={1} flex={1} minW={0}>
                  {email.trim()}
                </SizableText>
              </XStack>
              {step === 'password' ? (
                <Field gap="$2">
                  <FieldLabel htmlFor="hanzo-password">Password</FieldLabel>
                  <Input id="hanzo-password" type="password" name="password" autoComplete="current-password" value={password} onChangeText={setPassword} autoFocus />
                </Field>
              ) : (
                <>
                  <Paragraph size="$2" color="$quiet" m={0}>
                    We sent a code to {email.trim()}. It is good for a few minutes.
                  </Paragraph>
                  <Field gap="$2">
                    <FieldLabel htmlFor="hanzo-code">Code</FieldLabel>
                    <Input id="hanzo-code" name="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChangeText={setCode} autoFocus />
                  </Field>
                </>
              )}
              {step === 'create' ? (
                <>
                  <Field gap="$2">
                    <FieldLabel htmlFor="hanzo-name">Your name</FieldLabel>
                    <Input id="hanzo-name" name="name" autoComplete="name" value={name} onChangeText={setName} />
                  </Field>
                  <Field gap="$2">
                    <FieldLabel htmlFor="hanzo-new-password">Password</FieldLabel>
                    <Input id="hanzo-new-password" type="password" name="password" autoComplete="new-password" value={password} onChangeText={setPassword} />
                  </Field>
                </>
              ) : null}
              <Wrong text={wrong} />
              <Go busy={busy}>{one ?? (step === 'create' ? 'Create account' : 'Continue')}</Go>
              {step === 'password' && methods.code ? (
                <Button type="button" variant="linkMuted" size="lg" disabled={busy} onClick={() => void sendCode()}>
                  Email me a code instead
                </Button>
              ) : null}
              {step !== 'password' ? (
                <Button type="button" variant="linkMuted" size="lg" disabled={busy} onClick={() => void sendCode()}>
                  Send a new code
                </Button>
              ) : null}
              {step === 'code' && methods.password && !signup ? (
                <Button type="button" variant="linkMuted" size="lg" disabled={busy} onClick={() => setStep('password')}>
                  Use a password instead
                </Button>
              ) : null}
            </YStack>
          )}

          {signup ? (
            <Paragraph size="$1" color="$quiet" m={0}>
              By creating an account you agree to the <Anchor href={termsPath} color="$ink" textDecorationLine="underline">Terms</Anchor> and the <Anchor href={privacyPath} color="$ink" textDecorationLine="underline">Privacy Policy</Anchor>.
            </Paragraph>
          ) : null}
        </CardContent>
      </Card>
      {frame ? (
        <Paragraph size="$2" color="$quiet" m={0}>
          {signup ? 'Have an account? ' : `New to ${site}? `}
          <Anchor href={`${signup ? loginPath : signupPath}${query}`} color="$ink" textDecorationLine="underline">
            {signup ? 'Log in' : 'Create an account'}
          </Anchor>
        </Paragraph>
      ) : null}
    </YStack>
  )
}

function Brand({ kind }: { kind: string }) {
  return kind === 'google' ? <SiGoogle size={16} /> : kind === 'apple' ? <SiApple size={16} /> : kind === 'github' ? <SiGithub size={16} /> : null
}

/** The primary action of a step: filled with the ink, full width. */
function Go({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" rounded="$10" width="100%" bg="$ink" color="$background" borderColor="$ink" hoverStyle={{ opacity: 0.92 }} disabled={busy}>
      {children}
    </Button>
  )
}

function Wrong({ text }: { text: string | null }) {
  return text ? <FieldError>{text}</FieldError> : null
}
