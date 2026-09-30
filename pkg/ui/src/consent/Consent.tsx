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
 *  - everywhere else (US, rest of Canada, Australia, Japan, ...): everything is
 *    on, and a small notice says so with Manage and "Do not sell or share my
 *    personal information"; `ConsentLink` in the footer opens the same choices.
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
import { acceptAll, asks, consentPolicy, gpc, notices, POLICY_EVENT, readConsent, rejectAll, saveConsent, type Choice } from '@hanzo/event'
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

export type ConsentProps = {
  /** Where the privacy policy lives. */
  privacy?: string
}

const Consent = ({ privacy = 'https://hanzo.ai/privacy' }: ConsentProps) => {
  const [shown, setShown] = useState(false)
  const [notice, setNotice] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false, ads: false })
  const locked = typeof window !== 'undefined' && gpc()

  useEffect(() => {
    const sync = () => {
      setShown(asks())
      setNotice(notices())
    }
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

  if (!shown && !notice) return null

  const done = (fn: () => void) => () => {
    fn()
    setShown(false)
    setNotice(false)
    setChoosing(false)
  }
  const choose = () => {
    setDraft(readConsent())
    setChoosing(true)
    setShown(true)
  }
  const link = consentPolicy()?.notice ?? 'Do not sell or share my personal information'
  const small = notice && !shown

  return (
    <YStack
      {...slot('consent')}
      role="dialog"
      aria-label="Cookie preferences"
      position="fixed"
      b={16}
      l={16}
      r={16}
      z={2147483000}
      maxW={560}
      gap="$3"
      p="$4"
      rounded="$5"
      borderWidth={1}
      borderColor="$borderColor"
      bg="$background"
      shadowColor="rgba(0,0,0,0.25)"
      shadowRadius={24}
      shadowOffset={{ width: 0, height: 8 }}
    >
      <Paragraph size="$3" color="$ink" m={0}>
        {choosing
          ? 'Choose what Hanzo may measure and share. You can change this at any time.'
          : small
            ? 'Hanzo uses cookies to count visits and to measure its ads. You can turn any of it off.'
            : 'Hanzo uses cookies to count visits and to measure its ads. Nothing from an advertiser loads until you accept.'}{' '}
        <a href={privacy} style={{ color: 'inherit', textDecoration: 'underline' }}>
          Privacy policy
        </a>
      </Paragraph>
      {choosing ? (
        <YStack gap="$3">
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
                  <Paragraph size="$3" color="$ink" fontWeight="500" m={0}>
                    {k.title}
                  </Paragraph>
                  <Paragraph size="$2" color="$soft" m={0}>
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
          <XStack gap="$3" justify="flex-end">
            <Button type="button" variant="secondary" onClick={done(rejectAll)}>
              Reject all
            </Button>
            <Button type="button" onClick={done(() => saveConsent(draft))}>
              Save choices
            </Button>
          </XStack>
        </YStack>
      ) : small ? (
        <XStack gap="$3" flexWrap="wrap" justify="flex-end">
          <Button
            type="button"
            variant="link"
            onClick={done(() => saveConsent({ ...readConsent(), marketing: false, ads: false }))}
          >
            {link}
          </Button>
          <Button type="button" variant="secondary" onClick={choose}>
            Manage
          </Button>
          <Button type="button" onClick={done(() => saveConsent(readConsent()))}>
            OK
          </Button>
        </XStack>
      ) : (
        <XStack gap="$3" flexWrap="wrap" justify="flex-end">
          <Button type="button" variant="link" onClick={choose}>
            Choose
          </Button>
          <Button type="button" variant="secondary" onClick={done(rejectAll)}>
            Reject all
          </Button>
          <Button type="button" onClick={done(acceptAll)}>
            Accept all
          </Button>
        </XStack>
      )}
    </YStack>
  )
}

/** The footer link that reopens the choices, in every footer and every region. */
const ConsentLink = ({ label = 'Cookie settings' }: { label?: string }) => (
  <Button {...slot('consent-link')} type="button" variant="link" size="sm" px={0} minH={0} onClick={openConsent}>
    {label}
  </Button>
)

export { Consent, ConsentLink }
