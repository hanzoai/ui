'use client'

/**
 * Consent — the one cookie banner every Hanzo, Lux and Zoo site mounts.
 *
 * It draws the choice; @hanzo/event stores it (`hz_consent`) and acts on it. The
 * brand's own first-party analytics is strictly necessary and runs for every
 * visitor. What the third parties (Google Analytics, the Meta pixel, their ad
 * personalization) may do is regional: cloud places the visitor by GeoIP and
 * serves a `mode` with the site's tag config (`consentPolicy()`).
 *
 *  - `eu`: opt-in. A bar with Manage preferences, Accept all and a ×, until the
 *    visitor has chosen; what a third party may do meanwhile is @hanzo/event's
 *    rule (consent.ts, tags.ts). The × is a choice, not a dismissal: essential
 *    cookies only, so refusing is one press, exactly as accepting is.
 *  - `us_privacy`: opt-out. No bar; Google Analytics and Meta run by default, and
 *    "Your Privacy Choices" opens the sheet, where turning a switch off saves at
 *    once. The advertising switch is the sale and sharing opt-out.
 *  - `global`: a notice. One line and a × that records it as seen; the same
 *    opt-out sheet stays one press away.
 *  - Global Privacy Control or Do Not Track is an answer already, under every
 *    rule: every switch is held off and the visitor is not asked.
 *  - Until cloud answers, nothing is drawn: the answer this tab was last served
 *    (@hanzo/event keeps it) is used at once, and with none by 1.5s the strict
 *    `eu` rule applies.
 *
 * `Consent` mounts once near the root. `openConsent()`, `ConsentLink` and any
 * link to `#choices` (the footer's Your Privacy Choices) open the sheet from
 * anywhere. A page with no such link in it gets a small one, fixed to the foot of
 * the window, so the choices are always one press away. `brand` names who is
 * asking; `cookies`, `privacy` and `terms` are the brand's own policies.
 */
import { Paragraph, Text, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, X } from '@hanzogui/lucide-icons-2'
import {
  acceptAll,
  asks,
  consentPolicy,
  consentSheet,
  declined,
  notice,
  noticed,
  POLICY_EVENT,
  readConsent,
  rejectAll,
  saveConsent,
  storedConsent,
  type Choice,
  type Mode,
} from '@hanzo/event'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { Button } from '../backends/gui/button'
import { align } from '../backends/gui/dir'
import { Switch } from '../backends/gui/switch'
import { slot } from '../backends/gui/slot'
import { PrivacyChoicesIcon } from './icon'

const OPEN = 'hzconsent-open'

/** The address that opens the sheet, from any link on any page. */
const HASH = '#choices'

/** Opens the choices from anywhere. */
export const openConsent = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(OPEN))
}

/** How long a page waits for cloud's rule before the strict one applies. */
const WAIT = 1500

/**
 * The rule, once one has been served: on this page, or to this tab before (then
 * it carries the region cloud placed the visitor in). `consentPolicy()` answers
 * `eu` before either, which is the rule to wait out rather than draw.
 */
const served = (): Mode | undefined => {
  const p = consentPolicy()
  return p.region ? p.mode : undefined
}

/*
 * The links a page draws to the sheet, counted on the page (not in module scope,
 * since a bundle may carry two copies of this module), so the component draws its
 * own only where the page has none.
 */
const LINKS = Symbol.for('hanzo.ui.consent.links')
const LINKS_EVENT = 'hzconsent-links'

function hold(): () => void {
  const g = globalThis as unknown as Record<symbol, number | undefined>
  g[LINKS] = (g[LINKS] ?? 0) + 1
  window.dispatchEvent(new Event(LINKS_EVENT))
  return () => {
    g[LINKS] = Math.max(0, (g[LINKS] ?? 1) - 1)
    window.dispatchEvent(new Event(LINKS_EVENT))
  }
}

/** Whether the page draws a way to the sheet: a ConsentLink, or a link on this site to #choices (a footer's). */
function linked(): boolean {
  const g = globalThis as unknown as Record<symbol, number | undefined>
  if ((g[LINKS] ?? 0) > 0) return true
  for (const a of document.querySelectorAll(`a[href*="${HASH}"]`)) {
    try {
      const to = new URL(a.getAttribute('href') ?? '', document.baseURI)
      if (to.hash === HASH && to.origin === window.location.origin) return true
    } catch {
      /* an address that does not parse leads nowhere */
    }
  }
  return false
}

type Kind = { id: string; key?: keyof Choice; title: string; body: string }

const kinds = (brand: string, strict: boolean, locked: boolean): Kind[] => [
  {
    id: 'necessary',
    title: 'Strictly Necessary Cookies',
    body: `These are needed for the site to work, so they are always on. They keep you signed in and your session secure, protect forms against cross-site request forgery, spread traffic across servers, remember the choice you make here, and keep what you have typed into a form. They include ${brand}'s own first-party analytics, which counts visits and finds what is broken for ${brand} alone and is never sold or shared.`,
  },
  {
    id: 'analytics',
    key: 'analytics',
    title: 'Performance Cookies',
    body: `Google Analytics: lets Google measure visits to ${brand} with its own cookies.`,
  },
  {
    id: 'marketing',
    key: 'marketing',
    title: 'Marketing Cookies',
    body: `The Meta pixel: lets Meta measure the sign-ups and orders ${brand}'s ads led to.`,
  },
  {
    id: 'ads',
    key: 'ads',
    title: 'Sell, Share, or Use Your Data for Targeted Advertising',
    body: `Lets Google and Meta use your visits to choose the ads they show you on other sites and apps. Some US state privacy laws call this a “sale” or “sharing” of your personal information, or “targeted advertising”, and give you the right to opt out: ${
      locked ? 'your browser’s signal keeps it off.' : strict ? 'it stays off unless you turn it on.' : 'turn this off to opt out.'
    }`,
  },
]

/** The sheet's opening line, by rule: what runs before the visitor does anything, and how to change it. */
const intro = (strict: boolean, locked: boolean) =>
  locked
    ? 'We use cookies and similar technologies to provide our services. Essential cookies are required for the site to work and cannot be turned off. Learn more in our '
    : strict
    ? 'We use cookies and similar technologies to provide our services, measure performance, and support advertising. Essential cookies are required for the site to work and cannot be turned off. You can allow or reject optional cookies below. Learn more in our '
    : 'We use cookies and similar technologies to provide our services, measure performance, and support advertising. Google Analytics and the Meta pixel run on this site by default. Turn either off below, or turn off the last switch to opt out of the sale or sharing of your personal information for targeted advertising; each switch is saved as soon as you change it. Essential cookies are required for the site to work and cannot be turned off. Learn more in our '

/** What a browser that sends Global Privacy Control or Do Not Track holds off, under every rule. */
const REFUSAL = 'Your browser asks sites not to track you, so all of these stay off.'

/** The bar's and the sheet's inset from the window's edges: 16px, or the device's inset and 8px where that is wider. */
const EDGE = {
  top: 'max(16px, calc(var(--safe-top, env(safe-area-inset-top, 0px)) + 8px))',
  bottom: 'max(16px, calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 8px))',
  left: 'max(16px, calc(var(--safe-left, env(safe-area-inset-left, 0px)) + 8px))',
  right: 'max(16px, calc(var(--safe-right, env(safe-area-inset-right, 0px)) + 8px))',
} as const

/**
 * Corners from design's ladder (radius.css), one step apart so the buttons sit
 * concentric in their card: a button on `--radius-lg` (12px), the bar and the
 * sheet on `--radius-xl` (16px). Both follow `--radius-scale`; neither is a pill.
 */
const ROUND = { button: 'var(--radius-lg, 12px)', card: 'var(--radius-xl, 16px)' } as const

/** The panel both wear: the card's ground, edge, corner and floating shadow. */
const PANEL = {
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: ROUND.card,
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
  position: 'fixed',
  b: EDGE.bottom,
  l: EDGE.left,
  r: EDGE.right,
  mx: 'auto',
  z: 'var(--z-banner, 50)',
  py: '$3',
  paddingInlineStart: '$4',
  // Clear of the × in the corner: its 36px, 12px outside it and 8px before it.
  paddingInlineEnd: 56,
} as const

/** The bar is as wide as its line and buttons, up to the window less its inset. */
const FIT = { width: 'fit-content' } as const

/** The keyboard's mark on any control here: design's focus ring, outside the control. */
const RING = { outlineColor: 'var(--ring)', outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2 } as const

/**
 * A button's every state from design's button tokens (colors.css), so it follows
 * the theme and an org's accent: at rest the fill, under the pointer and pressed
 * its `-hover` step, focused by keyboard the ring. Each state names its fill and
 * a clear edge outright, because a state that leaves one out takes the Button's
 * own (the frame's hover is a near-black fill and a grey edge, which put dark
 * text on dark under the cursor). 13px type on the 36px floor.
 */
const button = (fill: string, hover: string, ink: string) =>
  ({
    size: 'sm',
    minH: 36,
    rounded: ROUND.button,
    bg: fill,
    color: ink,
    borderColor: 'transparent',
    hoverStyle: { bg: hover, borderColor: 'transparent', opacity: 1 },
    pressStyle: { bg: hover, borderColor: 'transparent', opacity: 1 },
    focusStyle: { borderColor: 'transparent' },
    focusVisibleStyle: RING,
  }) as const

/** The one filled control: Accept all in the bar, Save preferences (or Done) in the sheet. */
const PRIMARY = button('var(--primary)', 'var(--primary-hover)', 'var(--primary-foreground)')

/** Beside it: Manage preferences in the bar, Accept all in the sheet. */
const SECONDARY = button('var(--secondary)', 'var(--secondary-hover)', 'var(--secondary-foreground)')

/** A ×: no fill at rest, the secondary surface under the pointer. */
const CLOSE = {
  rounded: ROUND.button,
  bg: 'transparent',
  borderColor: 'transparent',
  hoverStyle: { bg: 'var(--secondary)', borderColor: 'transparent', opacity: 1 },
  pressStyle: { bg: 'var(--secondary-hover)', borderColor: 'transparent', opacity: 1 },
  focusStyle: { borderColor: 'transparent' },
  focusVisibleStyle: RING,
} as const

/** "Your Privacy Choices" as a footer draws a link: the icon, then the words, quiet until pointed at. */
const CHOICES = {
  type: 'button',
  variant: 'link',
  size: 'sm',
  px: 0,
  minH: 0,
  color: '$aside',
  hoverStyle: { color: '$ink' },
  focusVisibleStyle: RING,
  startIcon: <PrivacyChoicesIcon />,
} as const

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
  // The rule in force: undefined until cloud (or this tab) has said, and nothing is drawn meanwhile.
  const [mode, setMode] = useState<Mode | undefined>()
  // The bar (eu) or the notice (global) at the foot of the window.
  const [shown, setShown] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [draft, setDraft] = useState<Choice>({ analytics: false, marketing: false, ads: false })
  // The switches as they stand, for a handler registered once.
  const latest = useRef(draft)
  latest.current = draft
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // Whether the page draws its own way to the sheet; if not, the component draws one.
  const [hosted, setHosted] = useState(true)
  // The rule, read by handlers registered once.
  const rule = useRef<Mode | undefined>(undefined)
  // The choices are open because the visitor asked for them. A policy that
  // arrives after (cloud answers ~150ms into a page opened at #choices) redraws
  // the bar's question, and must not close what was asked for.
  const asked = useRef(false)
  // What had focus when the sheet opened, given it back when the sheet closes.
  const back = useRef<HTMLElement | null>(null)
  const sheet = useRef<HTMLElement | null>(null)
  const manage = useRef<HTMLElement | null>(null)
  const opened = useRef(false)
  // The switches were filled from a stored choice, not left at the rule's defaults.
  const seeded = useRef(false)
  // The switches the visitor has moved since the sheet opened.
  const moved = useRef(new Set<keyof Choice>())
  const id = useId()
  // The browser refused, as the page sees it or as cloud saw the request. State,
  // so cloud's answer redraws an open sheet.
  const [locked, setLocked] = useState(false)

  /**
   * What stands at the foot of the window under a rule: the eu bar until a
   * choice, the global notice until seen (and never to a browser that refused,
   * which agreed to nothing by browsing).
   */
  const front = (m = rule.current): boolean => (m === 'eu' ? asks() : m === 'global' ? !noticed() && !declined() : false)

  /**
   * The switches under rule `m`: the rule's own state, with the visitor's moves
   * kept. Under eu only a move to off carries, so nothing arrives pre-ticked.
   */
  const merged = (m: Mode): Choice => {
    const next = readConsent()
    for (const k of moved.current) if (m !== 'eu' || !latest.current[k]) next[k] = latest.current[k]
    return next
  }

  /** Redraws the open sheet's switches under rule `m`; an opt-out rule saves what they say. */
  const redraw = (m: Mode) => {
    const next = merged(m)
    setDraft(next)
    if (m !== 'eu' && moved.current.size) saveConsent(next)
  }

  const choose = () => {
    // Already open: the visitor's unsaved switches and the focus to return stay as they are.
    if (asked.current) return
    const at = document.activeElement
    back.current = at instanceof HTMLElement && at !== document.body ? at : null
    asked.current = true
    moved.current = new Set()
    setLocked(declined())
    seeded.current = storedConsent()
    setDraft(readConsent())
    setChoosing(true)
  }

  // Closing without a choice: under eu a visitor who has not chosen is asked again by the bar.
  const close = () => {
    asked.current = false
    setChoosing(false)
    setShown(front())
  }

  useEffect(() => {
    const sync = () => {
      setShown(front())
      setLocked(declined())
      // A policy version the stored choice was not made under: the switches the
      // sheet opened with were an old grant, and fall back to the rule's own.
      if (asked.current && seeded.current && !storedConsent()) {
        seeded.current = false
        redraw(rule.current ?? 'eu')
      }
    }
    const decide = (m: Mode) => {
      const changed = rule.current !== m
      rule.current = m
      setMode(m)
      sync()
      // A rule that changes under an open sheet changes what its switches mean:
      // they show the new rule's state, with the visitor's moves kept.
      if (changed && asked.current) redraw(m)
    }
    // Cloud answered on this page: its rule, whether or not it placed the visitor.
    const policy = () => decide(consentPolicy().mode)
    const known = served()
    if (known) decide(known)
    // No answer in time is the strict answer.
    const wait = known ? undefined : window.setTimeout(() => rule.current ?? decide('eu'), WAIT)

    // The page's own links to the sheet, looked for again as it changes, once a frame.
    let frameId = 0
    const look = () => {
      if (frameId) return
      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        setHosted(linked())
      })
    }
    look()
    const watch = new MutationObserver(look)
    watch.observe(document.body, { childList: true, subtree: true })

    // `#choices` opens the sheet: on arrival, on a hash change, and on a press of
    // any link on this site to it, so the footer's Your Privacy Choices and a link
    // in a page are the same control.
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
    window.addEventListener(POLICY_EVENT, policy)
    window.addEventListener(LINKS_EVENT, look)
    window.addEventListener('hashchange', hash)
    document.addEventListener('click', press, { capture: true })
    return () => {
      window.clearTimeout(wait)
      window.cancelAnimationFrame(frameId)
      watch.disconnect()
      window.removeEventListener(OPEN, choose)
      window.removeEventListener(POLICY_EVENT, policy)
      window.removeEventListener(LINKS_EVENT, look)
      window.removeEventListener('hashchange', hash)
      document.removeEventListener('click', press, { capture: true })
    }
  }, [])

  // @hanzo/event holds a withdrawal's reload while the sheet is open, and reloads once when it closes.
  useEffect(() => {
    if (!choosing) return
    consentSheet(true)
    return () => consentSheet(false)
  }, [choosing])

  // Focus moves into the sheet when it opens, stays inside it while it is open,
  // and returns to what opened it (or the bar's Manage preferences) when it closes.
  useEffect(() => {
    if (!choosing) {
      if (!opened.current) return
      opened.current = false
      const el = back.current
      back.current = null
      if (el?.isConnected) el.focus()
      else (manage.current ?? document.querySelector<HTMLElement>('[data-slot="consent-choices"] button'))?.focus()
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

  const done = (fn: () => void) => () => {
    fn()
    asked.current = false
    setShown(front())
    setChoosing(false)
  }

  // The sheet, drawn over whatever opened it, which stays mounted so focus can go back to it.
  let panel: ReactNode = null
  if (choosing) {
    // A sheet opened before cloud answered speaks the strict rule.
    const strict = (mode ?? 'eu') === 'eu'
    // Under eu the switches wait for Save preferences; elsewhere each one is an opt-out, saved as it moves.
    const flip = (key: keyof Choice, on: boolean) => {
      moved.current.add(key)
      const next = { ...draft, [key]: on }
      setDraft(next)
      if (!strict) saveConsent(next)
    }
    panel = (
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
            <Button type="button" size="icon" {...CLOSE} aria-label="Close" onClick={close}>
              <X size={16} />
            </Button>
          </XStack>
          <YStack shrink={1} minH={0} overflowY="auto" px="$5" pb="$2" style={{ overscrollBehavior: 'contain' }}>
            <Paragraph size="$2" color="$aside" m={0} pb="$3">
              {intro(strict, locked)}
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
                {REFUSAL}
              </Paragraph>
            ) : null}
            {kinds(brand, strict, locked).map((k) => {
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
                        // A browser that refused holds every switch off, under every rule.
                        disabled={locked}
                        checked={locked ? false : draft[k.key]}
                        onCheckedChange={(v: boolean) => flip(k.key as keyof Choice, v === true)}
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
            {strict ? (
              <>
                {/* A browser that refused cannot accept here: there is nothing to accept. */}
                {locked ? null : (
                  <Button type="button" {...SECONDARY} grow={1} onClick={done(acceptAll)}>
                    Accept all
                  </Button>
                )}
                {/* The sheet's answer: what the switches say, essential only when none is on. */}
                <Button type="button" {...PRIMARY} grow={1} onClick={done(() => saveConsent(draft))}>
                  Save preferences
                </Button>
              </>
            ) : (
              // Each switch saved as it moved: nothing is left to save.
              <Button type="button" {...PRIMARY} grow={1} onClick={close}>
                Done
              </Button>
            )}
          </XStack>
        </YStack>
      </YStack>
    )
  }

  if (!mode) return panel

  // The way to the sheet on a page that draws none: small, quiet, at the foot of the window.
  const own =
    !hosted && !shown ? (
      <XStack
        {...slot('consent-choices')}
        position="fixed"
        b={EDGE.bottom}
        l={EDGE.left}
        z="var(--z-banner, 50)"
        px="$2.5"
        py="$1"
        bg="$background"
        borderWidth={1}
        borderColor="$borderColor"
        rounded={ROUND.button}
      >
        <Button {...CHOICES} onClick={choose}>
          Your Privacy Choices
        </Button>
      </XStack>
    ) : null

  let surface: ReactNode = own

  // The global notice: one line, the way to the choices, and a × that records it as seen.
  if (shown && mode === 'global')
    surface = (
      <XStack {...frame} role="region" aria-label="Cookie notice" style={FIT} maxW={1200} flexWrap="wrap" items="center" columnGap="$4" rowGap="$2">
        <YStack shrink={1} minW={0}>
          <Paragraph size="$2" color="$ink" m={0}>
            We use cookies to improve your experience. By continuing to browse, you agree.
          </Paragraph>
        </YStack>
        <Button {...CHOICES} onClick={choose}>
          Your Privacy Choices
        </Button>
        <Button
          type="button"
          size="icon"
          {...CLOSE}
          aria-label="Close"
          position="absolute"
          t="$3"
          insetInlineEnd="$3"
          onClick={done(notice)}
        >
          <X size={16} />
        </Button>
      </XStack>
    )

  // The eu bar: the line, then the buttons. They share a row where the line fits
  // beside them and the buttons drop under it where it does not, so a phone shows
  // the line over one row of buttons and nothing breaks mid-control.
  else if (shown && mode === 'eu')
    surface = (
    <XStack {...frame} role="dialog" aria-label="Cookie preferences" style={FIT} maxW={1200} flexWrap="wrap" items="center" columnGap="$4" rowGap="$3">
      <YStack shrink={1} minW={0}>
        <Paragraph size="$2" color="$ink" m={0}>
          {`Essential cookies keep ${brand} running. With your OK, optional cookies help us measure performance and ads.`}
        </Paragraph>
      </YStack>
      <XStack gap="$2" marginInlineStart="auto" items="center" flexWrap="wrap">
        <Button ref={manage as never} type="button" {...SECONDARY} onClick={choose}>
          Manage preferences
        </Button>
        <Button type="button" {...PRIMARY} onClick={done(acceptAll)}>
          Accept all
        </Button>
      </XStack>
      {/* Essential cookies only: the refusal, as easy to give as Accept all. */}
      <Button
        type="button"
        size="icon"
        {...CLOSE}
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

  return (
    <>
      {/* Under the modal sheet, out of reach of the keyboard and assistive technology. */}
      <div inert={choosing || undefined} style={{ display: 'contents' }}>
        {surface}
      </div>
      {panel}
    </>
  )
}

/**
 * "Your Privacy Choices" with California's privacy options icon: the link to the
 * sheet, for a footer. A page that mounts one gets no second link from `Consent`.
 */
const ConsentLink = ({ label = 'Your Privacy Choices' }: { label?: string }) => {
  useEffect(() => hold(), [])
  return (
    <Button {...slot('consent-link')} {...CHOICES} onClick={openConsent}>
      {label}
    </Button>
  )
}

export { Consent, ConsentLink }
