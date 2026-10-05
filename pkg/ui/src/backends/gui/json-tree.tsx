'use client'

/**
 * JsonTree — a JSON value drawn as a tree a reader can open and close: one row
 * per key or element, objects and arrays behind a disclosure that says how
 * many children they hold, and a header with Expand all, Collapse all and Copy.
 *
 * The first `depth` levels open on first paint. A row is a button (Enter and
 * Space toggle it, `aria-expanded` says which way), so the tree reads with a
 * keyboard and a screen reader as well as a pointer. Keys and values take the
 * code theme's colours (`code-theme.ts`), the same theme keys `CodeEditor`
 * paints with, and a count reads as a comment. A long value wraps anywhere, so
 * a hash never widens the page. Built from gui primitives only, so it renders
 * wherever gui does.
 */
import { SizableText, XStack, YStack, type YStackProps } from '@hanzo/gui'
import { Check, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Copy } from '@hanzogui/lucide-icons-2'
import * as React from 'react'

import { Button } from './button'
import { slot } from './slot'
import { toast } from './toaster'

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

export interface JsonTreeProps extends Omit<YStackProps, 'children'> {
  /** The value to draw — anything `JSON.stringify` accepts. */
  data: unknown
  /** How many levels are open on first paint. */
  depth?: number
  /** The header's title. Omit it and `showCopyButton={false}` to drop the header. */
  title?: string
  showCopyButton?: boolean
}

export function JsonTree({ data, depth = 2, title, showCopyButton = true, ...props }: JsonTreeProps) {
  const [open, setOpen] = React.useState(() => paths(data, depth))
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])
  React.useEffect(() => setOpen(paths(data, depth)), [data, depth])

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

  const header = title !== undefined || showCopyButton
  const root = branch(data)

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
        <XStack
          {...slot('json-tree-header')}
          items="center"
          justify="space-between"
          flexWrap="wrap"
          gap="$2"
          borderBottomWidth={1}
          borderColor="$borderColor"
          bg="$panel"
          px="$2"
          py="$1"
        >
          <SizableText size="$1" fontFamily="$mono" color="$soft" px="$2">
            {title ?? 'JSON'}
          </SizableText>
          {/* Shrinks and wraps under the title on a narrow card, rather than holding its
              width and pushing the page sideways. */}
          <XStack items="center" justify="flex-end" flexWrap="wrap" gap="$1" shrink={1} minW={0}>
            {root && (
              <>
                <Button
                  {...slot('json-tree-expand')}
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(paths(data, Number.POSITIVE_INFINITY))}
                >
                  <ChevronsUpDown size={14} />
                  Expand all
                </Button>
                <Button {...slot('json-tree-collapse')} variant="ghost" size="sm" onClick={() => setOpen(new Set())}>
                  <ChevronsDownUp size={14} />
                  Collapse all
                </Button>
              </>
            )}
            {showCopyButton && (
              <Button {...slot('json-tree-copy')} variant="ghost" size="sm" onClick={copy}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </XStack>
        </XStack>
      )}
      <YStack {...slot('json-tree-body')} py="$2" px="$2">
        <Node name={null} value={data} path="$" level={0} open={open} toggle={toggle} />
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
  const text = typeof value === 'string' ? JSON.stringify(value) : value === undefined ? 'undefined' : String(value)
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
      {text}
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
}: {
  name: string | null
  value: unknown
  path: string
  level: number
  open: Set<string>
  toggle: (path: string) => void
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
          {b.entries.map(([k, v]) => (
            <Node
              key={k}
              name={k}
              value={v}
              path={child(path, k)}
              level={level + 1}
              open={open}
              toggle={toggle}
            />
          ))}
        </YStack>
      )}
    </YStack>
  )
}
