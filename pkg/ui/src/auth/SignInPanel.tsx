'use client'

import { useState, type FormEvent, type ReactNode } from 'react'
import { useI18n } from '@hanzo/i18n/react'
import { useIam } from '@hanzo/iam/react'
import { SiGithub, SiGoogle } from '@icons-pack/react-simple-icons'
import { Heading, Paragraph } from '../backends/gui/layout'
import { address, handoff, SIGNIN, type ProviderKind, type Way } from './handoff'
import { SignInCard, type SignInCardProps } from './look'

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
 * It is drawn as hanzo.app's own front-page sign-in (hanzo-inc/app
 * components/auth/steps.tsx `HERO_STYLE`), rule for rule, so the sites read as one
 * product's: the providers side by side, then one solid Continue with email that
 * opens the address field when pressed, and no sign-up line (hanzo.ai/login offers
 * one). The card and its rules are ./look.tsx's `SignInCard`, which hanzo.ai's
 * own sign-in (/login, /signup) is drawn on too, so the door and the page it
 * opens onto read alike: the host mounts its GuiProvider and imports no sheet.
 * Framework-free: a Next export and a Vite app draw it alike.
 *
 * It stands on its own card, a solid ground inside a hairline, since a front page
 * draws it over a busy backdrop (hanzo.team's dot field showed through the
 * buttons and the field). The card is the site's to colour (`background`,
 * `borderColor`: a theme token or any CSS colour), and `bare` drops it for a host
 * that sets the panel in a card of its own. Inside the card the controls keep
 * hanzo.app's 400px measure, so the card is 464px wide; under 380px of room the
 * providers stack.
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
  /** Offer "Create account" under the form. Default false: hanzo.app's sign-in has none, and hanzo.ai/login offers it. */
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
  /** The card's ground: a theme token (`$panel`) or any CSS colour. Default `$background`, solid. */
  background?: Paint
  /** The card's hairline: a theme token or any CSS colour. Default `$borderColor`. */
  borderColor?: Paint
  /** No card: the panel alone, for a host that sets it in a card of its own. */
  bare?: boolean
}

type Mint = (params?: { additionalParams?: Record<string, string> }) => Promise<string>

/** A colour the card takes, as the stack it is drawn on takes one. */
type Paint = SignInCardProps['background']

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
  signup = false,
  termsHref = 'https://hanzo.ai/terms',
  privacyHref = 'https://hanzo.ai/privacy',
  authorize = (u) => u,
  track,
  mint,
  background = '$background',
  borderColor = '$borderColor',
  bare = false,
}: SignInPanelProps & { mint: Mint }) {
  const { t } = useI18n()
  const [email, setEmail] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
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

  const emailLabel = t(busy === 'email' ? 'One moment…' : 'Continue with email')
  return (
    <SignInCard background={background} borderColor={borderColor} bare={bare}>
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
      <div data-signin-body="" style={title || line ? { marginTop: 12 } : undefined}>
        {providers.length ? (
          <>
            <div data-signin-pair="">
              {providers.map((p) => (
                <button key={p} data-signin-btn="" type="button" disabled={busy !== null} onClick={() => void leave(p, { kind: 'provider', provider: p })}>
                  {p === 'google' ? <SiGoogle size={17} aria-hidden /> : <SiGithub size={17} aria-hidden />}
                  {t('Continue with {provider}', { provider: NAME[p] })}
                </button>
              ))}
            </div>
            <div data-signin-or="">{t('or')}</div>
          </>
        ) : null}
        {emailOpen ? (
          <form data-signin-form="" onSubmit={withEmail} noValidate>
            <input
              id="hanzo-signin-email"
              data-signin-field=""
              type="email"
              name="email"
              autoComplete="username"
              aria-label={t('Email')}
              aria-invalid={wrong ? true : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoFocus
            />
            {wrong ? (
              <p data-signin-wrong="" role="alert">
                {t(wrong)}
              </p>
            ) : null}
            <button data-signin-btn="" data-solid="" type="submit" disabled={busy !== null}>
              {emailLabel}
            </button>
          </form>
        ) : (
          <>
            {wrong ? (
              <p data-signin-wrong="" role="alert">
                {t(wrong)}
              </p>
            ) : null}
            <button
              data-signin-btn=""
              data-solid=""
              type="button"
              disabled={busy !== null}
              onClick={() => {
                setWrong(null)
                setEmailOpen(true)
              }}
            >
              {emailLabel}
            </button>
          </>
        )}
      </div>
      {signup ? (
        <p data-signin-quiet="">
          {`${t('New to Hanzo?')} `}
          <button type="button" disabled={busy !== null} onClick={() => void leave('signup', { kind: 'signup' })}>
            {t('Create account')}
          </button>
        </p>
      ) : null}
      <p data-signin-terms="">
        {t("By continuing, you agree to Hanzo's {terms} and {privacy}.", {
          terms: <a href={termsHref}>{t('Terms')}</a>,
          privacy: <a href={privacyHref}>{t('Privacy Policy')}</a>,
        })}
      </p>
    </SignInCard>
  )
}
