'use client'

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { IAM, SecondFactor, type Methods } from '@hanzo/iam'
import { useIam } from '@hanzo/iam/react'
import { HanzoMark } from '@hanzogui/shell'
import { ArrowLeft } from '@hanzogui/lucide-icons-2'
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons'
import { Button } from '../backends/gui/button'
import { Card, CardContent } from '../backends/gui/card'
import { Field, FieldError, FieldLabel, FieldSeparator } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, SizableText, XStack, YStack } from '../backends/gui/layout'

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
  const one = busy ? 'One moment…' : null

  return (
    <YStack render="section" aria-label={signup ? 'Sign up' : 'Log in'} items="center" gap="$5" minH={560} pt={112} pb={96} px="$4">
      <Card width="100%" maxW={400}>
        <CardContent gap="$5">
          <XStack items="center" gap="$2.5">
            <HanzoMark size={20} />
            <SizableText size="$5" fontWeight="500" color="$ink">
              {site}
            </SizableText>
          </XStack>
          <Heading render="h1" size="$8" fontWeight="500" color="$ink" m={0}>
            {title}
          </Heading>

          {step === 'email' ? (
            <>
              {methods.providers.length ? (
                <YStack gap="$2.5">
                  {methods.providers.map((p) => (
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
                  <FieldLabel htmlFor="hanzo-email">Email</FieldLabel>
                  <Input id="hanzo-email" type="email" name="email" autoComplete={signup ? 'email' : 'username'} value={email} onChangeText={setEmail} placeholder="you@company.com" autoFocus />
                </Field>
                <Wrong text={wrong} />
                <Go busy={busy}>{one ?? 'Continue'}</Go>
              </YStack>
            </>
          ) : (
            <YStack render={<form onSubmit={finish} noValidate />} gap="$4">
              <XStack items="center" gap="$2" minW={0}>
                <Button type="button" variant="ghost" size="icon" aria-label="Use another email" onClick={back}>
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
            </YStack>
          )}

          {signup ? (
            <Paragraph size="$1" color="$quiet" m={0}>
              By creating an account you agree to the <Anchor href={termsPath} color="$ink" textDecorationLine="underline">Terms</Anchor> and the <Anchor href={privacyPath} color="$ink" textDecorationLine="underline">Privacy Policy</Anchor>.
            </Paragraph>
          ) : null}
        </CardContent>
      </Card>
      <Paragraph size="$2" color="$quiet" m={0}>
        {signup ? 'Have an account? ' : `New to ${site}? `}
        <Anchor href={`${signup ? loginPath : signupPath}${query}`} color="$ink" textDecorationLine="underline">
          {signup ? 'Log in' : 'Create an account'}
        </Anchor>
      </Paragraph>
    </YStack>
  )
}

function Brand({ kind }: { kind: string }) {
  return kind === 'google' ? <SiGoogle size={16} /> : kind === 'github' ? <SiGithub size={16} /> : null
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
