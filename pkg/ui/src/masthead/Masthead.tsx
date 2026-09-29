'use client'

import { Fragment, useCallback, useEffect, useRef, useState, type PointerEvent as Pointer } from 'react'
import { HanzoCommandPalette, HanzoIdentity, HanzoWordmark, MARKS, type GlyphName, type HanzoCommandEntry } from '@hanzogui/shell'
import { ACCOUNT, COMPANY, LOGIN, MENUS, OPEN, TRY, at, away, type Link, type Menu } from './nav'

/**
 * hanzo.ai's header: one nav tree (`./nav`) for the bar and the phone sheet.
 *
 * The bar is `@hanzogui/shell`'s vocabulary — its marks, its wordmark, its ⌘K
 * palette and its account menu — laid out the way hanzo.ai reads: the wordmark
 * opens the company, the five menus follow with a mark before each label,
 * search closes the row, and Log in ▾ and Try Hanzo stand at the far end.
 *
 * Styled by `@hanzo/ui/masthead.css`, which the host imports once.
 */

/** Who is signed in, as the account menu draws them. */
export interface Person {
  name: string
  email?: string
  avatar?: string
}

export interface MastheadProps {
  /** The name in the corner: `Hanzo AI` on hanzo.ai, `Hanzo Blog` on the blog. */
  label?: string
  /** Where the name goes. */
  home?: string
  /**
   * The host the tree's paths are pages on. Empty on hanzo.ai itself; any other
   * site passes `https://hanzo.ai`, and a row keeps its look while it goes there.
   */
  origin?: string
  /** The signed-in reader. Absent, the bar offers Log in ▾ and Try Hanzo. */
  person?: Person | null
  onSignOut?: () => void
  /** What ⌘K finds. */
  commands?: HanzoCommandEntry[]
  /** A question typed into ⌘K. */
  onAsk?: (question: string) => void
}

/** A menu stays open this long after the pointer leaves, so a diagonal path to a row keeps it. */
const GRACE = 160
/** And opens after the pointer rests this long, so crossing the bar opens nothing. */
const REST = 70

export function Mark({ name }: { name: GlyphName }) {
  const Glyph = MARKS[name]
  return (
    <span className="hz-mark" aria-hidden="true">
      <Glyph size={16} />
    </span>
  )
}

export function Chevron() {
  return (
    <svg className="hz-chevron" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** ↗ — the shell's outbound arrow, riding the label's size and ink. */
export function Out() {
  return (
    <svg className="hz-out" width="0.75em" height="0.75em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

/**
 * A row: the label, and ↗ with a new tab when it leaves hanzo.ai. Whether it
 * leaves is read from the tree, so a row looks the same on every host.
 */
export function Row({ link, origin = '', className, onClick }: { link: Link; origin?: string; className?: string; onClick?: () => void }) {
  const out = away(link.href)
  return (
    <a
      href={at(link.href, origin)}
      className={className}
      target={out ? '_blank' : undefined}
      rel={out ? 'noreferrer' : undefined}
      onClick={onClick}
    >
      {link.label}
      {out ? <Out /> : null}
    </a>
  )
}

/** A menu's columns: the lead column in display type, the rest as lists. */
function Columns({ menu, origin, onPick }: { menu: Menu; origin: string; onPick: () => void }) {
  return (
    <div className="hz-columns">
      {menu.groups.map((group) => (
        <div key={group.title} className="hz-column" data-lead={group.lead ? '' : undefined}>
          <p className="hz-column-title">{group.title}</p>
          {group.links.map((link) => (
            <Row key={link.label} link={link} origin={origin} onClick={onPick} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function Masthead({ label = 'Hanzo AI', home = '/', origin = '', person, onSignOut, commands = [], onAsk }: MastheadProps) {
  const [open, setOpen] = useState<string | null>(null)
  const [sheet, setSheet] = useState(false)
  const [search, setSearch] = useState(false)
  const [grounded, setGrounded] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pinned = useRef(false)
  const bar = useRef<HTMLElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

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
        bar.current?.querySelector<HTMLElement>(`[aria-controls="menu-${open}"]`)?.focus()
        close()
      }
      if (sheet) {
        setSheet(false)
        toggle.current?.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [open, sheet, close])

  // A press anywhere outside the bar closes an open menu.
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) close()
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

  const rest = (id: string) => (e: Pointer) => {
    if (e.pointerType !== 'mouse') return
    clearTimeout(timer.current)
    if (open === id) return
    if (open) {
      pinned.current = false
      setOpen(id)
    } else timer.current = setTimeout(() => setOpen(id), REST)
  }
  const leave = (e: Pointer) => {
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
  const step = (id: string) => (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown') return
    e.preventDefault()
    pinned.current = true
    setOpen(id)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`#menu-${id} a`)?.focus())
  }
  // Focus that leaves a menu closes it.
  const blur = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close()
  }
  const find = () => {
    close()
    setSheet(false)
    setSearch(true)
  }

  const menu = (item: Menu, trigger: React.ReactNode) => (
    <div className="hz-menu" onPointerEnter={rest(item.id)} onPointerLeave={leave} onBlur={blur}>
      {trigger}
      {open === item.id ? (
        <div id={`menu-${item.id}`} className="hz-plane" role="group" aria-label={item.label}>
          <Columns menu={item} origin={origin} onPick={close} />
        </div>
      ) : null}
    </div>
  )

  const trigger = (item: Menu) => (
    <button
      type="button"
      className="hz-trigger"
      aria-expanded={open === item.id}
      aria-controls={`menu-${item.id}`}
      onClick={press(item.id)}
      onKeyDown={step(item.id)}
    >
      <Mark name={item.glyph} />
      {item.label}
      <Chevron />
    </button>
  )

  return (
    <>
      <header ref={bar} className="hz-masthead" data-grounded={grounded || open || sheet ? '' : undefined}>
        {menu(
          COMPANY,
          <span className="hz-brand">
            <a href={home} aria-label={`${label} home`} className="hz-wordmark">
              <HanzoWordmark label={label} size={22} />
            </a>
            <button
              type="button"
              className="hz-company"
              aria-label="Company"
              aria-expanded={open === COMPANY.id}
              aria-controls={`menu-${COMPANY.id}`}
              onClick={press(COMPANY.id)}
              onKeyDown={step(COMPANY.id)}
            >
              <Chevron />
            </button>
          </span>,
        )}
        <nav className="hz-nav" aria-label="Main">
          {MENUS.map((item) => (
            <Fragment key={item.id}>{menu(item, trigger(item))}</Fragment>
          ))}
        </nav>
        {/* The page recedes under an open plane, and a press on it closes the plane. */}
        {open && open !== 'login' ? <div className="hz-veil" aria-hidden="true" onClick={close} /> : null}
        <button type="button" className="hz-find" aria-label="Search Hanzo or ask AI" onClick={find}>
          <MARKS.search size={16} />
        </button>
        <div className="hz-end">
          {person ? (
            <HanzoIdentity auth={{ user: person, onSignOut, items: [{ id: 'account', label: ACCOUNT.label, href: at(ACCOUNT.href, origin) }] }} />
          ) : (
            <div className="hz-menu hz-login" onPointerEnter={rest('login')} onPointerLeave={leave} onBlur={blur}>
              <button
                type="button"
                className="hz-trigger"
                aria-expanded={open === 'login'}
                aria-controls="menu-login"
                onClick={press('login')}
                onKeyDown={step('login')}
              >
                Log in
                <Chevron />
              </button>
              {open === 'login' ? (
                <div id="menu-login" className="hz-card" role="group" aria-label="Log in">
                  {LOGIN.map((link) => (
                    <a key={link.label} href={at(link.href, origin)} target="_blank" rel="noreferrer" onClick={close}>
                      <span>{link.label}</span>
                      <small>{link.hint}</small>
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <Row link={person ? OPEN : TRY} origin={origin} className="hz-try" />
          <button
            ref={toggle}
            type="button"
            className="hz-toggle"
            aria-label={sheet ? 'Close menu' : 'Open menu'}
            aria-expanded={sheet}
            aria-controls="sheet"
            onClick={() => {
              close()
              setSheet((s) => !s)
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d={sheet ? 'M6 6l12 12M18 6L6 18' : 'M3 9h18M3 15h18'} />
            </svg>
          </button>
        </div>
      </header>
      {sheet ? <Sheet signedIn={Boolean(person)} origin={origin} onClose={() => setSheet(false)} /> : null}
      <HanzoCommandPalette commands={commands} open={search} onOpenChange={setSearch} onAsk={onAsk} />
    </>
  )
}

/**
 * The phone's menu: the whole tree, one section open at a time, then the two
 * doors. A `<details>` per section, so it opens with no script and a tap never
 * waits on one.
 */
function Sheet({ signedIn, origin, onClose }: { signedIn: boolean; origin: string; onClose: () => void }) {
  const first = useRef<HTMLElement>(null)
  useEffect(() => first.current?.focus(), [])
  return (
    <div id="sheet" className="hz-sheet" role="dialog" aria-modal="true" aria-label="Menu">
      <nav aria-label="Main">
        {[COMPANY, ...MENUS].map((item, i) => (
          <details key={item.id} name="sheet">
            <summary ref={i === 0 ? first : undefined}>
              <Mark name={item.glyph} />
              {item.label}
              <Chevron />
            </summary>
            {item.groups.map((group) => (
              <div key={group.title} className="hz-column" data-lead={group.lead ? '' : undefined}>
                <p className="hz-column-title">{group.title}</p>
                {group.links.map((link) => (
                  <Row key={link.label} link={link} origin={origin} onClick={onClose} />
                ))}
              </div>
            ))}
          </details>
        ))}
      </nav>
      <div className="hz-doors">
        {signedIn ? (
          <a href={at(ACCOUNT.href, origin)} className="hz-door">
            {ACCOUNT.label}
          </a>
        ) : (
          <>
            <p className="hz-column-title">Log in</p>
            {LOGIN.map((link) => (
              <Row key={link.label} link={link} origin={origin} className="hz-door" onClick={onClose} />
            ))}
          </>
        )}
        <Row link={signedIn ? OPEN : TRY} origin={origin} className="hz-try" onClick={onClose} />
      </div>
    </div>
  )
}
