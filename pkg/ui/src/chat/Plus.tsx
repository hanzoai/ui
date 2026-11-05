'use client'

/**
 * The composer's `+`: rich creation & attachment tools (Add photos & files,
 * Add from library, Create image, Add browser tabs, Web search, Deep research,
 * Sketch, Thinking), followed by what the conversation works with — agents,
 * skills, connectors, a design system, plugins, a device — and Memory.
 */
import { SizableText, useMedia, XStack } from '@hanzo/gui'
import { phrase } from '@hanzo/i18n'
import { useI18n } from '@hanzo/i18n/react'
import {
  AppWindow,
  Blocks,
  Bot,
  Briefcase,
  Brain,
  Check,
  Folder,
  Globe,
  Image as ImageIcon,
  Monitor,
  Palette,
  Paperclip,
  PenTool,
  Plug,
  Plus as PlusIcon,
  ScrollText,
  Telescope,
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

import { GHOST, GLYPH, RING, STROKE } from './look'

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
  /** Add from library. */
  library?: () => void
  /** Create an image. */
  createImage?: () => void
  /** Add or ask about browser tabs. */
  browserTabs?: () => void
  /** Search the web. */
  webSearch?: () => void
  /** Draw and attach a sketch. */
  sketch?: () => void
  /** Toggle extended thinking. */
  thinking?: Switch
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

const ICON = 18

const SHELVES = [
  { key: 'agents', label: phrase('Agents'), note: phrase('Bring specialized agents into this chat'), search: phrase('Search agents'), reading: phrase('Reading agents'), none: phrase('No agents yet'), icon: <Bot size={ICON} /> },
  { key: 'skills', label: phrase('Skills'), note: phrase('Use workspace skills and workflows'), search: phrase('Search skills'), reading: phrase('Reading skills'), none: phrase('No skills yet'), icon: <ScrollText size={ICON} /> },
  { key: 'connectors', label: phrase('Connectors'), note: phrase('Sync connected knowledge sources'), search: phrase('Search connectors'), reading: phrase('Reading connectors'), none: phrase('No connectors yet'), icon: <Blocks size={ICON} /> },
  { key: 'design', label: phrase('Design system'), note: phrase('Apply brand tokens and UI components'), search: phrase('Search design system'), reading: phrase('Reading design system'), none: phrase('No design system yet'), icon: <Palette size={ICON} /> },
  { key: 'plugins', label: phrase('Plugins'), note: phrase('Connect external tools and APIs'), search: phrase('Search plugins'), reading: phrase('Reading plugins'), none: phrase('No plugins yet'), icon: <Plug size={ICON} /> },
  { key: 'devices', label: phrase('Devices'), note: phrase('Run on a connected machine'), search: phrase('Search devices'), reading: phrase('Reading devices'), none: phrase('No devices yet'), icon: <Monitor size={ICON} /> },
] as const

type Words = (typeof SHELVES)[number]

type Key = (typeof SHELVES)[number]['key']

/** A row's anatomy: its mark, its label, a dim note, and a check when it is on. */
function Line({ icon, label, note, on, tail }: { icon?: ReactNode; label: string; note?: string; on?: boolean; tail?: ReactNode }) {
  return (
    <XStack flex={1} minW={0} items="center" gap={10} py={1}>
      {icon ? (
        <XStack width={20} height={20} items="center" justify="center" shrink={0} aria-hidden>
          {icon}
        </XStack>
      ) : null}
      <SizableText fontSize={14} fontWeight="500" color="$ink" numberOfLines={1} shrink={0}>
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
      {on ? <Check size={16} color="var(--primary)" aria-hidden /> : null}
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
      {links.map((l) => (
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
  const [sub, setSub] = useState<string | null>(null)
  const close = () => setOpen(false)
  const shelves = useMemo(() => SHELVES.filter((s) => p[s.key as Key]), [p])
  const switches = [
    p.research
      ? {
          key: 'research',
          label: t('Research'),
          icon: <Telescope size={ICON} />,
          s: p.research,
        }
      : null,
    p.memory
      ? {
          key: 'memory',
          label: t('Memory'),
          icon: <Brain size={ICON} />,
          s: p.memory,
        }
      : null,
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
          <Line icon={<Paperclip size={ICON} />} label={t('Add photos & files')} note={t('Upload from computer')} tail={<DropdownMenuShortcut data-i18n-ltr>Ctrl+U</DropdownMenuShortcut>} />
        </DropdownMenuItem>
      ) : null}
      {p.library ? (
        <DropdownMenuItem
          data-slot="plus-library"
          onSelect={() => {
            close()
            p.library?.()
          }}
        >
          <Line icon={<Folder size={ICON} />} label={t('Add from library')} note={t('Browse and search your files')} />
        </DropdownMenuItem>
      ) : null}
      {p.createImage ? (
        <DropdownMenuItem
          data-slot="plus-create-image"
          onSelect={() => {
            close()
            p.createImage?.()
          }}
        >
          <Line icon={<ImageIcon size={ICON} color="var(--primary)" />} label={t('Create image')} note={t('Visualize anything')} />
        </DropdownMenuItem>
      ) : null}
      {p.browserTabs ? (
        <DropdownMenuItem
          data-slot="plus-browser-tabs"
          onSelect={() => {
            close()
            p.browserTabs?.()
          }}
        >
          <Line icon={<AppWindow size={ICON} color="var(--primary)" />} label={t('Add browser tabs')} note={t('Ask about your open tabs')} />
        </DropdownMenuItem>
      ) : null}
      {p.webSearch ? (
        <DropdownMenuItem
          data-slot="plus-web-search"
          onSelect={() => {
            close()
            p.webSearch?.()
          }}
        >
          <Line icon={<Globe size={ICON} color="var(--primary)" />} label={t('Web search')} note={t('Find real-time news and info')} />
        </DropdownMenuItem>
      ) : null}
      {p.research ? (
        <DropdownMenuItem
          preventCloseOnSelect
          onSelect={() => p.research!.set(!p.research!.on)}
          role="menuitemcheckbox"
          aria-checked={p.research.on}
          data-slot="plus-research"
        >
          <Line icon={<Telescope size={ICON} color="var(--primary)" />} label={t('Deep research')} note={t('Get a detailed report')} on={p.research.on} />
        </DropdownMenuItem>
      ) : null}
      {p.sketch ? (
        <DropdownMenuItem
          data-slot="plus-sketch"
          onSelect={() => {
            close()
            p.sketch?.()
          }}
        >
          <Line icon={<PenTool size={ICON} color="var(--primary)" />} label={t('Sketch')} note={t('Draw and attach an image')} />
        </DropdownMenuItem>
      ) : null}
      {p.thinking ? (
        <DropdownMenuItem
          preventCloseOnSelect
          onSelect={() => p.thinking!.set(!p.thinking!.on)}
          role="menuitemcheckbox"
          aria-checked={p.thinking.on}
          data-slot="plus-thinking"
        >
          <Line icon={<Brain size={ICON} />} label={t('Thinking')} note={t('For detailed answers')} on={p.thinking.on} />
        </DropdownMenuItem>
      ) : null}
      {shelves.length ? <DropdownMenuSeparator /> : null}
      {shelves.map((s) =>
        wide ? (
          <DropdownMenuSub key={s.key} open={sub === s.key} onOpenChange={(o: boolean) => setSub(o ? s.key : sub === s.key ? null : sub)}>
            <DropdownMenuSubTrigger data-slot={`plus-${s.key}`} onPress={() => setSub(s.key)}>
              <Line icon={s.icon} label={t(s.label)} note={t(s.note)} />
            </DropdownMenuSubTrigger>
            {sub === s.key ? (
              <DropdownMenuSubContent minW={240} maxW={360} maxH={420} pointerEvents="auto" style={{ overflowY: 'auto' }}>
                <Contents shelf={p[s.key as Key]!} words={s} close={close} />
              </DropdownMenuSubContent>
            ) : null}
          </DropdownMenuSub>
        ) : (
          <DropdownMenuItem key={s.key} page={s.key} data-slot={`plus-${s.key}`}>
            <Line icon={s.icon} label={t(s.label)} note={t(s.note)} />
          </DropdownMenuItem>
        )
      )}
      {p.memory ? <DropdownMenuSeparator /> : null}
      {p.memory ? (
        <DropdownMenuItem
          preventCloseOnSelect
          onSelect={() => p.memory!.set(!p.memory!.on)}
          role="menuitemcheckbox"
          aria-checked={p.memory.on}
          data-slot="plus-memory"
        >
          <Line icon={<Brain size={ICON} />} label={t('Memory')} note={t('Remember context across chats')} on={p.memory.on} />
        </DropdownMenuItem>
      ) : null}
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
          {...GHOST}
          {...(open ? { bg: '$hover', color: '$ink' } : null)}
          focusVisibleStyle={RING}
        >
          <PlusIcon size={GLYPH} strokeWidth={STROKE} color="currentColor" />
        </XStack>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" minW={360} maxW={440} data-slot="plus-menu">
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
