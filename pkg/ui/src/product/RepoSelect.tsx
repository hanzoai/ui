'use client'

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
import { Code } from '@hanzogui/lucide-icons-2'
import { useCallback, type ReactNode } from 'react'

import { ChipSelect, type ChipAction, type ChipPlacement } from './ChipSelect'
import type { ChipItem, ChipPage } from './chipSelect.logic'

/** A repository, in the fields a chooser needs. Hosts pass their own rows. */
export interface Repo {
  owner: string
  name: string
  /** `owner/name`, when the host already has it. */
  full_name?: string
  private?: boolean
  default_branch?: string
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
  action?: { label: string; onPress: (repo: Repo) => void; when?: (repo: Repo) => boolean }
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
  hint: repo.private ? 'private' : undefined,
  repo,
})

/**
 * Whether an address may be followed from here: a path on this origin, or
 * http(s). A `javascript:` or `data:` address handed in as "where to
 * troubleshoot" would run in the page, so it is not drawn as a link at all.
 */
export const followable = (href: string): boolean =>
  /^\/(?!\/)/.test(href) || /^https?:\/\//i.test(href)

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

export function RepoSelect({
  value = null,
  onChange,
  load,
  troubleshoot,
  note = 'Not all repositories are shown. Type to search.',
  connect,
  action,
  placeholder = 'Repository',
  placement,
  disabled,
  open,
  onOpenChange,
}: RepoSelectProps) {
  const pages = useCallback(
    async (q: string, after?: string | null): Promise<ChipPage<RepoItem>> => {
      const page = await load(q, after)
      return { items: page.repos.map(item), next: page.next ?? null }
    },
    [load],
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
      chosen={value ? item(value) : null}
      onChange={(i) => onChange(i.repo)}
      load={pages}
      placeholder="Search repositories…"
      empty="No repositories match."
      cta={connect}
      action={act}
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
