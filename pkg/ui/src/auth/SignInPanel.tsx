'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { useIam } from '@hanzo/iam/react'
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons'
import { Button } from '../backends/gui/button'
import { Field, FieldError, FieldSeparator } from '../backends/gui/field'
import { Input } from '../backends/gui/input'
import { Anchor, Heading, Paragraph, YStack } from '../backends/gui/layout'
import { address, handoff, SIGNIN, type ProviderKind, type Way } from './handoff'

/**
 * The sign-in a Hanzo site draws on its own front page (hanzo.app, hanzo.bot,
 * hanzo.team), shared so every site asks the same way and leaves the same way.
 *
 * It looks like a sign-in and is a door: no credential is typed here, and no
 * session is made on this origin. Each press mints this site's own authorize
 * request (`getSigninUrl`, which keeps the PKCE verifier and state here) and
 * leaves with it (./handoff.ts): Google or GitHub straight to the provider, in one
 * press; an email to hanzo.ai/login with the address filled in; a new account to
 * hanzo.ai/signup. The session that answers is hanzo.ai's, so a person signed in
 * on any Hanzo site is not asked again.
 *
 * Drawn from @hanzo/ui components in the theme's tokens; the host mounts its
 * GuiProvider and imports no stylesheet. Framework-free: a Next export and a Vite
 * app draw it alike.
 */
export interface SignInPanelProps {
  /** The headline: `Sign in to Hanzo Team`. Omit to draw the panel alone under the host's own. */
  title?: ReactNode
  /** One line under the headline. */
  line?: ReactNode
  /** The providers offered, in order. Default Google, then GitHub. */
  providers?: ProviderKind[]
  /** The origin people sign in on. Default https://hanzo.ai. */
  signin?: string
  /** Offer "Create account". Default true. */
  signup?: boolean
  termsHref?: string
  privacyHref?: string
  /** Decorates an address the browser is about to leave for (the visitor rides along). */
  authorize?: (url: string) => string
  /** A press the stream should hear: `signin_started{method}`. */
  track?: (name: string, props?: Record<string, unknown>) => void
  /**
   * Mints this site's own authorize request (the IAM SDK's `getSigninUrl`, which
   * keeps the PKCE verifier and state on this site). For a site that holds its
   * own IAM client rather than mounting `<IamProvider>`; omit it under a provider
   * and the provider's client mints it.
   */
  request?: Mint
}

type Mint = (params?: { additionalParams?: Record<string, string> }) => Promise<string>

const NAME: Record<ProviderKind, string> = { google: 'Google', github: 'GitHub' }

export function SignInPanel(props: SignInPanelProps) {
  return props.request ? <Panel {...props} mint={props.request} /> : <UnderProvider {...props} />
}

/** The panel under `<IamProvider>`: its client mints the request. */
function UnderProvider(props: SignInPanelProps) {
  const { sdk } = useIam()
  return <Panel {...props} mint={(params) => sdk.getSigninUrl(params)} />
}

function Panel({
  title,
  line,
  providers = ['google', 'github'],
  signin = SIGNIN,
  signup = true,
  termsHref = 'https://hanzo.ai/terms',
  privacyHref = 'https://hanzo.ai/privacy',
  authorize = (u) => u,
  track,
  mint,
}: SignInPanelProps & { mint: Mint }) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)

  /** Mint this site's own request, then leave for where `way` goes. */
  async function leave(method: string, way: Way, hint?: string) {
    setWrong(null)
    setBusy(method)
    track?.('signin_started', { method })
    try {
      const request = await mint(hint ? { additionalParams: { login_hint: hint } } : undefined)
      window.location.assign(authorize(handoff(request, way, signin)))
    } catch (err) {
      setWrong(err instanceof Error && err.message ? err.message : 'Signing in could not start. Try again.')
      setBusy(null)
    }
  }

  function withEmail(e: FormEvent) {
    e.preventDefault()
    const typed = address(email)
    if (!typed) {
      setWrong('Enter your email address.')
      return
    }
    void leave('email', { kind: 'email', email: typed }, typed)
  }

  return (
    <YStack width="100%" maxW={400} items="center" gap="$4">
      {title ? (
        <Heading render="h1" size="$8" fontWeight="500" color="$ink" m={0} text="center">
          {title}
        </Heading>
      ) : null}
      {line ? (
        <Paragraph size="$3" color="$quiet" m={0} text="center" maxW={360}>
          {line}
        </Paragraph>
      ) : null}
      <YStack width="100%" gap="$2.5" mt={title || line ? '$2' : 0}>
        {providers.map((p) => (
          <Button key={p} type="button" variant="secondary" size="lg" rounded="$10" width="100%" disabled={busy !== null} onClick={() => void leave(p, { kind: 'provider', provider: p })}>
            {p === 'google' ? <SiGoogle size={16} /> : <SiGithub size={16} />}
            {t('Continue with {provider}', { provider: NAME[p] })}
          </Button>
        ))}
      </YStack>
      {providers.length ? (
        <YStack width="100%">
          <FieldSeparator>{t('or')}</FieldSeparator>
        </YStack>
      ) : null}
      <YStack render={<form onSubmit={withEmail} noValidate />} width="100%" gap="$3">
        <Field gap="$2">
          <Input
            id="hanzo-signin-email"
            type="email"
            name="email"
            autoComplete="username"
            aria-label={t('Email')}
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
          />
        </Field>
        {wrong ? <FieldError>{t(wrong)}</FieldError> : null}
        <Button type="submit" size="lg" rounded="$10" width="100%" bg="$ink" color="$background" borderColor="$ink" hoverStyle={{ opacity: 0.92 }} disabled={busy !== null}>
          {t('Continue with email')}
        </Button>
      </YStack>
      {signup ? (
        <Paragraph size="$2" color="$quiet" m={0}>
          {`${t('New to Hanzo?')} `}
          <Button type="button" variant="link" size="sm" px={0} height="auto" disabled={busy !== null} onClick={() => void leave('signup', { kind: 'signup' })}>
            {t('Create account')}
          </Button>
        </Paragraph>
      ) : null}
      <Paragraph size="$1" color="$quiet" m={0} text="center" maxW={400}>
        {t("By continuing, you agree to Hanzo's {terms} and {privacy}.", {
          terms: (
            <Anchor href={termsHref} color="$ink" textDecorationLine="underline">
              {t('Terms')}
            </Anchor>
          ),
          privacy: (
            <Anchor href={privacyHref} color="$ink" textDecorationLine="underline">
              {t('Privacy Policy')}
            </Anchor>
          ),
        })}
      </Paragraph>
    </YStack>
  )
}
