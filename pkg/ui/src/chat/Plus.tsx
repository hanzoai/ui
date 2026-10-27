'use client'

/**
 * The composer's `+`: files, then what the conversation works with — agents,
 * skills, connectors, a design system, plugins, a device — then the Research
 * and Memory switches. A row is drawn only when the surface hands it a shelf:
 * a shelf is what is there (`rows`), what picking one does, and the ways to
 * make, manage and find more. A row with nothing behind it is not drawn.
 *
 * On a laptop each shelf opens beside the menu; on a phone it is a page of the
 * same menu, with Back.
 *
 * The menu's own words are the reader's language (@hanzo/i18n `t`); what a
 * shelf holds — its rows, its links, its search and empty words — is the
 * surface's, drawn as given.
 */
import { SizableText, useMedia, XStack } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import {
  Blocks,
  Bot,
  Briefcase,
  Brain,
  Monitor,
  Palette,
  Paperclip,
  Plug,
  Plus as PlusIcon,
  ScrollText,
  Telescope,
  Check,
} from '@hanzogui/lucide-icons-2'
import {
  DropdownMenu,
  DropdownMenuBack,
  DropdownMenuContent,
  DropdownMenuEmpty,
  DropdownMenuItem,
  DropdownMenuLoading,
  DropdownMenuPage,
  DropdownMenuSearch,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../backends/gui'
import { useMemo, useState, type ReactNode } from 'react'

import { RING } from './ring'

/** One thing a shelf holds. `on` marks what the conversation already has. */
export interface Row {
  id: string
  label: string
  icon?: ReactNode
  /** A few dim words beside the label, where they help. */
  note?: string
  on?: boolean
}

export interface Link {
  label: string
  onPress: () => void
}

export interface Shelf {
  rows: Row[]
  pick: (id: string) => void
  loading?: boolean
  error?: string | null
  /** A search field over the rows, with this placeholder. */
  search?: string
  /** Said when there are no rows and nothing is loading. */
  empty?: string
  create?: Link
  manage?: Link
  browse?: Link
}

export interface Switch {
  on: boolean
  set: (on: boolean) => void
}

export interface PlusProps {
  /** Upload or add files (Ctrl+U). */
  upload?: () => void
  agents?: Shelf
  skills?: Shelf
  connectors?: Shelf
  design?: Shelf
  plugins?: Shelf
  devices?: Shelf
  research?: Switch
  memory?: Switch
  disabled?: boolean
  /** The button's box, px: the composer's control size (32 on a laptop, 36 on a phone). */
  size?: number
}

const ICON = 16

/**
 * The shelves, in the menu's order, with their names and marks, and the three
 * sentences a shelf says of itself: its search's name, while it reads, and
 * when it holds nothing. Whole sentences, so a language puts the noun where it goes.
 */
const SHELVES = [
  { key: 'agents', label: phrase('Agents'), search: phrase('Search agents'), reading: phrase('Reading agents'), none: phrase('No agents yet'), icon: <Bot size={ICON} /> },
  { key: 'skills', label: phrase('Skills'), search: phrase('Search skills'), reading: phrase('Reading skills'), none: phrase('No skills yet'), icon: <ScrollText size={ICON} /> },
  { key: 'connectors', label: phrase('Connectors'), search: phrase('Search connectors'), reading: phrase('Reading connectors'), none: phrase('No connectors yet'), icon: <Blocks size={ICON} /> },
  { key: 'design', label: phrase('Design system'), search: phrase('Search design system'), reading: phrase('Reading design system'), none: phrase('No design system yet'), icon: <Palette size={ICON} /> },
  { key: 'plugins', label: phrase('Plugins'), search: phrase('Search plugins'), reading: phrase('Reading plugins'), none: phrase('No plugins yet'), icon: <Plug size={ICON} /> },
  { key: 'devices', label: phrase('Devices'), search: phrase('Search devices'), reading: phrase('Reading devices'), none: phrase('No devices yet'), icon: <Monitor size={ICON} /> },
] as const

type Words = (typeof SHELVES)[number]

type Key = (typeof SHELVES)[number]['key']

/** A row's anatomy: its mark, its label, a dim note, and a check when it is on. */
function Line({ icon, label, note, on, tail }: { icon?: ReactNode; label: string; note?: string; on?: boolean; tail?: ReactNode }) {
  return (
    <XStack flex={1} minW={0} items="center" gap={10}>
      {icon ? (
        <XStack width={ICON} height={ICON} items="center" justify="center" shrink={0} aria-hidden>
          {icon}
        </XStack>
      ) : null}
      <SizableText fontSize={14} color="$ink" numberOfLines={1} shrink={0}>
        {label}
      </SizableText>
      {note ? (
        <SizableText fontSize={13} color="$hint" numberOfLines={1} flex={1} minW={0}>
          {note}
        </SizableText>
      ) : (
        <XStack flex={1} />
      )}
      {tail}
      {on ? <Check size={ICON} color="var(--primary)" aria-hidden /> : null}
    </XStack>
  )
}

/** A shelf's rows, its status, then its ways to more. */
function Contents({ shelf, words, close }: { shelf: Shelf; words: Words; close: () => void }) {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const needle = q.trim().toLowerCase()
  const rows = needle ? shelf.rows.filter((r) => `${r.label} ${r.note ?? ''}`.toLowerCase().includes(needle)) : shelf.rows
  const links = [shelf.create, shelf.manage, shelf.browse].filter((l): l is Link => Boolean(l))
  return (
    <>
      {shelf.search ? <DropdownMenuSearch value={q} onValueChange={setQ} placeholder={shelf.search} aria-label={t(words.search)} /> : null}
      {shelf.loading && !shelf.rows.length ? <DropdownMenuLoading>{t(words.reading)}</DropdownMenuLoading> : null}
      {shelf.error ? <DropdownMenuEmpty>{shelf.error}</DropdownMenuEmpty> : null}
      {!shelf.loading && !shelf.error && !rows.length ? <DropdownMenuEmpty>{needle ? t('Nothing matches') : (shelf.empty ?? t(words.none))}</DropdownMenuEmpty> : null}
      {rows.map((r) => (
        <DropdownMenuItem key={r.id} preventCloseOnSelect onSelect={() => shelf.pick(r.id)} aria-checked={r.on ?? false} data-slot="plus-row">
          <Line icon={r.icon} label={r.label} note={r.note} on={r.on} />
        </DropdownMenuItem>
      ))}
      {links.length ? <DropdownMenuSeparator /> : null}
      {links.map((l, i) => (
        <DropdownMenuItem
          key={l.label}
          onSelect={() => {
            close()
            l.onPress()
          }}
        >
          <Line icon={l === shelf.manage ? <Briefcase size={ICON} /> : <PlusIcon size={ICON} />} label={l.label} />
        </DropdownMenuItem>
      ))}
    </>
  )
}

/** The `+` and its menu. */
export function Plus(p: PlusProps) {
  const { t } = useI18n()
  const media = useMedia()
  const wide = media.sm
  const [open, setOpen] = useState(false)
  // The shelf open beside the menu.
  const [sub, setSub] = useState<string | null>(null)
  const close = () => setOpen(false)
  const shelves = useMemo(() => SHELVES.filter((s) => p[s.key as Key]), [p])
  const switches = [
    p.research ? { key: 'research', label: t('Research'), icon: <Telescope size={ICON} />, s: p.research } : null,
    p.memory ? { key: 'memory', label: t('Memory'), icon: <Brain size={ICON} />, s: p.memory } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null)

  const main = (
    <>
      {p.upload ? (
        <DropdownMenuItem
          data-slot="plus-upload"
          onSelect={() => {
            close()
            p.upload?.()
          }}
        >
          <Line icon={<Paperclip size={ICON} />} label={t('Upload or add files')} tail={<DropdownMenuShortcut data-i18n-ltr>Ctrl+U</DropdownMenuShortcut>} />
        </DropdownMenuItem>
      ) : null}
      {p.upload && shelves.length ? <DropdownMenuSeparator /> : null}
      {shelves.map((s) =>
        wide ? (
          <DropdownMenuSub key={s.key} open={sub === s.key} onOpenChange={(o) => setSub(o ? s.key : sub === s.key ? null : sub)}>
            <DropdownMenuSubTrigger data-slot={`plus-${s.key}`} onPress={() => setSub(s.key)}>
              <Line icon={s.icon} label={t(s.label)} />
            </DropdownMenuSubTrigger>
            {/* Drawn only while open: a closed shelf stays laid out under the menu, and its rows would take its clicks. */}
            {sub === s.key ? (
            <DropdownMenuSubContent minW={200} maxW={340} maxH={420} pointerEvents="auto" style={{ overflowY: "auto" }}>
              <Contents shelf={p[s.key as Key]!} words={s} close={close} />
            </DropdownMenuSubContent>
            ) : null}
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem key={s.key} page={s.key} data-slot={`plus-${s.key}`}>
            <Line icon={s.icon} label={t(s.label)} />
          </DropdownMenuItem>
        ),
      )}
      {switches.length && (p.upload || shelves.length) ? <DropdownMenuSeparator /> : null}
      {switches.map((w) => (
        <DropdownMenuItem key={w.key} preventCloseOnSelect onSelect={() => w.s.set(!w.s.on)} role={'menuitemcheckbox' as never} aria-checked={w.s.on} data-slot={`plus-${w.key}`}>
          <Line icon={w.icon} label={w.label} on={w.s.on} />
        </DropdownMenuItem>
      ))}
    </>
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} {...(wide ? null : { defaultPage: 'main' })}>
      <DropdownMenuTrigger asChild disabled={p.disabled}>
        <XStack
          render="button"
          data-slot="plus"
          aria-label={t('Add files, agents, skills and more')}
          width={p.size ?? 36}
          height={p.size ?? 36}
          rounded={999}
          items="center"
          justify="center"
          shrink={0}
          cursor={p.disabled ? 'default' : 'pointer'}
          opacity={p.disabled ? 0.4 : 1}
          bg={open ? '$hover' : 'transparent'}
          hoverStyle={{ bg: '$hover' }}
          focusVisibleStyle={RING}
        >
          <PlusIcon size={18} color="$ink" />
        </XStack>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" minW={240} data-slot="plus-menu">
        {wide ? (
          main
        ) : (
          <>
            <DropdownMenuPage id="main">{main}</DropdownMenuPage>
            {shelves.map((s) => (
              <DropdownMenuPage key={s.key} id={s.key}>
                <DropdownMenuBack>{t(s.label)}</DropdownMenuBack>
                <Contents shelf={p[s.key as Key]!} words={s} close={close} />
              </DropdownMenuPage>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
