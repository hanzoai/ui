'use client'

import { useCallback, useState, type ReactNode } from 'react'
/**
 * RepoSelect — which repository a run works in, as a composer chip.
 *
 * A `ChipSelect` over `owner/name`, and nothing more: the rows come from the
 * host's loader, the troubleshooting link is the host's, and the "connect"
 * prompt is the host's to show. There is no git host baked in here — the same
 * chip lists GitHub, a forge, or anything that can answer "repositories
 * matching this, after that cursor".
 *
 * The chip shows the short name (`cloud`), the list shows the whole address
 * (`hanzo-inc/cloud`), because on the chip the context is already the
 * composer and in the list two owners can share a name.
 */
import { SizableText, YStack } from '@hanzo/gui'
import { Code, Lock } from '@hanzogui/lucide-icons-2'

import { useTranslate } from '../i18n/react'
import { ChipSelect, type ChipAction, type ChipPlacement, type ChipTab } from './ChipSelect'
import type { ChipItem, ChipPage } from './chipSelect.logic'

/** A repository, in the fields a chooser needs. Hosts pass their own rows. */
export interface Repo {
  owner: string
  name: string
  /** `owner/name`, when the host already has it. */
  full_name?: string
  private?: boolean
  default_branch?: string
  /** Where the host found it — the id of the tab that lists it. */
  source?: string
}

/** A repository as the list carries it: keyed by its address, labelled with it. */
export type RepoItem = ChipItem & { repo: Repo }

/** One page of repositories — the host's API, in the shape the chip reads. */
export type RepoLoad = (q: string, after?: string | null) => Promise<{ repos: Repo[]; next?: string | null }>

/** A link out of the panel: an address, or a press the host handles. */
export interface RepoLink {
  label: string
  href?: string
  onPress?: () => void
}

export interface RepoSelectProps {
  /** The chosen repository. */
  value?: Repo | null
  onChange: (repo: Repo) => void
  load: RepoLoad
  /** "Troubleshoot GitHub connection" — where to go when a repository is missing. */
  troubleshoot?: RepoLink
  /** Why the list is partial. Say it plainly; it is the first thing read under the list. */
  note?: string
  /** Shown above the list — e.g. a "Connect GitHub" button while nothing is connected. */
  connect?: ReactNode
  /** A second thing a row can do — "Add to project". */
  action?: {
    label: string
    onPress: (repo: Repo) => void
    when?: (repo: Repo) => boolean
  }
  /** Views over the list: the first shows every row, each other the rows whose `source` is its id. */
  tabs?: readonly ChipTab[]
  /** The chip's text with nothing chosen. */
  placeholder?: string
  placement?: ChipPlacement
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/** `owner/name`, from whichever the host has. */
export const address = (repo: Repo): string => repo.full_name || `${repo.owner}/${repo.name}`

const item = (repo: Repo): RepoItem => ({
  id: address(repo),
  label: address(repo),
  hint: repo.private ? 'Private' : undefined,
  icon: repo.private ? <Lock size={12} color="$soft" /> : <Code size={12} color="$soft" />,
  repo,
})

/**
 * Whether an address may be followed from here: a path on this origin, or
 * http(s). A `javascript:` or `data:` address handed in as "where to
 * troubleshoot" would run in the page, so it is not drawn as a link at all.
 */
export const followable = (href: string): boolean => !/[\s\u0000-\u001f\u007f\\]/.test(href) && (/^\/(?![\/\\])/.test(href) || /^https?:\/\//i.test(href))

/** A link in the footer: underlined, quiet, and a real control either way. */
export function FooterLink({ label, href, onPress }: RepoLink) {
  const link = href && followable(href) ? href : undefined
  if (!link && !onPress) return null
  return (
    <SizableText
      {...{ 'data-slot': 'chip-select-link' }}
      size="$1"
      color="$soft"
      textDecorationLine="underline"
      cursor="pointer"
      hoverStyle={{ color: '$ink' }}
      {...(link
        ? // A real anchor: it opens in a new tab on a middle click, it is
          // announced as a link, and Enter follows it with no handler here.
          { render: 'a', href: link, onPress }
        : {
            role: 'link',
            tabIndex: 0,
            onPress,
            onKeyDown: (e: any) => {
              if (e?.key !== 'Enter') return
              e.preventDefault?.()
              onPress?.()
            },
          })}
    >
      {label}
    </SizableText>
  )
}

export function RepoSelect({ value = null, onChange, load, troubleshoot, note, connect, action, tabs, placeholder = 'Repository', placement, disabled, open, onOpenChange }: RepoSelectProps) {
  const tr = useTranslate()
  const [tab, setTab] = useState(tabs?.[0]?.id)
  const every = !tabs?.length || tab === tabs[0]!.id
  const pages = useCallback(
    async (q: string, after?: string | null): Promise<ChipPage<RepoItem>> => {
      const page = await load(q, after)
      const repos = every ? page.repos : page.repos.filter((r) => r.source === tab)
      return { items: repos.map(item), next: page.next ?? null }
    },
    [load, every, tab]
  )

  const act: ChipAction<RepoItem> | undefined = action
    ? {
        label: action.label,
        onPress: (i) => action.onPress(i.repo),
        when: action.when ? (i) => action.when!(i.repo) : undefined,
      }
    : undefined

  return (
    <ChipSelect<RepoItem>
      name="Repository"
      icon={<Code size={12} color="$soft" />}
      label={value ? value.name : placeholder}
      // On another tab the chosen row is not pinned: the tab lists what it says, and the check is on the tab the repository belongs to.
      chosen={value && (every || value.source === tab) ? item(value) : null}
      onChange={(i) => onChange(i.repo)}
      load={pages}
      placeholder={tr('Search repositories…')}
      empty="No repositories match."
      cta={connect}
      action={act}
      tabs={tabs}
      tab={tab}
      onTab={setTab}
      placement={placement}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
      footer={
        note || troubleshoot ? (
          <YStack gap="$0.5">
            {note ? (
              <SizableText size="$1" color="$soft">
                {note}
              </SizableText>
            ) : null}
            {troubleshoot ? <FooterLink {...troubleshoot} /> : null}
          </YStack>
        ) : undefined
      }
    />
  )
}
