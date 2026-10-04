'use client'

/**
 * Consent — the one cookie banner every Hanzo, Lux and Zoo site mounts.
 *
 * It draws the choice; @hanzo/event stores it (`hz_consent`) and the tag
 * manager reacts: nothing from an ad platform loads before Accept, and Google
 * Consent Mode v2 starts denied.
 *
 *  - opt-in regions (EU/EEA, UK, CH, Quebec, Brazil, China, and anywhere cloud
 *    cannot place the visitor): a banner with Accept all, Reject all and Choose,
 *    until the visitor has chosen. Nothing from an advertiser loads first.
 *  - everywhere else (US, rest of Canada, Australia, Japan, ...): nothing is
 *    drawn. The region's defaults apply, and `ConsentLink` in the footer opens
 *    the same choices, "Do not sell or share my personal information" among
 *    them. A notice there is no law asking for is a popup.
 *  - cloud resolves the region from where the request came from and serves it
 *    with the site's tag config. The banner redraws when the answer arrives, and
 *    asks again when the policy version changes.
 *  - Global Privacy Control: marketing and ads are off and their switches are
 *    locked, in every zone.
 *
 * `Consent` mounts once near the root; `ConsentLink` goes wherever a footer
 * link goes and opens the panel from anywhere.
 */
import { Paragraph, XStack, YStack } from '@hanzo/gui'
import { acceptAll, asks, gpc, POLICY_EVENT, readConsent, rejectAll, saveConsent, type Choice } from '@hanzo/event'
import { useEffect, useState } from 'react'

import { Button } from '../backends/gui/button'
import { Switch } from '../backends/gui/switch'
import { slot } from '../backends/gui/slot'

const OPEN = 'hzconsent-open'

/** Opens the choices from anywhere. */
export const openConsent = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN))
}

const KINDS = [
  { key: 'analytics', title: 'Analytics', body: 'Counts visits and finds what is broken, so Hanzo can get better.' },
  { key: 'marketing', title: 'Marketing', body: 'Lets ad platforms measure the sign-ups and orders their ads led to.' },
  { key: 'ads', title: 'Personalized ads', body: 'Lets those platforms use your visit to show you ads elsewhere.' },
] as const

/** Where the banner sits: fixed to the foot of the window, inset 12px, centred. */
const frame = {
  ...slot('consent'),
  role: 'dialog',
  'aria-label': 'Cookie preferences',
  position: 'fixed',
  b: 12,
  l: 12,
  r: 12,
  mx: 'auto',
  z: 2147483000,
  py: '$2.5',
  px: '$3.5',
  rounded: '$5',
  borderWidth: 1,
  borderColor: '$borderColor',
  bg: '$background',
  shadowColor: 'rgba(0,0,0,0.25)',
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
} as const

/** The bar is as wide as its line and buttons, up to the window less its inset. */
const FIT = { width: 'fit-content' } as const

/** A link in the banner's line: the line's own ink, underlined, never broken across lines. */
const INLINE = { color: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' } as const

export type ConsentProps = {
  /** Where the privacy policy lives. */
  privacy?: string
}

const Consent = ({ privacy = 'https://hanzo.ai/privacy' }: ConsentProps) => {
  const [shown, setShown] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false, ads: false })
  const locked = typeof window !== 'undefined' && gpc()

  useEffect(() => {
    const sync = () => setShown(asks())
    sync()
    const open = () => {
      setDraft(readConsent())
      setChoosing(true)
      setShown(true)
    }
    window.addEventListener(OPEN, open)
    window.addEventListener(POLICY_EVENT, sync)
    return () => {
      window.removeEventListener(OPEN, open)
      window.removeEventListener(POLICY_EVENT, sync)
    }
  }, [])

  if (!shown) return null

  const done = (fn: () => void) => () => {
    fn()
    setShown(false)
    setChoosing(false)
  }
  const choose = () => {
    setDraft(readConsent())
    setChoosing(true)
    setShown(true)
  }

  if (choosing)
    return (
      <YStack {...frame} maxW={440} gap="$3">
        <Paragraph size="$2" color="$ink" m={0}>
          {'Choose what Hanzo may measure and share. You can change this at any time. '}
          <a href={privacy} style={INLINE}>
            Privacy policy
          </a>
        </Paragraph>
        {locked ? (
          <Paragraph size="$2" color="$soft" m={0}>
            Your browser sends Global Privacy Control, so marketing and personalized ads stay off.
          </Paragraph>
        ) : null}
        {KINDS.map((k) => {
          const off = locked && k.key !== 'analytics'
          return (
            <XStack key={k.key} gap="$3" items="center" justify="space-between">
              <YStack flex={1}>
                <Paragraph size="$2" color="$ink" fontWeight="500" m={0}>
                  {k.title}
                </Paragraph>
                <Paragraph size="$1" color="$soft" m={0}>
                  {k.body}
                </Paragraph>
              </YStack>
              <Switch
                aria-label={k.title}
                disabled={off}
                checked={off ? false : draft[k.key]}
                onCheckedChange={(v: boolean) => setDraft({ ...draft, [k.key]: v === true })}
              />
            </XStack>
          )
        })}
        <XStack gap="$2" justify="flex-end">
          <Button type="button" size="sm" variant="secondary" onClick={done(rejectAll)}>
            Reject all
          </Button>
          <Button type="button" size="sm" onClick={done(() => saveConsent(draft))}>
            Save choices
          </Button>
        </XStack>
      </YStack>
    )

  // One bar: the line and its link, then the buttons. They share a row where
  // the line fits beside them and the buttons drop under it where it does not,
  // so a phone shows the line over one row of buttons and nothing breaks mid-control.
  return (
    <XStack {...frame} style={FIT} maxW={960} flexWrap="wrap" items="center" columnGap="$4" rowGap="$2">
      <YStack shrink={1} minW={0}>
        <Paragraph size="$2" color="$ink" m={0}>
          {'Cookies measure visits and ads once you accept. '}
          <a href={privacy} style={INLINE}>
            Privacy policy
          </a>
        </Paragraph>
      </YStack>
      <XStack gap="$2" ml="auto" items="center">
        <Button type="button" size="sm" variant="link" onClick={choose}>
          Choose
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={done(rejectAll)}>
          Reject all
        </Button>
        <Button type="button" size="sm" onClick={done(acceptAll)}>
          Accept all
        </Button>
      </XStack>
    </XStack>
  )
}

/** The footer link that reopens the choices, in every footer and every region. */
const ConsentLink = ({ label = 'Cookie settings' }: { label?: string }) => (
  <Button {...slot('consent-link')} type="button" variant="link" size="sm" px={0} minH={0} onClick={openConsent}>
    {label}
  </Button>
)

export { Consent, ConsentLink }
