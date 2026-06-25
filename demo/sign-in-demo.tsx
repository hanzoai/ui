'use client'

/**
 * The composable sign-in surface, end to end.
 *
 * This file is the CONFIGURATION layer — zero auth code. It picks a method set
 * (`brand.providers`) and hands it to `<SignIn>`. The PRESENTATION layer
 * (`@hanzo/ui` `<SignIn>` / `<SocialButton>` / `<PasswordForm>`) renders it,
 * brand-themed by CSS tokens. The MECHANISM layer (`@hanzo/iam`) runs the one
 * Authorization-Code + PKCE flow — `provider` is the only knob.
 *
 * Adoption: every app collapses its hand-rolled `iam-auth.ts` + bespoke login
 * page to exactly this — `import { SignIn } from '@hanzo/ui/auth'` +
 * `import { configureIam, startLogin, getIam } from '@hanzo/iam'`.
 */

import * as React from 'react'
import { SignIn } from '../src/auth'

// ── App brand config (the ONLY app-level knob) ──────────────────────────────
//
// Social/web3 are LIVE: one shared org-level OAuth provider per network in IAM
// (admin/provider-google, admin/provider-github), reused by every app via a
// `canSignIn` toggle. Apps NEVER register per-app Google/GitHub clients — the
// button just delegates with `provider`.
const brand = {
  serverUrl: 'https://hanzo.id',
  clientId: 'hanzo-app',
  providers: ['password', 'google', 'github', 'web3'] as const,
}

export function SignInDemo() {
  // The mechanism comes from `@hanzo/iam`. Configure once; pass the SDK's
  // `startLogin` (provider knob) and `loginWithPassword` (embedded credential)
  // into the presentation. Lazy-imported so this demo file stays render-only.
  const [iam, setIam] = React.useState<null | {
    startLogin: (o: { provider?: string }) => Promise<void>
    loginWithPassword: (email: string, password: string) => Promise<string>
  }>(null)

  React.useEffect(() => {
    let alive = true
    void import('@hanzo/iam').then((sdk) => {
      sdk.configureIam({ issuer: brand.serverUrl, clientId: brand.clientId })
      const engine = sdk.getIam()
      if (alive) {
        setIam({
          startLogin: (o) => sdk.startLogin(o),
          loginWithPassword: (email, password) => engine.loginWithPassword(email, password),
        })
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="mx-auto flex min-h-[480px] w-full max-w-sm items-center justify-center">
      <SignIn
        title="Sign in"
        providers={[...brand.providers]}
        config={{ serverUrl: brand.serverUrl, clientId: brand.clientId }}
        // Social/web3: delegate to the SDK's startLogin (adds &provider=…).
        onLogin={iam ? (opts) => iam.startLogin({ provider: opts.provider }) : undefined}
        // Password: the SDK's embedded credential login → PKCE-bound code.
        onPasswordSubmit={
          iam
            ? async ({ email, password }) => {
                const callbackUrl = await iam.loginWithPassword(email, password)
                window.location.href = callbackUrl
              }
            : undefined
        }
      />
    </div>
  )
}
