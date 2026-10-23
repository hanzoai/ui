'use client'

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from 'react'
import { Anchor, Text, View, XStack, YStack, type AnchorProps, type GuiElement } from '@hanzo/gui'
import { HanzoCommandPalette, HanzoIdentity, HanzoWordmark, MARKS, type GlyphName, type HanzoCommandEntry } from '@hanzogui/shell'
import { useI18n, type Say } from '@hanzo/i18n/react'

import { ACCOUNT, COMPANY, DOCS, LOGIN, MENUS, OPEN, TRY, at, leaves, type Link, type Menu } from './nav'

/**
 * hanzo.ai's header, for every site that wears it: one nav tree (`./nav`) for
 * the bar and the phone sheet.
 *
 * The bar is `@hanzogui/shell`'s vocabulary — its marks, its wordmark, its ⌘K
 * palette and its account menu — laid out the way hanzo.ai reads: the wordmark
 * opens the company, the five menus follow with a mark before each label,
 * search closes the row, and Log in ▾ and Try Hanzo stand at the far end.
 *
 * Every style is a gui prop on the element that wears it; no stylesheet rule
 * reaches the bar, a plane, the log-in card or the sheet. The geometry is the
 * shell's — a 60px row, 34px pills, 13px labels, a 16px mark before each, a
 * 12px chevron after — and every ink and ground is a theme token, so the light
 * theme needs no second copy. Below gui's `$lg` (1024) the bar is the name,
 * search and a menu button; the marks before the five labels wait for `$xl`
 * (1280), because between the two the row fits its labels and not its marks.
 *
 * THREE GROUNDS for the bar. Clear over the top of a page; glass once the page
 * moves under it; and the plane's own opaque ground while a menu or the sheet
 * hangs from it, so bar and plane are one surface. The open bar carries no
 * backdrop filter on purpose: a filtered element is a backdrop root, and the
 * veil inside it would then blur the bar instead of the page.
 *
 * A row's look is read from the tree, not from where it lands: a path is a page
 * on hanzo.ai and reads as one on every host (no ↗, the same tab), and a row
 * that names a host says ↗ and opens a new tab — unless it names `here`, the
 * host the page is on, when it is that site's own page.
 */

/** Who is signed in, as the account menu draws them. */
export interface Person {
  name: string
  email?: string
  avatar?: string
}

/** The rows the bar draws. Each defaults to hanzo.ai's own, in `./nav`. */
export interface Tree {
  company: Menu
  menus: readonly Menu[]
  login: readonly Link[]
  /** The one filled control for a stranger. */
  try: Link
  /** …and for a reader who is signed in. */
  open: Link
  /** The signed-in reader's own page, in the account menu and the sheet. */
  account: Link
}

export interface MastheadProps {
  /** The name in the corner: `Hanzo AI` on hanzo.ai. */
  label?: string
  /** Where the name goes, read as a row is. */
  home?: string
  /** The host the tree's paths are pages on: empty on hanzo.ai, `https://hanzo.ai` on any other site. */
  origin?: string
  /** The host this page is on, so a row that names it is a page here (`https://hanzo.agency`). */
  here?: string
  /** The rows, where they are not hanzo.ai's. */
  tree?: Partial<Tree>
  /** The signed-in reader. Absent, the bar offers Log in ▾ and Try Hanzo. */
  person?: Person | null
  onSignOut?: () => void
  /** What ⌘K finds, beside the bar's own rows. */
  commands?: readonly HanzoCommandEntry[]
  /** A question typed into ⌘K, handed to the host's own assistant. Absent, it goes to `askHref`. */
  onAsk?: (question: string) => void
  /** Where ⌘K sends a question, as `<askHref>?q=`. */
  askHref?: string
  /** The name alone, on the way in and on the way to pay: home is one click away. */
  bare?: boolean
}

/** A menu stays open this long after the pointer leaves, so a diagonal path to a row keeps it. */
const GRACE = 160
/** And opens after the pointer rests this long, so crossing the bar opens nothing. */
const REST = 70

/** The bar's height, under the notch. */
export const HEADER = 60

/** The bar's two inks over the page: a wash for a lit pill, and its hairline. */
const WASH = '$ink/6'
const RING = 'inset 0 0 0 1px color-mix(in srgb, var(--foreground) 10%, transparent)'
/** A pill lit: under the pointer, or holding its menu open. */
const LIT = { color: 'var(--foreground)', bg: WASH, boxShadow: RING } as const
/** Where what hangs from the bar begins: under the bar and the notch above it. */
const UNDER = `calc(${HEADER}px + env(safe-area-inset-top))`
/** The open bar, the planes, the log-in card and the sheet stand on one opaque ground. */
const PANEL = 'var(--chrome-panel)'
/** The drop under what hangs from the bar. */
const DROP = '0 24px 60px -16px color-mix(in srgb, var(--pure-black) 75%, transparent)'
/** The bar's glass, once the page moves under it. */
const GLASS = '$background/72'
/** The highest z-index there is. The search palette stands in a fixed layer at
 *  it, so nothing fixed to the window draws over an open palette. */
const TOP = 2147483647

/**
 * The shell's account menu paints with `var(--white-92…)`, and @hanzo/design
 * keeps those rungs white in both themes. The bar follows the theme, so inside
 * it the four flip to black: `light-dark()` reads the `color-scheme` @hanzo/design
 * sets with the theme. The dimmest is PUSHED rather than mirrored — .45 black on
 * white is 3.35:1, .56 is 4.5:1 on the bar and on the panel.
 */
const ink = (dark: number, light: number) =>
  `light-dark(color-mix(in srgb, var(--pure-black) ${light}%, transparent), color-mix(in srgb, var(--pure-white) ${dark}%, transparent))`
const INK = {
  '--white-92': ink(92, 92),
  '--white-60': ink(60, 60),
  '--white-45': ink(45, 56),
  '--white-10': 'var(--border)',
} as CSSProperties

/** The bar: a sticky row under the notch, on the page's gutter. Its height is
 *  published as `--header`, which @hanzo/design's scroll padding reads. */
const BAR = {
  position: 'sticky',
  t: 0,
  z: 'var(--z-header)',
  items: 'center',
  gap: 12,
  boxSizing: 'content-box',
  height: HEADER,
  pt: 'calc(0px + env(safe-area-inset-top))',
  pb: 0,
  px: 'var(--page-gutter)',
} as const

/** The name of the place, lit under the pointer and while the company menu is open. */
const BRAND = { items: 'center', shrink: 0, height: 34, marginInlineStart: -4, rounded: 999, hoverStyle: { bg: WASH, boxShadow: RING } } as const

/** The wordmark: home, and never dim. */
const NAME = { display: 'flex', items: 'center', height: '100%', pl: 12, pr: 12, color: 'var(--foreground)', whiteSpace: 'nowrap', textDecorationLine: 'none' } as const

/** A pill in the bar: dim at rest, lit under the pointer. A button's own padding is the browser's, so it is stated. */
const PILL = {
  display: 'flex',
  items: 'center',
  shrink: 0,
  height: 34,
  p: 0,
  borderWidth: 0,
  rounded: 999,
  bg: 'transparent',
  color: 'var(--muted-foreground)',
  cursor: 'pointer',
  hoverStyle: LIT,
} as const

/** A pill that opens a menu: its label, then a chevron. */
const TRIGGER = { ...PILL, gap: 6, px: 12, fontSize: '$2', lineHeight: 20, fontWeight: '500', whiteSpace: 'nowrap' } as const

/** The one filled control, in the bar and in the sheet. */
const ACT = {
  display: 'flex',
  items: 'center',
  justify: 'center',
  gap: 2,
  height: 34,
  px: 14,
  rounded: 999,
  bg: 'var(--foreground)',
  color: 'var(--background)',
  fontSize: '$2',
  lineHeight: 20,
  fontWeight: '600',
  whiteSpace: 'nowrap',
  hoverStyle: { opacity: 0.88 },
} as const

/** What hangs from the bar arrives: up 4px, faded in. */
const ARRIVE = { enterStyle: { opacity: 0, y: -4 }, transition: 'quickest' } as const

/**
 * A row in a plane. As wide as its words, so a keyboard ring hugs the words it
 * names rather than the column; its padding steps out of the column, so the
 * words stand on the column's edge.
 */
const ROW = {
  display: 'flex',
  items: 'center',
  self: 'flex-start',
  mx: -8,
  px: 8,
  rounded: 8,
  whiteSpace: 'nowrap',
  hoverStyle: { color: 'var(--foreground)' },
  focusVisibleStyle: { color: 'var(--foreground)' },
} as const
/** The destinations someone arrives wanting, in display type. */
const LEAD = { ...ROW, py: 2, fontSize: '$8', lineHeight: 33.28, fontWeight: '400', letterSpacing: -0.26, color: 'var(--foreground)' } as const
const PLAIN = { ...ROW, py: 5, fontSize: '$2', lineHeight: 20, fontWeight: '500', color: 'var(--muted-foreground)' } as const

/** A row in the sheet: a thumb's height, the column's width. */
const LINE = {
  display: 'flex',
  items: 'center',
  justify: 'flex-start',
  minH: 44,
  rounded: 8,
  fontWeight: '400',
  color: 'var(--muted-foreground)',
  hoverStyle: { color: 'var(--foreground)' },
  focusVisibleStyle: { color: 'var(--foreground)' },
} as const
/** The sheet's doors: Log in's rows, or the reader's own page. */
const DOOR = { display: 'flex', items: 'center', justify: 'flex-start', minH: 44, fontSize: '$4', lineHeight: 20, fontWeight: '400', color: 'var(--foreground)' } as const

/** Where a row goes, and whether it says ↗ — one reading for the bar, the sheet and ⌘K. */
interface Place {
  origin: string
  here: string
}

/** A menu's mark. In the bar it waits for `$xl`; in the sheet it always shows. */
function Mark({ name, bar = false }: { name: GlyphName; bar?: boolean }) {
  const Glyph = MARKS[name]
  return (
    <View render="span" data-slot="mark" aria-hidden display={bar ? 'none' : 'flex'} $xl={bar ? { display: 'flex' } : undefined} opacity={0.9}>
      <Glyph size={16} />
    </View>
  )
}

/** ▾, turned over while what it opens is open. */
function Chevron({ turned, end = false }: { turned: boolean; end?: boolean }) {
  return (
    <View render="span" aria-hidden display="flex" shrink={0} marginInlineStart={end ? 'auto' : 0} rotate={turned ? '180deg' : '0deg'} transition="quickest">
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </View>
  )
}

/** ↗ — the shell's outbound arrow, riding the label's size and ink. */
function Out() {
  return (
    <View render="span" aria-hidden display="flex" marginInlineStart="calc(0.28em)" opacity={0.7}>
      <svg width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </View>
  )
}

/** A row: the label, and ↗ with a new tab when it leaves. */
function Row({ link, place, onClick, ...style }: { link: Link; place: Place; onClick?: () => void } & Omit<AnchorProps, 'href' | 'target' | 'rel' | 'onClick'>) {
  const out = leaves(link.href, place.here)
  const { t } = useI18n()
  return (
    <Anchor
      href={at(link.href, place.origin, place.here)}
      target={out ? '_blank' : undefined}
      rel={out ? 'noreferrer' : undefined}
      onClick={onClick}
      textDecorationLine="none"
      {...style}
    >
      {t(link.label)}
      {out ? <Out /> : null}
    </Anchor>
  )
}

/** A column's title. In the sheet it is the quiet label over a section's rows. */
function Title({ sheet = false, children }: { sheet?: boolean; children: ReactNode }) {
  return (
    <Text render="p" mt={sheet ? 4 : 0} mb={sheet ? 2 : 10} mx={0} fontSize={sheet ? '$1' : '$2'} lineHeight={20} fontWeight="600" color={sheet ? 'var(--text-tertiary)' : 'var(--foreground)'}>
      {children}
    </Text>
  )
}

/**
 * A menu's columns, laid out from the wordmark's column: the lead column in
 * display type, the rest as lists. The column under the pointer is the one
 * being read; the others step back to 45%.
 */
function Columns({ menu, place, onPick }: { menu: Menu; place: Place; onPick: () => void }) {
  const [hot, setHot] = useState<number | null>(null)
  const { t } = useI18n()
  return (
    <View display="grid" gridAutoFlow="column" gridAutoColumns="max-content" justify="flex-start" gap="max(24px, min(3vw, 64px))" pt={36} pb={48} px="calc(var(--page-gutter) + 8px)">
      {menu.groups.map((group, i) => (
        <YStack
          key={group.title}
          gap={2}
          minW={0}
          opacity={hot === null || hot === i ? 1 : 0.45}
          transition="quickest"
          onPointerEnter={() => setHot(i)}
          onPointerLeave={() => setHot(null)}
        >
          <Title>{t(group.title)}</Title>
          {group.links.map((link) => (
            <Row key={link.label} link={link} place={place} onClick={onPick} {...(group.lead ? LEAD : PLAIN)} />
          ))}
        </YStack>
      ))}
    </View>
  )
}

/** The DOM node a gui element stands for, on the web. */
const node = (el: GuiElement | null) => (el instanceof HTMLElement ? el : null)

/** Publish the bar's content height to `--header` on the document for as long as it is mounted. */
function measure(el: HTMLElement | null) {
  if (!el || typeof ResizeObserver === 'undefined') return
  const root = document.documentElement.style
  const size = new ResizeObserver(([entry]) => root.setProperty('--header', `${entry.contentRect.height}px`))
  size.observe(el)
  return () => {
    size.disconnect()
    root.removeProperty('--header')
  }
}

/** What the bar reads off a pointer and a key: gui hands the web's own events through. */
type Hover = { type?: string; pointerType?: string }
type Key = { key?: string; preventDefault: () => void }

/** The bar's rows as ⌘K entries: what a reader can reach from here, they can find. */
function entries(company: Menu, menus: readonly Menu[], login: readonly Link[], place: Place, t: Say): HanzoCommandEntry[] {
  return [company, ...menus]
    .flatMap((menu) => menu.groups.flatMap((group) => group.links.map((link) => ({ menu, link }))))
    .concat(login.map((link) => ({ menu: company, link })))
    .filter(({ link }) => !link.href.startsWith(`${DOCS}/`))
    .map(({ menu, link }) => ({
      id: `nav/${menu.id}/${link.label}`,
      title: t(link.label),
      href: at(link.href, place.origin, place.here),
      group: t(menu.label),
      external: leaves(link.href, place.here),
    }))
}

export function Masthead({
  label = 'Hanzo AI',
  home = '/',
  origin = '',
  here = '',
  tree = {},
  person,
  onSignOut,
  commands = [],
  onAsk,
  askHref,
  bare = false,
}: MastheadProps) {
  const company = tree.company ?? COMPANY
  const menus = tree.menus ?? MENUS
  const login = tree.login ?? LOGIN
  const account = tree.account ?? ACCOUNT
  const act = person ? (tree.open ?? OPEN) : (tree.try ?? TRY)
  const place: Place = { origin, here }
  const homeHref = at(home, origin, here)
  const { t } = useI18n()

  const [open, setOpen] = useState<string | null>(null)
  const [sheet, setSheet] = useState(false)
  const [search, setSearch] = useState(false)
  const [grounded, setGrounded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pinned = useRef(false)
  const bar = useRef<GuiElement>(null)
  const toggle = useRef<GuiElement>(null)
  /** The bar's element, held for the menus and measured for `--header`. */
  const masthead = useCallback((el: GuiElement | null) => {
    bar.current = el
    return measure(node(el))
  }, [])

  const close = useCallback(() => {
    clearTimeout(timer.current)
    pinned.current = false
    setOpen(null)
  }, [])

  // The bar is clear over the top of the page and takes the glass once the page
  // moves under it.
  useEffect(() => {
    const read = () => setGrounded(window.scrollY > 4)
    read()
    window.addEventListener('scroll', read, { passive: true })
    return () => window.removeEventListener('scroll', read)
  }, [])

  // Escape closes whatever is open and hands focus back to what opened it.
  useEffect(() => {
    if (!open && !sheet) return
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (open) {
        node(bar.current)?.querySelector<HTMLElement>(`[aria-controls="menu-${open}"]`)?.focus()
        close()
      }
      if (sheet) {
        setSheet(false)
        node(toggle.current)?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [open, sheet, close])

  // A press anywhere outside the bar closes an open menu.
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!node(bar.current)?.contains(e.target as Node)) close()
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open, close])

  // The sheet holds the screen: the page under it does not scroll, and it goes
  // away when the window grows into the bar.
  useEffect(() => {
    if (!sheet) return
    const root = document.documentElement
    root.style.overflow = 'hidden'
    const wide = matchMedia('(min-width: 1024px)')
    const grow = () => wide.matches && setSheet(false)
    wide.addEventListener('change', grow)
    return () => {
      root.style.overflow = ''
      wide.removeEventListener('change', grow)
    }
  }, [sheet])

  const rest = (id: string) => (e: Hover) => {
    if (e.pointerType !== 'mouse') return
    clearTimeout(timer.current)
    if (open === id) return
    if (open) {
      pinned.current = false
      setOpen(id)
    } else timer.current = setTimeout(() => setOpen(id), REST)
  }
  const leave = (e: Hover) => {
    if (e.pointerType !== 'mouse' || pinned.current) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(null), GRACE)
  }
  const press = (id: string) => () => {
    clearTimeout(timer.current)
    // A click on a menu the pointer already opened keeps it open; a second one closes it.
    if (open === id && pinned.current) return close()
    pinned.current = true
    setOpen(id)
  }
  const step = (id: string) => (e: Key) => {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    pinned.current = true
    setOpen(id)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#menu-${id} a`)?.focus())
  }
  // Focus that leaves a menu closes it.
  const blur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close()
  }
  const find = () => {
    close()
    setSheet(false)
    setSearch(true)
  }

  /** What a pill wears while its menu is open. */
  const lit = (id: string) => (open === id ? LIT : {})

  const menu = (item: Menu, trigger: ReactNode) => (
    <XStack position="relative" onPointerEnter={rest(item.id)} onPointerLeave={leave} onBlur={blur}>
      {trigger}
      {open === item.id ? (
        /* A menu's panel spans the window under the bar. */
        <YStack
          id={`menu-${item.id}`}
          role="group"
          aria-label={t(item.label)}
          position="fixed"
          t={UNDER}
          l={0}
          r={0}
          z="var(--z-raised)"
          maxH={`calc(100dvh - ${HEADER}px)`}
          overflowY="auto"
          bg={PANEL}
          boxShadow={DROP}
          {...ARRIVE}
        >
          <Columns menu={item} place={place} onPick={close} />
        </YStack>
      ) : null}
    </XStack>
  )

  const trigger = (item: Menu) => (
    <Text
      render="button"
      {...TRIGGER}
      {...lit(item.id)}
      aria-expanded={open === item.id}
      aria-controls={`menu-${item.id}`}
      onClick={press(item.id)}
      onKeyDown={step(item.id)}
    >
      <Mark name={item.glyph} bar />
      {t(item.label)}
      <Chevron turned={open === item.id} />
    </Text>
  )

  // On the way in and on the way to pay, the name alone. The two bars are
  // different elements (`key`), so moving between them mounts the other bar
  // rather than re-rendering one with and without its `transition`, which
  // changes the hooks @hanzo/gui calls for it.
  if (bare) {
    return (
      <XStack key="bare" ref={masthead} render="header" data-slot="masthead" {...BAR}>
        <XStack render="span" {...BRAND}>
          <Anchor href={homeHref} aria-label={t('{name} home', { name: label })} {...NAME}>
            <HanzoWordmark label={label} size={22} />
          </Anchor>
        </XStack>
      </XStack>
    )
  }
  const lifted = open !== null || sheet
  return (
    <>
      <XStack
        key="full"
        ref={masthead}
        render="header"
        data-slot="masthead"
        {...BAR}
        bg={lifted ? PANEL : grounded ? GLASS : 'transparent'}
        // The chrome's own blur, by name: @hanzo/design's one radius, the glass every bar wears.
        backdropFilter={!lifted && grounded ? 'var(--chrome-blur)' : 'none'}
        transition="quickest"
        // inline-style: custom properties @hanzogui/shell's account menu reads; no prop sets a variable.
        style={INK}
      >
        {menu(
          company,
          <XStack render="span" {...BRAND} {...(open === company.id ? { bg: WASH, boxShadow: RING } : {})}>
            <Anchor href={homeHref} aria-label={t('{name} home', { name: label })} {...NAME} $lg={{ paddingInlineEnd: 0 }}>
              <HanzoWordmark label={label} size={22} />
            </Anchor>
            {/* The name goes home; the chevron beside it is its own stop and opens the company. */}
            <Text
              render="button"
              aria-label={t(company.label)}
              aria-expanded={open === company.id}
              aria-controls={`menu-${company.id}`}
              onClick={press(company.id)}
              onKeyDown={step(company.id)}
              display="none"
              $lg={{ display: 'grid' }}
              placeItems="center"
              width={30}
              height="100%"
              p={0}
              paddingInlineEnd={6}
              borderWidth={0}
              borderStartEndRadius={999}
              borderEndEndRadius={999}
              bg="transparent"
              color="var(--foreground)"
              cursor="pointer"
            >
              <Chevron turned={open === company.id} />
            </Text>
          </XStack>,
        )}
        <XStack render="nav" aria-label={t('Main')} display="none" $lg={{ display: 'flex' }} items="center" gap={2}>
          {menus.map((item) => (
            <Fragment key={item.id}>{menu(item, trigger(item))}</Fragment>
          ))}
        </XStack>
        {/* The page recedes under an open plane, and a press on it closes the plane. */}
        {open && open !== 'login' ? (
          <View
            aria-hidden
            onPress={close}
            position="fixed"
            t={UNDER}
            l={0}
            r={0}
            b={0}
            z="var(--z-base)"
            bg="$black/40"
            backdropFilter="var(--chrome-blur)"
          />
        ) : null}
        <Text
          render="button"
          aria-label={t('Search Hanzo or ask AI')}
          onClick={find}
          {...PILL}
          justify="center"
          width={44}
          height={44}
          marginInlineStart="auto"
          $lg={{ width: 34, height: 34, marginInlineStart: 0 }}
        >
          <MARKS.search size={16} />
        </Text>
        <XStack items="center" gap={8} $lg={{ marginInlineStart: 'auto' }}>
          {person ? (
            <HanzoIdentity
              auth={{ user: person, onSignOut, items: [{ id: 'account', label: t(account.label), href: at(account.href, origin, here) }] }}
            />
          ) : (
            <XStack position="relative" display="none" $lg={{ display: 'flex' }} onPointerEnter={rest('login')} onPointerLeave={leave} onBlur={blur}>
              <Text
                render="button"
                {...TRIGGER}
                {...lit('login')}
                aria-expanded={open === 'login'}
                aria-controls="menu-login"
                onClick={press('login')}
                onKeyDown={step('login')}
              >
                {t('Log in')}
                <Chevron turned={open === 'login'} />
              </Text>
              {open === 'login' ? (
                <YStack
                  id="menu-login"
                  role="group"
                  aria-label={t('Log in')}
                  position="absolute"
                  t="calc(100% + 8px)"
                  insetInlineEnd={0}
                  display="grid"
                  gap={2}
                  minW={240}
                  p={6}
                  borderWidth={1}
                  borderColor="var(--border)"
                  rounded={12}
                  bg={PANEL}
                  boxShadow={DROP}
                  {...ARRIVE}
                >
                  {login.map((link) => (
                    <Anchor
                      key={link.label}
                      href={at(link.href, origin, here)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={close}
                      display="grid"
                      gap={2}
                      py={8}
                      px={10}
                      rounded={8}
                      color="var(--foreground)"
                      fontSize="$2"
                      lineHeight={20}
                      fontWeight="600"
                      textDecorationLine="none"
                      hoverStyle={{ bg: WASH }}
                      focusVisibleStyle={{ bg: WASH }}
                    >
                      {t(link.label)}
                      <Text render="small" fontSize="$1" lineHeight={20} fontWeight="400" color="var(--muted-foreground)">
                        {link.hint ? t(link.hint) : null}
                      </Text>
                    </Anchor>
                  ))}
                </YStack>
              ) : null}
            </XStack>
          )}
          <Row link={act} place={place} {...ACT} display="none" $lg={{ display: 'flex' }} />
          <Text
            ref={toggle}
            render="button"
            aria-label={sheet ? t('Close menu') : t('Open menu')}
            aria-expanded={sheet}
            aria-controls="sheet"
            onClick={() => {
              close()
              setSheet((s) => !s)
            }}
            display="grid"
            $lg={{ display: 'none' }}
            placeItems="center"
            width={44}
            height={44}
            p={0}
            marginInlineEnd={-10}
            borderWidth={0}
            bg="transparent"
            color="var(--foreground)"
            cursor="pointer"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d={sheet ? 'M6 6l12 12M18 6L6 18' : 'M3 9h18M3 15h18'} />
            </svg>
          </Text>
        </XStack>
      </XStack>
      {sheet ? (
        <Sheet
          company={company}
          menus={menus}
          login={login}
          door={person ? account : null}
          act={act}
          place={place}
          onClose={() => setSheet(false)}
        />
      ) : null}
      {/* A fixed box of no size is a stacking context at TOP, and the palette's
          scrim and panel, fixed to the window themselves, stack inside it. */}
      <View position="fixed" z={TOP}>
        <HanzoCommandPalette
          commands={[...commands, ...entries(company, menus, login, place, t).filter((e) => !commands.some((c) => c.href === e.href))]}
          open={search}
          onOpenChange={setSearch}
          onAsk={onAsk}
          askHref={askHref}
        />
      </View>
    </>
  )
}

/**
 * The phone's menu: the whole tree, one section open at a time, then the two
 * doors. A `<details>` per section, so the browser keeps which one is open and
 * closes the rest (`name`); the chevron reads it back. It stands under the bar
 * and carries the bottom inset, as the bar carries the top one.
 */
function Sheet({
  company,
  menus,
  login,
  door,
  act,
  place,
  onClose,
}: {
  company: Menu
  menus: readonly Menu[]
  login: readonly Link[]
  /** The signed-in reader's own page; absent, the sheet offers Log in's rows. */
  door: Link | null
  act: Link
  place: Place
  onClose: () => void
}) {
  const first = useRef<GuiElement>(null)
  const [section, setSection] = useState<string | null>(null)
  const { t } = useI18n()
  useEffect(() => node(first.current)?.focus(), [])
  return (
    <View
      id="sheet"
      role="dialog"
      aria-modal
      aria-label={t('Menu')}
      display="block"
      position="fixed"
      t={UNDER}
      l={0}
      r={0}
      b={0}
      z="var(--z-overlay)"
      overflowY="auto"
      $platform-web={{ overscrollBehaviorX: 'contain', overscrollBehaviorY: 'contain' }}
      pt={4}
      px="var(--page-gutter)"
      pb="calc(24px + env(safe-area-inset-bottom))"
      bg={PANEL}
      {...ARRIVE}
    >
      <View render="nav" aria-label={t('Main')} display="block">
        {[company, ...menus].map((item, i) => (
          <View
            key={item.id}
            render={
              <details
                name="sheet"
                onToggle={(e) => {
                  const now = e.currentTarget.open
                  setSection((s) => (now ? item.id : s === item.id ? null : s))
                }}
              />
            }
            display="block"
            borderBottomWidth={1}
            borderColor="var(--border)"
          >
            <Text
              ref={i === 0 ? first : undefined}
              render="summary"
              display="flex"
              items="center"
              gap={10}
              minH={56}
              fontSize="$6"
              lineHeight={20}
              fontWeight="500"
              color="var(--foreground)"
              cursor="pointer"
            >
              <Mark name={item.glyph} />
              {t(item.label)}
              <Chevron turned={section === item.id} end />
            </Text>
            {item.groups.map((group) => (
              <YStack key={group.title} gap={2} minW={0} pb={16}>
                <Title sheet>{t(group.title)}</Title>
                {group.links.map((link) => (
                  <Row key={link.label} link={link} place={place} onClick={onClose} {...LINE} fontSize={group.lead ? '$6' : '$4'} lineHeight={group.lead ? 20.4 : 18} />
                ))}
              </YStack>
            ))}
          </View>
        ))}
      </View>
      <View display="grid" gap={4} pt={20}>
        {door ? (
          <Row link={door} place={place} onClick={onClose} {...DOOR} />
        ) : (
          <>
            <Title sheet>{t('Log in')}</Title>
            {login.map((link) => (
              <Row key={link.label} link={link} place={place} onClick={onClose} {...DOOR} />
            ))}
          </>
        )}
        <Row link={act} place={place} onClick={onClose} {...ACT} height={48} mt={12} fontSize="$3" />
      </View>
    </View>
  )
}
