'use client'

/**
 * BranchSelect — which branch a run starts from, as a composer chip.
 *
 * A `ChipSelect` over branch names: the chosen branch pinned first with a
 * check, the rest as the host's loader pages them, and the search at the foot.
 * Like `RepoSelect` it knows no git host — the loader is the host's.
 */
import { GitBranch } from '@hanzogui/lucide-icons-2'
import { useCallback, type ReactNode } from 'react'

import { ChipSelect, type ChipPlacement } from './ChipSelect'
import type { ChipItem, ChipPage } from './chipSelect.logic'

/** A branch, as a host's API tends to answer it: a bare name, or a row carrying one. */
export type Branch = string | { name: string }

/** One page of branches. */
export type BranchLoad = (q: string, after?: string | null) => Promise<{ branches: Branch[]; next?: string | null }>

/** The name, whichever shape the row came in. */
export const branchName = (b: Branch): string => (typeof b === 'string' ? b : b.name)

export interface BranchSelectProps {
  /** The chosen branch. */
  value?: string | null
  onChange: (branch: string) => void
  load: BranchLoad
  /** Under the list — why a branch might be missing. */
  footer?: ReactNode
  placement?: ChipPlacement
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const item = (name: string): ChipItem => ({ id: name, label: name })

export function BranchSelect({
  value = null,
  onChange,
  load,
  footer,
  placement,
  disabled,
  open,
  onOpenChange,
}: BranchSelectProps) {
  const pages = useCallback(
    async (q: string, after?: string | null): Promise<ChipPage<ChipItem>> => {
      const page = await load(q, after)
      return { items: page.branches.map((b) => item(branchName(b))), next: page.next ?? null }
    },
    [load],
  )

  return (
    <ChipSelect<ChipItem>
      name="Branch"
      icon={<GitBranch size={12} color="$soft" />}
      label={value ?? 'Branch'}
      chosen={value ? item(value) : null}
      onChange={(i) => onChange(i.id)}
      load={pages}
      placeholder="Search branches…"
      empty="No branches match."
      footer={footer}
      placement={placement}
      disabled={disabled}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
