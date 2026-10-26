'use client'

/**
 * Consent — the one cookie banner every Hanzo, Lux and Zoo site mounts.
 *
 * It draws the choice; @hanzo/event stores it (`hz_consent`) and acts on it:
 * nothing from an ad platform, no Google, and no event on our own stream before
 * Accept, and Google Consent Mode v2 starts denied.
 *
 *  - every visitor, wherever they are, is asked: a bar with Manage preferences,
 *    Accept all and a ×, until they have chosen. Nothing optional loads first.
 *  - the bar's × is a choice, not a dismissal: it stores essential cookies only
 *    and closes, so refusing is one press, exactly as accepting is.
 *  - Manage preferences opens the Cookie Preferences sheet: a modal with one
 *    section per category, Strictly Necessary always on, the rest switches that
 *    start off until chosen, and the policy links.
 *  - Global Privacy Control or Do Not Track is the visitor's answer already: they
 *    are not asked, nothing optional runs, and the switches are locked off.
 *  - cloud serves the policy with the site's tag config; the bar redraws when it
 *    arrives, and asks again when the policy version changes.
 *
 * `Consent` mounts once near the root. `openConsent()`, `ConsentLink` and any
 * link to `#choices` (the footer's Privacy choices) open the sheet from anywhere.
 * `brand` names who is asking; `cookies`, `privacy` and `terms` are the brand's
 * own policies.
 */
import { Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, X } from '@hanzogui/lucide-icons-2'
import { acceptAll, asks, declined, POLICY_EVENT, readConsent, rejectAll, saveConsent, storedConsent, type Choice } from '@hanzo/event'
import { useEffect, useId, useRef, useState } from 'react'

import { Button } from '../backends/gui/button'
import { align } from '../backends/gui/dir'
import { Switch } from '../backends/gui/switch'
import { slot } from '../backends/gui/slot'

const OPEN = 'hzconsent-open'

/** The address that opens the sheet, from any link on any page. */
const HASH = '#choices'

/** Opens the choices from anywhere. */
export const openConsent = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN))
}

type Kind = { id: string; key?: keyof Choice; title: string; body: string }

const kinds = (brand: string): Kind[] => [
  {
    id: 'necessary',
    title: 'Strictly Necessary Cookies',
    body: 'These cookies are needed for the site to work, so they are always on. They keep you signed in and your session secure, protect forms against cross-site request forgery, spread traffic across servers, remember the choice you make here, and keep what you have typed into a form. They are not used to track you, and they store no personally identifiable tracking information.',
  },
  {
    id: 'analytics',
    key: 'analytics',
    title: 'Performance Cookies',
    body: `These cookies count visits and where they come from, so ${brand} can measure and improve how the site performs: which pages are used most and least, how visitors move around, and what is broken. What they collect is aggregated.`,
  },
  {
    id: 'marketing',
    key: 'marketing',
    title: 'Marketing Cookies',
    body: `These cookies let advertising platforms measure the sign-ups and orders their ads led to, so ${brand} can tell which ads work. The platforms set them through this site, and they remember the ad you arrived from.`,
  },
  {
    id: 'ads',
    key: 'ads',
    title: 'Sell, Share, or Use Your Data for Targeted Advertising',
    body: 'Some US state privacy laws treat letting advertising platforms use what they learn from your visit to show you ads on other sites and apps as a “sale” or “sharing” of your personal information, or as “targeted advertising”, and give you the right to opt out. On, those platforms may use your visit to choose the ads you see elsewhere. It stays off unless you turn it on; to opt out, move this toggle to the left and select Save preferences.',
  },
]

/** The bar's and the sheet's inset from the window's edges: 16px, or the device's inset and 8px where that is wider. */
const EDGE = {
  top: 'max(16px, calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 8px))',
  bottom: 'max(16px, calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 8px))',
  left: 'max(16px, calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 8px))',
  right: 'max(16px, calc(var(--safe-right, env(safe-area-inset-right, 0px)) + 8px))',
} as const

/** The panel both wear: the card's ground, edge, corner (`$6`, the sign-in card's) and floating shadow. */
const PANEL = {
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  shadowColor: 'rgba(0,0,0,0.25)',
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 8 },
} as const

/**
 * Where the bar sits: fixed to the foot of the window, clear of the home
 * indicator and the notch, centred. It stands on design's banner rung
 * (`--z-banner`): over the page and its dock, under every overlay — a dialog, a
 * menu, a phone drawer — and is answered once they close.
 */
const frame = {
  ...slot('consent'),
  ...PANEL,
  role: 'dialog',
  'aria-label': 'Cookie preferences',
  position: 'fixed',
  b: EDGE.bottom,
  l: EDGE.left,
  r: EDGE.right,
  mx: 'auto',
  z: 'var(--z-banner, 50)',
  py: '$3',
  paddingInlineStart: '$4',
  // Clear of the × in the corner: its 32px, and 12px either side.
  paddingInlineEnd: 56,
} as const

/** The bar is as wide as its line and buttons, up to the window less its inset. */
const FIT = { width: 'fit-content' } as const

/** The one filled control in the bar and in the sheet: the ink, as the sign-in card's Continue. */
const ACT = { bg: '$ink', color: '$background', borderColor: '$ink', hoverStyle: { opacity: 0.92 } } as const

/** A link in the sheet's intro: the line's own ink, underlined, never broken across lines. */
const INLINE = { color: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' } as const

/** The sheet covers the window, on design's modal rung, over a scrim of its own. */
const COVER = { position: 'fixed', t: 0, r: 0, b: 0, l: 0 } as const

/** What Tab may land on inside the sheet. */
const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** A section's button never submits a form the sheet sits in. gui's stack props do not name `type`. */
const BUTTON = { type: 'button' } as object

export type ConsentProps = {
  /** Where the cookie policy lives. */
  cookies?: string
  /** Where the privacy policy lives. */
  privacy?: string
  /** Where the terms of service live. */
  terms?: string
  /** Who is asking: the brand the visitor is on. */
  brand?: string
}

const Consent = ({
  cookies = 'https://hanzo.ai/cookies',
  privacy = 'https://hanzo.ai/privacy',
  terms = 'https://hanzo.ai/terms',
  brand = 'Hanzo',
}: ConsentProps) => {
  const [shown, setShown] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false, ads: false })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // The choices are open because the visitor asked for them. A policy that
  // arrives after (cloud answers ~150ms into a page opened at #choices) redraws
  // the bar's question, and must not close what was asked for.
  const asked = useRef(false)
  // What had focus when the sheet opened, given it back when the sheet closes.
  const back = useRef<HTMLElement | null>(null)
  const sheet = useRef<HTMLElement | null>(null)
  const manage = useRef<HTMLElement | null>(null)
  const opened = useRef(false)
  // The switches were filled from a stored choice, not left off.
  const seeded = useRef(false)
  const id = useId()
  // The browser refused, as the page sees it or as cloud saw the request. State,
  // so cloud's answer redraws an open sheet.
  const [locked, setLocked] = useState(false)

  const choose = () => {
    // Already open: the visitor's unsaved switches and the focus to return stay as they are.
    if (asked.current) return
    const at = document.activeElement
    back.current = at instanceof HTMLElement && at !== document.body ? at : null
    asked.current = true
    setLocked(declined())
    seeded.current = storedConsent()
    setDraft(readConsent())
    setChoosing(true)
    setShown(true)
  }

  // Closing without a choice: a visitor who has not chosen is asked again by the bar.
  const close = () => {
    asked.current = false
    setChoosing(false)
    setShown(asks())
  }

  useEffect(() => {
    const sync = () => {
      setShown(asks() || asked.current)
      setLocked(declined())
      // A policy version the stored choice was not made under: the switches the
      // sheet opened with were an old grant, and are off until chosen again.
      if (asked.current && seeded.current && !storedConsent()) {
        seeded.current = false
        setDraft(readConsent())
      }
    }
    sync()
    // `#choices` opens the sheet: on arrival, on a hash change, and on a press of
    // any link on this site to it, so the footer's Privacy choices and a link in
    // a page are the same control.
    const hash = () => {
      if (window.location.hash !== HASH) return
      // The router's own entry state is kept: only the address loses its hash. A
      // microtask, so a router that wraps replaceState in its own mount effect
      // (Next's, which runs after this child's) records the address without it.
      queueMicrotask(() => history.replaceState(history.state, '', window.location.pathname + window.location.search))
      choose()
    }
    // A plain press only: a modified one (new tab, new window) keeps the browser's
    // meaning, and the page it opens at #choices opens the sheet on arrival.
    const press = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      // The attribute, not `.href`: an SVG link's `.href` is not a string.
      const a = (e.target as Element | null)?.closest?.('a[href]')
      const href = a?.getAttribute('href')
      const target = a?.getAttribute('target')
      if (!href || a?.hasAttribute('download') || (target && target !== '_self')) return
      let to: URL
      try {
        to = new URL(href, document.baseURI)
      } catch {
        return
      }
      if (to.hash !== HASH || to.origin !== window.location.origin) return
      e.preventDefault()
      choose()
    }
    hash()
    window.addEventListener(OPEN, choose)
    window.addEventListener(POLICY_EVENT, sync)
    window.addEventListener('hashchange', hash)
    document.addEventListener('click', press, { capture: true })
    return () => {
      window.removeEventListener(OPEN, choose)
      window.removeEventListener(POLICY_EVENT, sync)
      window.removeEventListener('hashchange', hash)
      document.removeEventListener('click', press, { capture: true })
    }
  }, [])

  // Focus moves into the sheet when it opens, stays inside it while it is open,
  // and returns to what opened it (or the bar's Manage preferences) when it closes.
  useEffect(() => {
    if (!choosing) {
      if (!opened.current) return
      opened.current = false
      const el = back.current
      back.current = null
      if (el?.isConnected) el.focus()
      else manage.current?.focus()
      return
    }
    opened.current = true
    const all = () => [...(sheet.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    all()[0]?.focus()
    const keys = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      if (e.key !== 'Tab') return
      const list = all()
      const first = list[0]
      const last = list[list.length - 1]
      if (!first || !last) return
      const at = document.activeElement
      const inside = !!at && !!sheet.current?.contains(at)
      if (e.shiftKey && (at === first || !inside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (at === last || !inside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keys)
    return () => document.removeEventListener('keydown', keys)
  }, [choosing])

  if (!shown) return null

  const done = (fn: () => void) => () => {
    fn()
    asked.current = false
    setShown(false)
    setChoosing(false)
  }

  if (choosing)
    return (
      <YStack
        {...slot('consent-sheet')}
        {...COVER}
        z="var(--z-modal, 600)"
        items="center"
        justify="center"
        // The device's insets are physical sides, so the shorthand names them in order.
        style={{ padding: `${EDGE.top} ${EDGE.right} ${EDGE.bottom} ${EDGE.left}` }}
      >
        <YStack {...COVER} position="absolute" z={0} bg="rgba(0,0,0,0.6)" aria-hidden onPress={close} />
        <YStack
          {...slot('consent')}
          {...PANEL}
          ref={sheet as never}
          role="dialog"
          aria-modal
          aria-labelledby={`${id}-title`}
          position="relative"
          width="100%"
          maxW={560}
          maxH="100%"
          overflow="hidden"
        >
          <XStack items="center" justify="space-between" gap="$3" pt="$5" pb="$3" paddingInlineStart="$5" paddingInlineEnd="$4">
            <Text render="h2" id={`${id}-title`} m={0} fontSize="$6" lineHeight="$6" fontWeight="600" color="$ink">
              Cookie Preferences
            </Text>
            <Button type="button" size="icon-sm" variant="ghost" aria-label="Close" onClick={close}>
              <X size={16} />
            </Button>
          </XStack>
          <YStack shrink={1} minH={0} overflowY="auto" px="$5" pb="$2" style={{ overscrollBehavior: 'contain' }}>
            <Paragraph size="$2" color="$aside" m={0} pb="$3">
              {'We use cookies and similar technologies to provide our services, measure performance, and support advertising. Essential cookies are required for the site to work and cannot be turned off. You can allow or reject optional cookies below. Learn more in our '}
              <a href={cookies} style={INLINE}>
                Cookie Policy
              </a>
              {', '}
              <a href={privacy} style={INLINE}>
                Privacy Policy
              </a>
              {', and '}
              <a href={terms} style={INLINE}>
                Terms of Service
              </a>
              .
            </Paragraph>
            {locked ? (
              <Paragraph size="$2" color="$ink" m={0} pb="$3">
                Your browser asks sites not to track you, so all of these stay off.
              </Paragraph>
            ) : null}
            {kinds(brand).map((k) => {
              const open = expanded[k.id] === true
              const body = `${id}-${k.id}`
              return (
                <YStack key={k.id} {...slot('consent-section')} borderTopWidth={1} borderColor="$borderColor">
                  <XStack items="center" gap="$3" minH={52} py="$2">
                    <XStack render="h3" flex={1} minW={0} m={0}>
                      <XStack
                        render="button"
                        {...BUTTON}
                        aria-expanded={open}
                        aria-controls={body}
                        onPress={() => setExpanded({ ...expanded, [k.id]: !open })}
                        flex={1}
                        minW={0}
                        items="center"
                        gap="$2"
                        p={0}
                        bg="transparent"
                        borderWidth={0}
                        cursor="pointer"
                      >
                        <XStack shrink={0} rotate={open ? '180deg' : '0deg'} opacity={0.7}>
                          <ChevronDown size={16} />
                        </XStack>
                        <Text fontSize="$3" lineHeight="$3" fontWeight="600" color="$ink" {...align('start')}>
                          {k.title}
                        </Text>
                      </XStack>
                    </XStack>
                    {k.key ? (
                      <Switch
                        aria-label={k.title}
                        aria-describedby={body}
                        disabled={locked}
                        checked={locked ? false : draft[k.key]}
                        onCheckedChange={(v: boolean) => setDraft({ ...draft, [k.key as keyof Choice]: v === true })}
                      />
                    ) : (
                      <Text fontSize="$2" fontWeight="600" color="$ink" whiteSpace="nowrap">
                        Always Active
                      </Text>
                    )}
                  </XStack>
                  <YStack id={body} display={open ? 'flex' : 'none'} pb="$3" paddingInlineStart={24}>
                    <Paragraph size="$2" color="$aside" m={0}>
                      {k.body}
                    </Paragraph>
                  </YStack>
                </YStack>
              )
            })}
          </YStack>
          <XStack flexWrap="wrap" gap="$2" px="$5" py="$4" borderTopWidth={1} borderColor="$borderColor">
            {/* A browser that refused cannot accept here: there is nothing to accept. */}
            {locked ? null : (
              <Button type="button" variant="secondary" grow={1} onClick={done(acceptAll)}>
                Accept all
              </Button>
            )}
            <Button type="button" {...ACT} grow={1} onClick={done(() => saveConsent(draft))}>
              Save preferences
            </Button>
          </XStack>
        </YStack>
      </YStack>
    )

  // One bar: the line, then the buttons. They share a row where the line fits
  // beside them and the buttons drop under it where it does not, so a phone shows
  // the line over one row of buttons and nothing breaks mid-control.
  return (
    <XStack {...frame} style={FIT} maxW={1200} flexWrap="wrap" items="center" columnGap="$4" rowGap="$3">
      <YStack shrink={1} minW={0}>
        <Paragraph size="$2" color="$ink" m={0}>
          {`Essential cookies keep ${brand} running. With your OK, optional cookies help us measure performance and ads.`}
        </Paragraph>
      </YStack>
      <XStack gap="$2" marginInlineStart="auto" items="center" flexWrap="wrap">
        <Button ref={manage as never} type="button" size="sm" variant="secondary" onClick={choose}>
          Manage preferences
        </Button>
        <Button type="button" size="sm" {...ACT} onClick={done(acceptAll)}>
          Accept all
        </Button>
      </XStack>
      {/* Essential cookies only: the refusal, as easy to give as Accept all. */}
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        aria-label="Close and use essential cookies only"
        position="absolute"
        t="$3"
        insetInlineEnd="$3"
        onClick={done(rejectAll)}
      >
        <X size={16} />
      </Button>
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
