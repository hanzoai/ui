'use client'

/**
 * Corner — help and preferences, behind the one control that is on every page.
 *
 *   <Corner
 *     help={[{ label: 'Get help', href: '/support' }, { label: 'Docs', href: 'https://docs.hanzo.ai' }]}
 *     language={{ value: locale, options: LANGUAGES, onChange: setLocale }}
 *     currency={{ value: fiat, options: CURRENCIES, onChange: setFiat }}
 *   />
 *
 * A small `?` sits at the bottom START corner of the window (bottom-left in a
 * left-to-right page, bottom-right in a right-to-left one), clear of the notch
 * and the home indicator. Pressing it opens one card that opens toward the
 * inside: the host's help links first, then Theme, Language, Font (and Arabic
 * font, on a page in Arabic script) and Currency. The settings a visitor is most
 * likely to want are where they look when they want the page to explain itself,
 * on every surface, in the same place.
 *
 * Theme and the faces are the library's own: `@hanzo/appearance`, written through `<Hanzo>`'s
 * resolved stack when there is one (`Look`), so it is stored, painted before
 * first paint and carried across origins exactly as the settings panel does.
 * Language and currency are the HOST's — this package depends on no i18n or
 * money library, so it draws the value it is handed and reports a choice. A row
 * the host passes nothing for is not drawn.
 *
 * Behaviour is the package `Popover`'s: portalled, dismissed by Escape and an
 * outside press, focus trapped while open and handed back to the trigger on
 * close. Escape in a list returns to the card rather than closing it. Arrow keys
 * move through the card's rows and through a list; a long list (more than
 * `LONG`) gets a search field that owns the cursor (`aria-activedescendant`).
 * Nothing animates, so there is no motion to reduce.
 *
 * Web-only — it is fixed to the window — so it ships at `@hanzo/ui/corner`
 * beside `consent`, not on the barrel that promises native.
 */
import { Anchor, Input as GuiInput, SizableText, XStack, YStack, usePopperContextSlow } from '@hanzo/gui'
import { Check, ChevronLeft, ChevronRight, CircleHelp, ExternalLink, Moon, Search, Sun, X } from '@hanzogui/lucide-icons-2'
import { COMPANIONS, apply, companion, current, read, useScheme, write, type Preference, type Scheme } from '@hanzo/appearance'
import { useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '../backends/gui/popover'
import { touch } from '../backends/gui/gesture'
import { RING, press } from '../backends/gui/press'
import { slot, tip } from '../backends/gui/slot'
import { leaves } from '../masthead/nav'
import { move, type Move } from '../product/chipSelect.logic'
import { Segmented } from '../product/Filters'
import { useEmit } from '../product/instrument'
import { Look } from '../look'
import { LONG, WORDS, arabic, find, shown, type Option, type Setting, type Words } from './logic'

export type { Option, Setting, Words } from './logic'

/** A help link. `icon` leads the label; an address on another host opens in a new tab with the outbound mark. */
export type Link = { label: string; href: string; icon?: ReactNode }

export type CornerProps = {
  /** Help links, in order: Get help, Docs, Contact us. None, and the card opens on Preferences. */
  help?: readonly Link[]
  /** The page's language, owned by the host. Absent, the row is not drawn. */
  language?: Setting
  /** The page's display currency, owned by the host. Absent, the row is not drawn. */
  currency?: Setting
  /** The panel's own words, for a host that speaks another language. */
  words?: Partial<Words>
}

type View = 'main' | 'language' | 'currency' | 'font' | 'arabic'

/** The rows that open a list, in the order the card draws them. */
const LISTS = ['language', 'font', 'arabic', 'currency'] as const

/**
 * The trigger's distance from the window's foot and its start edge: 10px, or the
 * device's inset and 4px where that is wider. A right-to-left page puts the
 * trigger on the right, so the inline edge takes the wider of the two side insets.
 */
const EDGE = {
  bottom: 'max(10px, calc(var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + 4px))',
  start:
    'max(10px, calc(max(var(--safe-left, env(safe-area-inset-left, 0px)), var(--safe-right, env(safe-area-inset-right, 0px))) + 4px))',
} as const

/**
 * A row's height: 36 under a mouse, 44 under a finger. Rows sit edge to edge,
 * so the height itself is the target — an overlay past it would land on the
 * next row. (`[role=button]` gets the same floor from design's base sheet.)
 */
const ROW = { minH: 36, $touchable: { minH: 44 } } as const

/** The keys a list answers. */
const MOVES = new Set<Move>(['ArrowDown', 'ArrowUp', 'Home', 'End', 'PageDown', 'PageUp'])

/** Everything in the card the arrow keys step through, in document order. */
const STOPS = '[data-corner-stop], [data-slot="segmented-item"][data-state="checked"]'

/**
 * One appearance axis — theme, face or Arabic face — as the person chose it,
 * and the one way to change it.
 *
 * Under `<Hanzo>` it writes through the root's `useAppearance` (its org,
 * install and account layers). Under a host's own gui provider it writes the
 * device's layer and repaints the resolved stack, which is what `useAppearance`
 * would do there. Nobody chose yet: undefined, and the row says what the
 * document shows.
 */
function useAxis<K extends 'theme' | 'font' | 'arabic'>(axis: K): [Preference[K], (value: NonNullable<Preference[K]>) => void] {
  const look = useContext(Look)
  const [own, setOwn] = useState<Preference[K]>(undefined)
  useEffect(() => {
    if (!look) setOwn(read()[axis])
  }, [look, axis])
  const set = useCallback(
    (value: NonNullable<Preference[K]>) => {
      if (look) return look.set({ [axis]: value })
      write({ ...read(), [axis]: value })
      apply(current().pref)
      setOwn(value)
    },
    [look, axis],
  )
  return [look ? look.pref[axis] : own, set]
}

export function Corner({ help = [], language, currency, words }: CornerProps) {
  const w = { ...WORDS, ...words }
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('main')
  // Which row opened a list, so going back puts focus where it was.
  const [from, setFrom] = useState<View>('main')
  const [rtl, setRtl] = useState(false)
  const ground = useScheme()
  const [scheme, setTheme] = useAxis('theme')
  const theme = scheme ?? ground
  const [face, setFace] = useAxis('font')
  const [arabicFace, setArabic] = useAxis('arabic')
  const emit = useEmit()
  const trigger = useRef<HTMLElement | null>(null)
  const panel = useRef<HTMLElement | null>(null)

  // The faces are the library's own, like the theme, and drawn the way the
  // host's lists are. The Arabic row only for a page in Arabic script: anywhere
  // else it is a choice about letters the reader cannot see.
  const font: Setting = {
    value: face ?? 'default',
    options: (['default', 'system', 'serif', 'mono'] as const).map((code) => ({ code, label: w[code === 'default' ? 'sans' : code] })),
    onChange: (code) => setFace(code as NonNullable<Preference['font']>),
  }
  const lang = language?.value ?? (typeof document !== 'undefined' ? document.documentElement.lang : '')
  const script: Setting | undefined = arabic(lang)
    ? {
        value: arabicFace && arabicFace !== 'default' ? arabicFace : (companion() ?? ''),
        options: COMPANIONS.map((code) => ({ code, label: w[code] })),
        onChange: (code) => setArabic(code as NonNullable<Preference['arabic']>),
      }
    : undefined
  const settings: Record<Exclude<View, 'main'>, Setting | undefined> = { language, currency, font, arabic: script }

  // Focus follows the view: a list puts it on its search or its options, the
  // card on the row the list was opened from.
  useEffect(() => {
    if (!open) return
    const root = panel.current
    if (!root) return
    const target =
      view === 'main'
        ? from === 'main'
          ? null
          : root.querySelector<HTMLElement>(`[data-corner-row="${from}"]`)
        : root.querySelector<HTMLElement>('[data-corner-field]')
    target?.focus()
  }, [open, view, from])

  const toggle = (next: boolean) => {
    if (next) {
      // A right-to-left page mirrors the chevrons; read once, where the trigger sits.
      if (trigger.current && typeof getComputedStyle === 'function')
        setRtl(getComputedStyle(trigger.current).direction === 'rtl')
      setView('main')
      setFrom('main')
      emit({ component: 'Corner', action: 'open' })
    }
    setOpen(next)
  }

  const back = () => setView('main')

  const choose = (kind: Exclude<View, 'main'>, code: string) => {
    const s = settings[kind]
    if (!s) return
    if (code !== s.value) {
      emit({ component: 'Corner', action: 'change', id: kind, value: code })
      s.onChange(code)
    }
    back()
  }

  // The card's own arrows: up and down walk its stops. A radio group keeps its
  // arrows (they move the theme, as a radio group's should).
  const onCard = (e: { key?: string; target?: unknown; preventDefault?: () => void }) => {
    const key = e.key
    if (key !== 'ArrowDown' && key !== 'ArrowUp' && key !== 'Home' && key !== 'End') return
    const el = e.target as HTMLElement | null
    if (el?.closest?.('[role="radiogroup"]') && (key === 'ArrowDown' || key === 'ArrowUp')) return
    const stops = Array.from(panel.current?.querySelectorAll<HTMLElement>(STOPS) ?? [])
    if (!stops.length) return
    e.preventDefault?.()
    const at = stops.findIndex((s) => s === el || s.contains(el))
    const to =
      key === 'Home' ? 0 : key === 'End' ? stops.length - 1 : Math.max(0, Math.min(stops.length - 1, at + (key === 'ArrowDown' ? 1 : -1)))
    stops[to]?.focus()
  }

  const Forward = rtl ? ChevronLeft : ChevronRight

  return (
    <XStack
      {...slot('corner')}
      position="fixed"
      bottom={EDGE.bottom as never}
      insetInlineStart={EDGE.start as never}
      z={'var(--z-dock, 40)' as never}
    >
      <Popover open={open} onOpenChange={toggle} placement="top-start" allowFlip stayInFrame>
        <PopoverTrigger asChild>
          <XStack
            ref={trigger as never}
            {...slot('corner-trigger')}
            {...tip(w.open)}
            role="button"
            tabIndex={0}
            aria-label={w.open}
            aria-haspopup="dialog"
            aria-expanded={open}
            {...touch(32)}
            width={32}
            height={32}
            items="center"
            justify="center"
            rounded="$10"
            cursor="pointer"
            opacity={open ? 1 : 0.85}
            hoverStyle={{ opacity: 1 }}
            focusVisibleStyle={RING}
            onKeyDown={(e: any) => {
              if (e?.key !== 'Enter' && e?.key !== ' ') return
              e.preventDefault?.()
              toggle(!open)
            }}
          >
            <CircleHelp size={22} color="$background" fill="var(--foreground)" aria-hidden />
          </XStack>
        </PopoverTrigger>

        <PopoverContent
          ref={panel as never}
          {...slot('corner-card')}
          role="dialog"
          aria-label={w.open}
          solid
          sideOffset={6}
          width={288}
          maxW="calc(100vw - 20px)"
          maxH={'calc(100dvh - 72px)' as never}
          overflowY="auto"
          p="$3"
          gap="$2"
          items="stretch"
          elevation="$4"
          trapFocus
          onOpenAutoFocus={(e: Event) => {
            // The first thing in the card that does something, not its close button.
            e.preventDefault()
            panel.current?.querySelector<HTMLElement>(STOPS)?.focus()
          }}
          onCloseAutoFocus={(e: Event) => {
            e.preventDefault()
            trigger.current?.focus()
          }}
          onEscapeKeyDown={(e: { preventDefault: () => void }) => {
            // Escape in a list goes back to the card; on the card it closes.
            if (view === 'main') return
            e.preventDefault()
            back()
          }}
        >
          <Reflow on={view} />
          {view === 'main' ? (
            <YStack gap="$2" onKeyDown={onCard as never}>
              {help.length ? (
                <>
                  <Head title={w.help} close={w.close} onClose={() => toggle(false)} />
                  <YStack {...slot('corner-help')} role="list" aria-label={w.help}>
                    {help.map((link) => (
                      <Item key={link.href + link.label} link={link} leaving={w.leaves} onPress={() => emit({ component: 'Corner', action: 'click', id: link.label })} />
                    ))}
                  </YStack>
                  <YStack height={1} bg="$borderColor" my="$1" aria-hidden />
                </>
              ) : null}
              <Head title={w.preferences} close={help.length ? undefined : w.close} onClose={() => toggle(false)} />
              <XStack {...slot('corner-theme')} {...ROW} items="center" justify="space-between" gap="$3">
                <SizableText size="$3" color="$aside">
                  {w.theme}
                </SizableText>
                <Segmented<Scheme>
                  variant="track"
                  itemWidth="content"
                  name="theme"
                  aria-label={w.theme}
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'system', label: w.auto },
                    { value: 'light', label: '', 'aria-label': w.light, icon: <Sun size={14} color="$ink" aria-hidden /> },
                    { value: 'dark', label: '', 'aria-label': w.dark, icon: <Moon size={14} color="$ink" aria-hidden /> },
                  ]}
                />
              </XStack>
              {LISTS.map((kind) => {
                const s = settings[kind]
                if (!s) return null
                const chosen = s.options.find((o) => o.code === s.value)
                return (
                  <XStack
                    key={kind}
                    {...slot('corner-row')}
                    {...press(() => {
                      setFrom(kind)
                      setView(kind)
                    })}
                    data-corner-stop=""
                    data-corner-row={kind}
                    aria-haspopup="listbox"
                    {...ROW}
                    items="center"
                    gap="$3"
                    mx={-8}
                    px="$2"
                    rounded="$3"
                    cursor="pointer"
                    hoverStyle={{ bg: '$hover' }}
                    focusVisibleStyle={RING}
                  >
                    <SizableText size="$3" color="$aside" flex={1}>
                      {w[kind]}
                    </SizableText>
                    <SizableText
                      size="$3"
                      color="$ink"
                      fontWeight="600"
                      numberOfLines={1}
                      shrink={1}
                      {...(kind === 'language' ? { lang: s.value, dir: chosen?.dir } : null)}
                    >
                      {shown(s)}
                    </SizableText>
                    <Forward size={16} color="$hint" aria-hidden />
                  </XStack>
                )
              })}
            </YStack>
          ) : (
            <List
              key={view}
              kind={view}
              setting={settings[view] as Setting}
              title={w[view]}
              words={w}
              rtl={rtl}
              onBack={back}
              onChoose={(code) => choose(view, code)}
            />
          )}
        </PopoverContent>
      </Popover>
    </XStack>
  )
}

/**
 * Places the card again when it changes size. gui's popper re-measures when its
 * TRIGGER moves, never when the card does, so a card that grows into a list
 * keeps its old top and runs off the foot of the window. Inside the content,
 * so it reads the popper the content belongs to.
 */
function Reflow({ on }: { on: View }) {
  const { update } = usePopperContextSlow()
  useLayoutEffect(() => {
    update?.()
  }, [on, update])
  return null
}

/** A section's quiet title, and the card's close button when the section is first. */
function Head({ title, close, onClose }: { title: string; close?: string; onClose: () => void }) {
  return (
    <XStack items="center" justify="space-between" minH={28}>
      <SizableText size="$2" color="$hint" render="h2" m={0}>
        {title}
      </SizableText>
      {close ? <Icon label={close} onPress={onClose} glyph={<X size={18} color="$aside" aria-hidden />} /> : null}
    </XStack>
  )
}

/** An icon-only button: 28px drawn, 44 under a finger. */
function Icon({ label, glyph, onPress }: { label: string; glyph: ReactNode; onPress: () => void }) {
  return (
    <XStack
      {...press(onPress)}
      {...tip(label)}
      aria-label={label}
      {...touch(28)}
      width={28}
      height={28}
      marginInlineEnd={-6}
      items="center"
      justify="center"
      rounded="$10"
      cursor="pointer"
      hoverStyle={{ bg: '$hover' }}
      focusVisibleStyle={RING}
    >
      {glyph}
    </XStack>
  )
}

/** One help link. A link that leaves the site opens a new tab and says so, to the eye and to a screen reader. */
function Item({ link, leaving, onPress }: { link: Link; leaving: string; onPress: () => void }) {
  const out = typeof location !== 'undefined' && leaves(link.href, location.origin)
  return (
    <XStack role="listitem">
      <Anchor
        {...slot('corner-link')}
        data-corner-stop=""
        href={link.href}
        target={out ? '_blank' : undefined}
        rel={out ? 'noopener noreferrer' : undefined}
        aria-label={out ? `${link.label} (${leaving})` : undefined}
        onPress={onPress}
        display="flex"
        flexDirection="row"
        flex={1}
        items="center"
        gap="$2.5"
        {...ROW}
        mx={-8}
        px="$2"
        rounded="$3"
        textDecorationLine="none"
        color="$ink"
        hoverStyle={{ bg: '$hover' }}
        focusVisibleStyle={RING}
      >
        {link.icon ? (
          <XStack width={20} items="center" justify="center" aria-hidden>
            {link.icon}
          </XStack>
        ) : null}
        <SizableText size="$3" color="$ink" fontWeight="500">
          {link.label}
        </SizableText>
        {out ? <ExternalLink size={12} color="$hint" aria-hidden /> : null}
      </Anchor>
    </XStack>
  )
}

/**
 * A setting's options, in place of the card: back, the title, a search when the
 * list is long, then the options with a check on the current one.
 *
 * ARIA: the options are a listbox. With a search, the field is the combobox and
 * owns the cursor through `aria-activedescendant`, so focus never leaves it
 * while the arrows move; without one the listbox itself takes focus and does the
 * same. Enter or a press chooses.
 */
function List({
  kind,
  setting,
  title,
  words,
  rtl,
  onBack,
  onChoose,
}: {
  kind: Exclude<View, 'main'>
  setting: Setting
  title: string
  words: Words
  rtl: boolean
  onBack: () => void
  onChoose: (code: string) => void
}) {
  const [q, setQ] = useState('')
  const rows = find(setting.options, q)
  const [at, setAt] = useState(() => Math.max(0, rows.findIndex((o) => o.code === setting.value)))
  const id = useId()
  const listId = `${id}-list`
  const optionId = (i: number) => `${id}-opt-${i}`
  const searchable = setting.options.length > LONG
  const Back = rtl ? ChevronRight : ChevronLeft

  // A new search starts the cursor at the top.
  useEffect(() => {
    if (q) setAt(0)
  }, [q])

  // Keep the row under the cursor in view as it moves.
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.getElementById(optionId(at))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at])

  const onKey = (e: any) => {
    const key = e?.key as string
    if (MOVES.has(key as Move)) {
      if ((key === 'Home' || key === 'End') && q) return
      e.preventDefault?.()
      setAt(move(key as Move, at, rows.length))
      return
    }
    if (key === 'Enter' || (key === ' ' && !searchable)) {
      e.preventDefault?.()
      const o = rows[at]
      if (o) onChoose(o.code)
    }
  }

  const active = rows[at] ? optionId(at) : undefined

  return (
    <YStack gap="$2">
      <XStack items="center" gap="$1" minH={28}>
        <XStack marginInlineStart={-6}>
          <Icon label={words.back} onPress={onBack} glyph={<Back size={18} color="$aside" aria-hidden />} />
        </XStack>
        <SizableText size="$3" color="$ink" fontWeight="600" render="h2" m={0}>
          {title}
        </SizableText>
      </XStack>

      {searchable ? (
        <XStack
          {...slot('corner-search')}
          height={32}
          px="$2"
          gap="$1.5"
          items="center"
          rounded="$3"
          borderWidth={1}
          borderColor="$borderColor"
          bg="$background"
          focusWithinStyle={{ borderColor: '$outlineColor' }}
        >
          <Search size={14} color="$hint" aria-hidden />
          <GuiInput
            {...slot('corner-input')}
            data-corner-field=""
            unstyled
            flex={1}
            minW={0}
            height={30}
            p={0}
            borderWidth={0}
            bg="transparent"
            fontSize="$3"
            color="$ink"
            placeholderTextColor="$placeholderColor"
            placeholder={words.search}
            value={q}
            onChangeText={setQ}
            role="combobox"
            aria-label={`${words.search}: ${title}`}
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active}
            autoComplete="off"
            spellCheck={false}
            onKeyDown={onKey}
          />
        </XStack>
      ) : null}

      <YStack
        {...slot('corner-list')}
        id={listId}
        role="listbox"
        aria-label={title}
        {...(searchable
          ? null
          : { 'data-corner-field': '', tabIndex: 0, 'aria-activedescendant': active, onKeyDown: onKey, focusVisibleStyle: RING })}
        // A height, not a ceiling: a search that narrows the list leaves the card
        // where it is instead of shrinking it away from the trigger.
        height={'min(320px, calc(100dvh - 180px))' as never}
        overflowY="auto"
        mx={-4}
        px="$1"
        rounded="$3"
      >
        {rows.map((o: Option, i) => {
          const picked = o.code === setting.value
          return (
            <XStack
              key={o.code}
              {...slot('corner-option')}
              id={optionId(i)}
              role="option"
              aria-selected={picked}
              {...ROW}
              px="$2"
              gap="$2"
              items="center"
              rounded="$3"
              cursor="pointer"
              bg={i === at ? '$hover' : 'transparent'}
              onHoverIn={() => setAt(i)}
              onPress={() => onChoose(o.code)}
            >
              <YStack flex={1} minW={0}>
                {/* Hugs its text, so a name in another direction keeps the list's
                    start edge and only its own letters run the other way. */}
                <SizableText
                  size="$3"
                  color="$ink"
                  fontWeight={picked ? '600' : '400'}
                  numberOfLines={1}
                  self="flex-start"
                  maxW="100%"
                  {...(kind === 'language' ? { lang: o.code, dir: o.dir } : null)}
                >
                  {o.label}
                </SizableText>
              </YStack>
              {o.hint ? (
                <SizableText size="$2" color="$hint" numberOfLines={1} shrink={0}>
                  {o.hint}
                </SizableText>
              ) : null}
              <XStack width={16} items="center" justify="center" shrink={0} aria-hidden>
                {picked ? <Check size={16} color="$ink" /> : null}
              </XStack>
            </XStack>
          )
        })}
        {rows.length === 0 ? (
          <XStack {...ROW} px="$2" items="center" role="status">
            <SizableText size="$3" color="$hint">
              {words.none}
            </SizableText>
          </XStack>
        ) : null}
      </YStack>
    </YStack>
  )
}
