'use client'

/**
 * AgentBoard — the agents working view: who is running, on what, and where.
 *
 * A run is a SESSION, and a session that spawned others is the root of a tree.
 * A flat list draws a fan-out as N unrelated rows and loses the one fact worth
 * seeing — that they are one piece of work — so the board nests children under
 * their root and a collapsed root says how many it is hiding.
 *
 * Grouped by PROJECT, because that is the question a person opens this with:
 * not "what is running" but "what is running on the thing I am working on".
 * A session with no project groups under `ungrouped`, named rather than hidden.
 *
 * Presentational. It takes rows and raises `onOpen`; it does no fetching, no
 * grouping policy beyond the field it is given, and no status derivation. The
 * surface holds the data — `@hanzo/ai`'s `sessions.list` / `sessions.tree` and
 * the stream — so the same board serves hanzo.ai, a channel workspace, or
 * anything else that can answer with rows.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, ChevronRight } from '@hanzogui/lucide-icons-2'
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>
type Scroll = Omit<ComponentProps<typeof ScrollView>, 'children'>

/** The states a run can be in. `unknown` is honest about a value we do not model. */
export type RunStatus = 'running' | 'paused' | 'done' | 'error' | 'unknown'

/**
 * One run.
 *
 * `children` is the fan-out. It is the SHAPE the board draws, so a caller with
 * a flat list plus parent ids builds the tree before handing it over — `nest()`
 * below does exactly that and is exported for the purpose.
 */
export interface Run {
  id: string
  /** The agent doing the work. */
  agent: string
  status: RunStatus
  /** What it is doing right now — one line, already trimmed by the caller. */
  doing?: string
  /** Where it is running: a machine, a sandbox, a registered target. */
  target?: string
  /** The project this run belongs to. Absent groups under "Other work". */
  project?: string
  /** Sub-agents this run spawned. */
  children?: Run[]
}

const TONE = {
  running: '$green10',
  paused: '$yellow10',
  done: '$color10',
  error: '$red10',
  unknown: '$color8',
} as const satisfies Record<RunStatus, string>

/** The label a status wears. Separate from the colour so neither is guessed. */
const SAYS: Record<RunStatus, string> = {
  running: 'running',
  paused: 'paused',
  done: 'done',
  error: 'error',
  unknown: '—',
}

function Dot({ status }: { status: RunStatus }) {
  return (
    <YStack
      width={7}
      height={7}
      rounded={9999}
      bg={TONE[status]}
      shrink={0}
      // A colour alone is not a state. The title is what a screen reader and a
      // reader who cannot separate red from green both get.
      aria-label={SAYS[status]}
    />
  )
}

export interface RunRowProps extends Col {
  run: Run
  depth?: number
  active?: boolean
  onOpen?: (id: string) => void
  /** Rendered at the end of the row — a watch affordance, a menu, a count. */
  trailing?: ReactNode
}

/**
 * One row, and its children under it.
 *
 * Expansion is per-row local state: a board is read top-down and a caller that
 * wanted to persist which roots are open would be holding UI state for a list
 * it does not own. A root with children opens by default, because the fan-out
 * is the thing worth seeing.
 */
export function RunRow({ run, depth = 0, active = false, onOpen, trailing, ...rest }: RunRowProps) {
  const kids = run.children ?? []
  const [open, setOpen] = useState(true)

  return (
    <YStack {...slot('run-row')} {...rest}>
      <XStack
        items="center"
        gap="$2"
        px="$2"
        py="$1.5"
        rounded="$3"
        pl={8 + depth * 16}
        cursor="pointer"
        role="button"
        tabIndex={0}
        aria-current={active ? 'true' : undefined}
        bg={active ? '$edge' : undefined}
        hoverStyle={{ bg: active ? '$edge' : '$hover' }}
        pressStyle={{ bg: '$raised' }}
        onPress={() => onOpen?.(run.id)}
      >
        {kids.length ? (
          <XStack
            width={16}
            height={16}
            items="center"
            justify="center"
            shrink={0}
            role="button"
            tabIndex={0}
            aria-expanded={open}
            aria-label={open ? 'Hide sub-agents' : 'Show sub-agents'}
            onPress={(e: { stopPropagation?: () => void }) => {
              e.stopPropagation?.()
              setOpen((v) => !v)
            }}
          >
            {open ? <ChevronDown size={13} opacity={0.6} /> : <ChevronRight size={13} opacity={0.6} />}
          </XStack>
        ) : (
          <YStack width={16} shrink={0} />
        )}

        <Dot status={run.status} />

        <SizableText size="$2" numberOfLines={1} shrink={1} color={active ? '$color' : '$quiet'}>
          {run.agent}
        </SizableText>

        {run.doing ? (
          <SizableText size="$1" numberOfLines={1} flex={1} color="$soft">
            {run.doing}
          </SizableText>
        ) : (
          <XStack flex={1} />
        )}

        {/* Collapsed, the count is the only thing saying a fan-out is here. */}
        {kids.length && !open ? (
          <SizableText size="$1" color="$soft">
            {kids.length} sub-agent{kids.length === 1 ? '' : 's'}
          </SizableText>
        ) : null}

        {run.target ? (
          <SizableText size="$1" color="$soft" numberOfLines={1}>
            {run.target}
          </SizableText>
        ) : null}

        {trailing}
      </XStack>

      {open && kids.length
        ? kids.map((kid) => (
            <RunRow key={kid.id} run={kid} depth={depth + 1} onOpen={onOpen} />
          ))
        : null}
    </YStack>
  )
}

export interface AgentBoardProps extends Scroll {
  /** Roots. Children ride on each root's `children`. */
  runs: Run[]
  /** The run currently open, so the board can mark it. */
  active?: string
  onOpen?: (id: string) => void
  /** What to draw when there is nothing running. */
  empty?: ReactNode
  /** Heading for runs carrying no project. */
  otherLabel?: string
}

/**
 * The board.
 *
 * Groups are ordered by name with the un-projected group LAST, so the answer to
 * "what is running on my project" is never below a pile of stray runs.
 */
export function AgentBoard({
  runs,
  active,
  onOpen,
  empty,
  otherLabel = 'Other work',
  ...rest
}: AgentBoardProps) {
  const groups = useMemo(() => group(runs, otherLabel), [runs, otherLabel])

  if (!runs.length) {
    return (
      <YStack {...slot('agent-board')} p="$4" {...(rest as Col)}>
        {empty ?? (
          <SizableText size="$2" color="$soft">
            Nothing running.
          </SizableText>
        )}
      </YStack>
    )
  }

  return (
    <ScrollView {...slot('agent-board')} flex={1} showsVerticalScrollIndicator={false} {...rest}>
      <YStack gap="$1" p="$2">
        {groups.map(([project, rows]) => (
          <YStack key={project} mt="$2" gap="$0.5">
            <SizableText size="$1" px="$2" py="$1" color="$soft" fontWeight="500">
              {project}
            </SizableText>
            {rows.map((run) => (
              <RunRow key={run.id} run={run} active={run.id === active} onOpen={onOpen} />
            ))}
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  )
}

/** Group roots by project, un-projected last. */
function group(runs: Run[], otherLabel: string): [string, Run[]][] {
  const by = new Map<string, Run[]>()
  for (const run of runs) {
    const key = run.project?.trim() || otherLabel
    const rows = by.get(key)
    if (rows) rows.push(run)
    else by.set(key, [run])
  }
  return [...by.entries()].sort(([a], [b]) =>
    a === otherLabel ? 1 : b === otherLabel ? -1 : a.localeCompare(b),
  )
}

/**
 * Build the tree a board draws from the flat list an API answers with.
 *
 * A session names its root rather than its parent, so a fan-out is TWO levels
 * and not N: every non-root hangs off its root. A row whose root is not in the
 * list is treated as a root itself — otherwise a filtered page silently drops
 * work, which is the one thing a board must not do.
 */
export function nest<T extends { id: string; rootId?: string }>(
  rows: T[],
): (T & { children: (T & { children: never[] })[] })[] {
  const roots = new Map<string, T & { children: (T & { children: never[] })[] }>()
  const orphans: T[] = []

  for (const row of rows) {
    if (!row.rootId || row.rootId === row.id) roots.set(row.id, { ...row, children: [] })
  }
  for (const row of rows) {
    if (!row.rootId || row.rootId === row.id) continue
    const root = roots.get(row.rootId)
    if (root) root.children.push({ ...row, children: [] as never[] })
    else orphans.push(row)
  }
  for (const row of orphans) roots.set(row.id, { ...row, children: [] })

  return [...roots.values()]
}
