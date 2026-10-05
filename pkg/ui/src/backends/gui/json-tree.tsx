'use client'

/**
 * JsonTree — a JSON value drawn as a tree a reader can open and close: one row
 * per key or element, objects and arrays behind a disclosure that says how
 * many children they hold, and a header with a filter, Expand all, Collapse all
 * and Copy.
 *
 * The first `depth` levels open on first paint. A row is a button (Enter and
 * Space toggle it, `aria-expanded` says which way), so the tree reads with a
 * keyboard and a screen reader as well as a pointer. Keys and values take the
 * code theme's colours (`code-theme.ts`), the same theme keys `CodeEditor`
 * paints with, and a count reads as a comment. A long value wraps anywhere, so
 * a hash never widens the page.
 *
 * Filter. What is typed keeps every row whose key, dotted path
 * (`answers.team.probabilities`) or value contains it, with the rows above it,
 * and opens them; a branch that matches keeps everything under it. Clearing the
 * filter hands back the tree as it was opened before.
 *
 * Height. The tree is as tall as its rows up to `maxHeight`, then scrolls.
 * `resizable` puts a `Grip` on its bottom edge: a drag or ArrowUp / ArrowDown
 * sets a height of the reader's own and a double-click hands it back;
 * `onResize` hears each one and `defaultHeight` starts from it. Copy writes the whole
 * value, whatever is open or filtered. Built from gui primitives only, so it
 * renders wherever gui does.
 */
import { SizableText, XStack, YStack, type YStackProps } from '@hanzo/gui'
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Copy,
} from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { Button } from './button'
import { Grip } from './grip'
import { Input } from './input'
import { slot } from './slot'
import { toast } from './toaster'

/** The tallest a drag makes the tree, px: a ceiling that is not one. */
const CEILING = 4096

/** Indent per level, in px. */
const INDENT = 16

type Branch = { kind: 'object' | 'array'; entries: [string, unknown][] }

const branch = (v: unknown): Branch | null =>
  Array.isArray(v)
    ? { kind: 'array', entries: v.map((x, i) => [String(i), x]) }
    : v !== null && typeof v === 'object'
      ? { kind: 'object', entries: Object.entries(v as Record<string, unknown>) }
      : null

const count = (b: Branch) =>
  b.kind === 'array'
    ? `[${b.entries.length} ${b.entries.length === 1 ? 'item' : 'items'}]`
    : `{${b.entries.length} ${b.entries.length === 1 ? 'key' : 'keys'}}`

/** A child's path: each key escaped, so a key `a.b` and a nested `a` → `b` stay two paths. */
const child = (path: string, key: string) => `${path}/${encodeURIComponent(key)}`

/** Every path at or above `depth`, for the open set a tree starts with. */
function paths(v: unknown, depth: number, at = '$', level = 0, out = new Set<string>()): Set<string> {
  const b = branch(v)
  if (!b || level >= depth) return out
  out.add(at)
  for (const [k, x] of b.entries) paths(x, depth, child(at, k), level + 1, out)
  return out
}

/** A leaf as it is drawn, and as the filter reads it. */
const text = (value: unknown) =>
  typeof value === 'string' ? JSON.stringify(value) : value === undefined ? 'undefined' : String(value)

/**
 * What a filter keeps. `rows` maps each kept path to `true` when everything
 * under it is kept as well (it matched) and `false` when only the way down to a
 * match is; `open` is every kept branch, so each match is in view.
 */
export type Sifted = { rows: Map<string, boolean>; open: Set<string> }

export function sift(data: unknown, query: string): Sifted {
  const q = query.trim().toLowerCase()
  const rows = new Map<string, boolean>()
  const open = new Set<string>()
  const walk = (v: unknown, at: string, dotted: string, name: string | null): boolean => {
    const b = branch(v)
    const hit =
      (name !== null && (name.toLowerCase().includes(q) || `.${dotted}`.toLowerCase().includes(`.${q}`))) ||
      (!b && text(v).toLowerCase().includes(q))
    if (hit) {
      rows.set(at, true)
      if (b) open.add(at)
      return true
    }
    let kept = false
    if (b) for (const [k, x] of b.entries) if (walk(x, child(at, k), dotted ? `${dotted}.${k}` : k, k)) kept = true
    if (kept) {
      rows.set(at, false)
      open.add(at)
    }
    return kept
  }
  if (q) walk(data, '$', '', null)
  return { rows, open }
}

export interface JsonTreeProps extends Omit<YStackProps, 'children' | 'minHeight' | 'maxHeight'> {
  /** The value to draw — anything `JSON.stringify` accepts. */
  data: unknown
  /** How many levels are open on first paint. */
  depth?: number
  /** The header's title. Omit it, `showCopyButton={false}` and `search={false}` to drop the header. */
  title?: string
  showCopyButton?: boolean
  /** Whether the header has a filter box. Defaults to true. */
  search?: boolean
  /** The tallest the tree grows on its own, in px; past it the tree scrolls. */
  maxHeight?: number
  /** The shortest a drag makes it, in px. */
  minHeight?: number
  /** Whether a footer grip resizes the tree. */
  resizable?: boolean
  /** A height to start from, as `onResize` last reported it. */
  defaultHeight?: number | null
  /** Every height the reader drags to, and `null` when a double-click hands it back. */
  onResize?: (height: number | null) => void
}

export function JsonTree({
  data,
  depth = 2,
  title,
  showCopyButton = true,
  search = true,
  maxHeight,
  minHeight = 96,
  resizable = false,
  defaultHeight = null,
  onResize,
  ...props
}: JsonTreeProps) {
  const [open, setOpen] = React.useState(() => paths(data, depth))
  const [query, setQuery] = React.useState('')
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  /** The open set from before a filter, handed back when it clears. */
  const before = React.useRef<Set<string> | null>(null)
  /** A height the reader dragged to, or null while the tree follows its rows. */
  const [height, setHeight] = React.useState<number | null>(defaultHeight)
  const size = (n: number | null) => {
    setHeight(n)
    onResize?.(n)
  }

  const sifted = React.useMemo(() => (query.trim() ? sift(data, query) : null), [data, query])

  React.useEffect(() => () => clearTimeout(timer.current), [])
  React.useEffect(() => setOpen(paths(data, depth)), [data, depth])
  // After the reset above, so a filter that is on keeps its matches open on new data.
  React.useEffect(() => {
    if (sifted) setOpen(sifted.open)
  }, [sifted])

  const type = (next: string) => {
    const on = next.trim() !== ''
    if (on && before.current === null) before.current = open
    if (!on && before.current !== null) {
      setOpen(before.current)
      before.current = null
    }
    setQuery(next)
  }

  const toggle = React.useCallback(
    (path: string) =>
      setOpen((prev) => {
        const next = new Set(prev)
        if (!next.delete(path)) next.add(path)
        return next
      }),
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
      toast.success('JSON copied to clipboard')
    } catch {
      toast.error('Failed to copy JSON')
    }
  }

  const root = branch(data)
  const searchable = search && root !== null
  const header = title !== undefined || showCopyButton || searchable
  // Everything is kept when the root itself matched; nothing is when no row did.
  const kept = sifted && !sifted.rows.get('$') ? sifted.rows : null
  const none = sifted !== null && sifted.rows.size === 0
  const fixed = height !== null

  return (
    <YStack
      {...slot('json-tree')}
      borderWidth={1}
      borderColor="$borderColor"
      rounded="$3"
      overflow="hidden"
      bg="$background"
      {...props}
    >
      {header && (
        // One row: the title, then the filter and the three actions as icons that name
        // themselves. The filter and the actions move as one group, so on a pane too narrow
        // for all of it they wrap under the title together instead of overlapping it.
        <XStack
          {...slot('json-tree-header')}
          items="center"
          flexWrap="wrap"
          gap="$1"
          borderBottomWidth={1}
          borderColor="$borderColor"
          bg="$panel"
          px="$2"
          py="$1"
        >
          <SizableText size="$1" fontFamily="$mono" color="$soft" px="$2" grow={1}>
            {title ?? 'JSON'}
          </SizableText>
          <XStack
            grow={1}
            shrink={1}
            flexBasis={searchable ? 240 : 'auto'}
            minW={0}
            justify="flex-end"
            items="center"
            gap="$1"
          >
            {searchable && (
              <XStack flex={1} minW={0} maxW={260}>
                <Input
                  {...slot('json-tree-filter')}
                  type="search"
                  value={query}
                  onChangeText={type}
                  placeholder="Filter"
                  aria-label={`Filter ${title ?? 'JSON'} by key, path or value`}
                  // No adornment: its wrapper holds the field at its intrinsic width, and
                  // on a narrow pane that pushed the actions out of the header.
                  height={32}
                  fontSize="$2"
                />
              </XStack>
            )}
            {root && (
              <>
                <Button
                  {...slot('json-tree-expand')}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Expand all"
                  title="Expand all"
                  onClick={() => setOpen(paths(data, Number.POSITIVE_INFINITY))}
                >
                  <ChevronsUpDown size={14} />
                </Button>
                <Button
                  {...slot('json-tree-collapse')}
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Collapse all"
                  title="Collapse all"
                  onClick={() => setOpen(new Set())}
                >
                  <ChevronsDownUp size={14} />
                </Button>
              </>
            )}
            {showCopyButton && (
              <Button
                {...slot('json-tree-copy')}
                variant="ghost"
                size="icon-sm"
                aria-label={copied ? 'Copied' : `Copy ${title ?? 'JSON'}`}
                title="Copy"
                onClick={copy}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </Button>
            )}
          </XStack>
        </XStack>
      )}
      {/* The grip measures its parent, so the body and its grip share one box. */}
      <YStack position="relative">
        <YStack
          {...slot('json-tree-body')}
          py="$2"
          px="$2"
          {...(fixed ? { height } : maxHeight !== undefined ? { maxH: maxHeight } : null)}
          overflowY={fixed || maxHeight !== undefined ? 'auto' : undefined}
        >
          {none ? (
            <SizableText {...slot('json-tree-empty')} size="$2" color="$soft" px="$2" py="$1">
              Nothing matches “{query.trim()}”.
            </SizableText>
          ) : (
            <Node name={null} value={data} path="$" level={0} open={open} toggle={toggle} kept={kept} />
          )}
        </YStack>
        {resizable && (
          <Grip
            side="top"
            span={height ?? minHeight}
            floor={minHeight}
            ceil={CEILING}
            onSpan={setHeight}
            onKeep={size}
            onReset={() => size(null)}
            label={`Resize ${title ?? 'JSON'}`}
            b={0}
          />
        )}
      </YStack>
    </YStack>
  )
}

/** A leaf's colour: the code theme's key for its JSON type. */
const INK = {
  string: '$codeString',
  number: '$codeNumber',
  boolean: '$codeBoolean',
  null: '$codeNull',
} as const

function Leaf({ value }: { value: unknown }) {
  const type = value === null ? 'null' : typeof value
  return (
    <SizableText
      {...slot('json-tree-value')}
      data-type={type}
      size="$2"
      fontFamily="$mono"
      color={INK[type as keyof typeof INK] ?? '$codePunctuation'}
      shrink={1}
      minW={0}
      // A hash or a URL is one unbreakable word; without this it sets the tree's
      // min-content width and pushes the page sideways on a phone.
      style={{ overflowWrap: 'anywhere' }}
    >
      {text(value)}
    </SizableText>
  )
}

function Node({
  name,
  value,
  path,
  level,
  open,
  toggle,
  kept,
}: {
  name: string | null
  value: unknown
  path: string
  level: number
  open: Set<string>
  toggle: (path: string) => void
  /** The rows a filter keeps below here, or null when every row is. */
  kept: Map<string, boolean> | null
}) {
  const b = branch(value)
  const expanded = b !== null && open.has(path)
  const key =
    name === null ? null : (
      <SizableText {...slot('json-tree-key')} size="$2" fontFamily="$mono" color="$codeKey">
        {name}
        <SizableText size="$2" fontFamily="$mono" color="$codePunctuation">
          :
        </SizableText>
      </SizableText>
    )

  if (!b) {
    return (
      <XStack {...slot('json-tree-row')} items="flex-start" gap="$1.5" pl={level * INDENT} py={1}>
        <XStack width={14} shrink={0} />
        {key}
        <Leaf value={value} />
      </XStack>
    )
  }

  const empty = b.entries.length === 0
  return (
    <YStack {...slot('json-tree-node')}>
      <XStack
        {...slot('json-tree-row')}
        {...(!empty &&
          ({
            role: 'button',
            tabIndex: 0,
            'aria-expanded': expanded,
            'aria-label': `${name ?? 'root'} ${count(b)}`,
          } as object))}
        items="center"
        gap="$1.5"
        pl={level * INDENT}
        py={1}
        rounded="$2"
        cursor={empty ? undefined : 'pointer'}
        hoverStyle={empty ? undefined : { bg: '$hover' }}
        focusVisibleStyle={{ bg: '$hover' }}
        onPress={empty ? undefined : () => toggle(path)}
        onKeyDown={
          empty
            ? undefined
            : (e: React.KeyboardEvent) => {
                if (e.key !== 'Enter' && e.key !== ' ') return
                e.preventDefault()
                toggle(path)
              }
        }
      >
        {empty ? (
          <XStack width={14} shrink={0} />
        ) : expanded ? (
          <ChevronDown size={14} color="$soft" />
        ) : (
          <ChevronRight size={14} color="$soft" />
        )}
        {key}
        <SizableText {...slot('json-tree-count')} size="$2" fontFamily="$mono" color="$codeComment">
          {empty ? (b.kind === 'array' ? '[]' : '{}') : count(b)}
        </SizableText>
      </XStack>
      {expanded && (
        <YStack>
          {b.entries.map(([k, v]) => {
            const at = child(path, k)
            if (kept && !kept.has(at)) return null
            return (
              <Node
                key={k}
                name={k}
                value={v}
                path={at}
                level={level + 1}
                open={open}
                toggle={toggle}
                kept={kept && !kept.get(at) ? kept : null}
              />
            )
          })}
        </YStack>
      )}
    </YStack>
  )
}
