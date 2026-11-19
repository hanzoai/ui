'use client'

/**
 * Step — something the assistant did on the way to the answer, and how it went.
 *
 * A tool call, a retrieval, a plan, a stretch of reasoning, a progress report:
 * each is a named region that reports a state and opens to show its detail.
 * The header, the state mark, the disclosure and the frame are here; what goes
 * inside is `children`.
 *
 * Open/closed is `Collapsible`, so `aria-expanded`, `aria-controls` and the
 * keyboard come from the primitive.
 *
 * No duration: nothing upstream measures one, and a progress ratio ticked by a
 * timer is not a measurement.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Ban, Check, ChevronDown, TriangleAlert } from '@hanzogui/lucide-icons-2'
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger, Spinner } from '../backends/gui'
import { ink } from '../backends/gui/ink'
import { RING } from '../backends/gui/press'
import { slot } from '../backends/gui/slot'
import { CopyButton } from '../product/CopyButton'
import { useReducedMotion } from './useReducedMotion'

/** How a step went. A step that has not started and one that is running draw
 *  the same thing: from the reader's side both are "not yet". */
export type Ran = 'running' | 'done' | 'error' | 'cancelled'

/** Edge of the state mark, px. One size, so a state change never reflows the
 *  header. */
const MARK = 13

const STRONG = 'var(--border-strong)' as const

const formatElapsed = (ms: number, coarse: boolean): string => {
  if (ms >= 60_000) {
    const mins = Math.floor(ms / 60_000)
    const secs = Math.floor((ms % 60_000) / 1000)
    return `${mins}m ${secs}s`
  }
  if (coarse) return `${Math.max(1, Math.round(ms / 1000))}s`
  return `${(ms / 1000).toFixed(1)}s`
}

/**
 * The mark for each state. `running` is the one that moves.
 *
 * Tinted on the glyph: `XStack` is a View and takes no `color`. Four call sites
 * rather than a table because the Spinner and the icons do not share a props
 * type — the icons take a themed colour, the Spinner a plain string.
 */
const mark = (status: Ran) => {
  switch (status) {
    case 'running':
      return <Spinner size={MARK} color="$quiet" />
    case 'done':
      return <Check size={MARK} color="var(--state-success)" />
    case 'error':
      return <TriangleAlert size={MARK} color="var(--state-error)" />
    case 'cancelled':
      return <Ban size={MARK} color="$quiet" />
  }
}

export interface StepProps
  extends Omit<ComponentProps<typeof Collapsible>, 'children' | 'open' | 'defaultOpen' | 'onOpenChange'> {
  /** What ran — a tool name, "Reasoning", "Plan". */
  name: string
  status?: Ran
  /** One line beside the name: the command, the path, the query. Clamped, or it
   *  wraps the header and moves the chevron. */
  detail?: string
  /** `detail` is the start of the body (a thought's first line): shown while shut, hidden once the body repeats it open. */
  preview?: boolean
  /** Revealed when open. Omit it and the step has nothing to open, so it does
   *  not offer to: no chevron, no trigger, no keyboard stop. */
  children?: ReactNode
  /** Uncontrolled. */
  defaultOpen?: boolean
  /** Controlled. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Step({
  name,
  status = 'done',
  detail,
  preview = false,
  children,
  defaultOpen,
  open,
  onOpenChange,
  ...props
}: StepProps) {
  // A step with no body is a statement, not a control: no chevron, no trigger,
  // no keyboard stop that does not answer.
  const opens = children != null
  const reducedMotion = useReducedMotion()

  const controlled = open !== undefined
  const [innerOpen, setInnerOpen] = useState(Boolean(defaultOpen))
  const isOpen = controlled ? Boolean(open) : innerOpen
  const handleOpenChange = (next: boolean) => {
    if (!controlled) setInnerOpen(next)
    onOpenChange?.(next)
  }

  // Honest live elapsed timer: starts only while mounted in `running`, freezes
  // when status leaves `running`, and stays absent for steps that mount settled.
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const startedAt = useRef<number | null>(null)

  useEffect(() => {
    if (status !== 'running') {
      if (startedAt.current !== null) {
        setElapsedMs(Date.now() - startedAt.current)
        startedAt.current = null
      }
      return
    }

    const start = Date.now()
    startedAt.current = start
    setElapsedMs(0)
    const tick = setInterval(() => {
      setElapsedMs(Date.now() - start)
    }, 100)

    return () => clearInterval(tick)
  }, [status])

  const elapsed = elapsedMs !== null && elapsedMs >= 100 ? formatElapsed(elapsedMs, reducedMotion) : null
  const showDetail = Boolean(detail) && !(preview && isOpen && opens)

  const header = (
    <XStack items="center" gap="$2" px="$3" py="$2" width="100%">
      <XStack width={MARK + 1} items="center" justify="center" shrink={0}>
        {mark(status)}
      </XStack>
      <SizableText size="$1" fontWeight="500" color="$ink" numberOfLines={1} shrink={0}>
        {name}
      </SizableText>
      {showDetail ? (
        <SizableText size="$1" color="$soft" numberOfLines={1} flex={1} minW={0} text="start">
          {detail}
        </SizableText>
      ) : (
        <XStack grow={1} />
      )}
      {elapsed ? (
        <SizableText
          {...slot('step-elapsed')}
          size="$1"
          color="$quiet"
          shrink={0}
          fontVariant={['tabular-nums']}
        >
          {elapsed}
        </SizableText>
      ) : null}
      {opens ? (
        <XStack
          shrink={0}
          items="center"
          justify="center"
          rotate={isOpen ? '180deg' : '0deg'}
          transition={reducedMotion ? undefined : 'quickest'}
        >
          <ChevronDown size={13} color="$soft" />
        </XStack>
      ) : null}
    </XStack>
  )

  return (
    <Collapsible
      {...slot('step')}
      data-status={status}
      open={isOpen}
      onOpenChange={handleOpenChange}
      width="100%"
      rounded="$4"
      borderWidth={1}
      // An edge, not a red fill — `product/tone.ts` marks `stopped` the same
      // way, so it survives a brand that retunes the ramp.
      borderColor={status === 'error' ? '$faint' : '$borderColor'}
      {...(status === 'error'
        ? { borderInlineStartWidth: 2, borderInlineStartColor: 'var(--state-error)' }
        : null)}
      bg="$panel"
      overflow="hidden"
      transition={reducedMotion ? undefined : 'quickest'}
      hoverStyle={opens && status !== 'error' ? { borderColor: STRONG } : undefined}
      focusWithinStyle={opens && status !== 'error' ? { borderColor: STRONG } : undefined}
      {...props}
    >
      {opens ? (
        <CollapsibleTrigger
          width="100%"
          minH={36}
          $max-sm={{ minH: 44 }}
          hoverStyle={{ bg: '$hover' }}
          focusVisibleStyle={RING}
          transition={reducedMotion ? undefined : 'quickest'}
        >
          {header}
        </CollapsibleTrigger>
      ) : (
        header
      )}
      {opens ? (
        <CollapsibleContent>
          <YStack
            {...slot('step-body')}
            px="$3"
            py="$2.5"
            gap="$2"
            borderTopWidth={1}
            borderColor="$borderColor"
          >
            {typeof children === 'string' ? (
              <XStack items="flex-start" gap="$2" width="100%">
                <YStack grow={1} minW={0}>
                  {ink(children, undefined, { size: '$2', color: '$ink' })}
                </YStack>
                {children.length > 0 ? (
                  <CopyButton
                    value={children}
                    size={24}
                    props={{
                      shrink: 0,
                      focusVisibleStyle: RING,
                      '$max-sm': { minW: 44, minH: 44 },
                    }}
                  />
                ) : null}
              </XStack>
            ) : (
              children
            )}
          </YStack>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
