'use client'

/**
 * Console — the dock under the work: what the run and the page just said.
 *
 * Ported from build-v2 `components/editor/console/{index,dock,log}.tsx` (MIT,
 * derived from OSW Studio and DeepSite — see NOTICE). v2 owned a module-scope
 * buffer, a shell prompt that POSTed to its own backend and a sandbox stop
 * button; here the lines are the host's (a run's events, a page's forwarded
 * console), the shell is an optional `onRun`, and the dock is the frame and the
 * one dimension it has.
 *
 * ONE DIMENSION. The dock is its height: `height > HEAD` is open, anything else
 * shows the header alone. A drag, a click on the grip and an arrow key are all
 * ways of setting that one number (`resolve` in `log.ts`), so a dragged size
 * and a toggled state can never disagree. The host holds the number, so it can
 * persist it with the rest of its chrome.
 *
 * Lines are TEXT. What a run prints and what a page logs is drawn as strings in
 * a monospace block — never parsed as markup, never linkified, never run.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import { ChevronDown, ChevronUp, Trash2 } from '@hanzogui/lucide-icons-2'
import {
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'

import { Button } from '../backends/gui/button'
import { drag, type DragEvent } from '../backends/gui/gesture'
import { Input } from '../backends/gui/input'
import { slot } from '../backends/gui/slot'
import { ceiling, count, HEAD, type Level, type Line, OPEN, opened, resolve, STEP } from './log'

type Col = Omit<ComponentProps<typeof YStack>, 'children' | 'height'>

/** A tab beyond the log — a terminal, a run's raw output. */
export interface ConsoleTab {
  id: string
  label: string
  /** What the tab shows when chosen. */
  content: ReactNode
}

export interface ConsoleProps extends Col {
  /** The log. Newest last. */
  lines: readonly Line[]
  /** The dock's height, px. At or below `HEAD` only the header shows. */
  height: number
  onHeight: (height: number) => void
  /** Tabs after the log. */
  tabs?: readonly ConsoleTab[]
  /** The chosen tab: `'log'` or one of `tabs`. */
  tab?: string
  onTab?: (id: string) => void
  onClear?: () => void
  /** A command line under the log. Omit and there is none. */
  onRun?: (command: string) => void
  /** A command is running: the line is held. */
  busy?: boolean
  /** Right of the tabs: the branch, the run's state. */
  status?: ReactNode
  /** The log tab's name. */
  label?: string
}

const TONE: Record<Level, string> = {
  log: '$ink',
  info: '$ink',
  warn: '$yellow10',
  error: '$bad',
  debug: '$soft',
}

const viewport = () => (typeof window === 'undefined' ? 1000 : window.innerHeight)

export function Console({
  lines,
  height,
  onHeight,
  tabs = [],
  tab = 'log',
  onTab,
  onClear,
  onRun,
  busy = false,
  status,
  label = 'Console',
  ...rest
}: ConsoleProps) {
  const open = opened(height)
  const last = useRef(OPEN)
  if (open) last.current = height
  const start = useRef<{ y: number; base: number; moved: boolean } | null>(null)
  const tail = useRef<HTMLDivElement | null>(null)
  const [command, setCommand] = useState('')
  const counts = count([...lines])

  useEffect(() => {
    if (open && tab === 'log') tail.current?.scrollIntoView?.({ block: 'end' })
  }, [lines.length, open, tab])

  const toggle = () => onHeight(open ? HEAD : resolve(last.current, viewport()))
  const nudge = (delta: number) => onHeight(resolve((open ? height : HEAD) + delta, viewport()))

  const grip = drag({
    begin: (e: DragEvent) => {
      start.current = { y: e.clientY ?? 0, base: open ? height : HEAD, moved: false }
    },
    move: (e: DragEvent) => {
      const s = start.current
      if (!s) return
      const delta = s.y - (e.clientY ?? s.y)
      if (Math.abs(delta) > 3) s.moved = true
      if (s.moved) onHeight(resolve(s.base + delta, viewport()))
    },
    end: () => {
      const s = start.current
      start.current = null
      if (s && !s.moved) toggle()
    },
  })

  const chosen = tabs.find((t) => t.id === tab)
  const all: { id: string; label: string }[] = [{ id: 'log', label }, ...tabs]

  return (
    <YStack
      {...slot('console')}
      render="section"
      aria-label={label}
      shrink={0}
      minW={0}
      overflow="hidden"
      borderTopWidth={1}
      borderColor="$borderColor"
      bg="$background"
      style={{ height: Math.max(height, HEAD) }}
      {...rest}
    >
      <YStack
        {...slot('console-grip')}
        role="separator"
        aria-orientation="horizontal"
        aria-label={`Resize ${label.toLowerCase()}`}
        aria-valuemin={HEAD}
        aria-valuemax={ceiling(viewport())}
        aria-valuenow={Math.max(height, HEAD)}
        tabIndex={0}
        height={6}
        mt={-3}
        cursor="row-resize"
        hoverStyle={{ bg: '$edge' }}
        focusVisibleStyle={{ bg: '$rim' }}
        onKeyDown={((e: KeyboardEvent) => {
          if (e.key === 'ArrowUp') nudge(e.shiftKey ? STEP * 4 : STEP)
          else if (e.key === 'ArrowDown') nudge(-(e.shiftKey ? STEP * 4 : STEP))
          else if (e.key === 'Enter' || e.key === ' ') toggle()
          else return
          e.preventDefault()
        }) as never}
        {...(grip as object)}
      />
      <XStack items="center" gap="$2" px="$2" minH={HEAD - 6} shrink={0}>
        <XStack role="tablist" aria-label={`${label} tabs`} items="center" gap="$1" minW={0} shrink={1} overflow="scroll">
          {all.map((t) => {
            const on = t.id === tab
            return (
              <Button
                key={t.id}
                type="button"
                variant="ghost"
                size="sm"
                role="tab"
                aria-selected={on}
                tabIndex={on ? 0 : -1}
                minHeight={24}
                px="$2"
                bg={on ? '$hover' : 'transparent'}
                onClick={() => {
                  onTab?.(t.id)
                  if (!open) toggle()
                }}
              >
                <SizableText size="$1" color={on ? '$ink' : '$soft'}>
                  {t.label}
                </SizableText>
                {t.id === 'log' && counts.error > 0 ? (
                  <SizableText size="$1" color="$bad" {...slot('console-errors')}>
                    {counts.error}
                  </SizableText>
                ) : null}
              </Button>
            )
          })}
        </XStack>
        <XStack flex={1} minW={0} justify="flex-end" items="center" gap="$2" overflow="hidden">
          {status}
        </XStack>
        {onClear && tab === 'log' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            minHeight={24}
            minWidth={24}
            aria-label={`Clear ${label.toLowerCase()}`}
            title={`Clear ${label.toLowerCase()}`}
            disabled={lines.length === 0}
            onClick={onClear}
          >
            <Trash2 size={13} />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          minHeight={24}
          minWidth={24}
          aria-label={open ? `Collapse ${label.toLowerCase()}` : `Expand ${label.toLowerCase()}`}
          aria-expanded={open}
          title={open ? 'Collapse' : 'Expand'}
          onClick={toggle}
        >
          {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </Button>
      </XStack>

      {open ? (
        <YStack role="tabpanel" aria-label={chosen?.label ?? label} flex={1} minH={0}>
          {chosen ? (
            chosen.content
          ) : (
            <>
              <ScrollView flex={1} minH={0}>
                <YStack px="$3" pb="$2" {...slot('console-lines')} role="log" aria-live="polite">
                  {lines.length === 0 ? (
                    <SizableText size="$1" color="$soft" fontFamily="$mono">
                      Nothing yet.
                    </SizableText>
                  ) : (
                    lines.map((l) => (
                      <XStack key={l.id} gap="$2" items="flex-start" data-level={l.level}>
                        {l.source ? (
                          <SizableText size="$1" color="$soft" fontFamily="$mono" shrink={0}>
                            {l.source}
                          </SizableText>
                        ) : null}
                        <SizableText
                          size="$1"
                          color={TONE[l.level]}
                          fontFamily="$mono"
                          flex={1}
                          minW={0}
                          whiteSpace="pre-wrap"
                          style={{ wordBreak: 'break-word' }}
                        >
                          {l.text}
                        </SizableText>
                      </XStack>
                    ))
                  )}
                  <div ref={tail} />
                </YStack>
              </ScrollView>
              {onRun ? (
                <XStack items="center" gap="$2" px="$3" py="$1.5" borderTopWidth={1} borderColor="$borderColor">
                  <SizableText size="$1" color="$soft" fontFamily="$mono" aria-hidden>
                    $
                  </SizableText>
                  <Input
                    {...slot('console-prompt')}
                    value={command}
                    disabled={busy}
                    aria-label="Run a command"
                    placeholder={busy ? 'Running…' : 'Run a command'}
                    onChangeText={setCommand}
                    onKeyDown={((e: KeyboardEvent & { nativeEvent?: { isComposing?: boolean } }) => {
                      if (e.key !== 'Enter' || e.nativeEvent?.isComposing) return
                      const typed = command.trim()
                      if (!typed || busy) return
                      e.preventDefault()
                      onRun(typed)
                      setCommand('')
                    }) as never}
                    flex={1}
                    height={28}
                    borderWidth={0}
                    bg="transparent"
                    px={0}
                    fontFamily="$mono"
                    fontSize="$1"
                  />
                </XStack>
              ) : null}
            </>
          )}
        </YStack>
      ) : null}
    </YStack>
  )
}
