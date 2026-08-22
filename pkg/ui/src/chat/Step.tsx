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
import type { ComponentProps, ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger, Spinner } from '../backends/gui'
import { slot } from '../backends/gui/slot'

/** How a step went. A step that has not started and one that is running draw
 *  the same thing: from the reader's side both are "not yet". */
export type Ran = 'running' | 'done' | 'error' | 'cancelled'

/** Edge of the state mark, px. One size, so a state change never reflows the
 *  header. */
const MARK = 13

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
      return <Check size={MARK} color="$quiet" />
    case 'error':
      return <TriangleAlert size={MARK} color="$quiet" />
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
  children,
  defaultOpen,
  open,
  onOpenChange,
  ...props
}: StepProps) {
  // A step with no body is a statement, not a control: no chevron, no trigger,
  // no keyboard stop that does not answer.
  const opens = children != null

  const header = (
    <XStack items="center" gap="$2" px="$3" py="$2" width="100%">
      <XStack width={MARK + 1} items="center" justify="center" shrink={0}>
        {mark(status)}
      </XStack>
      <SizableText size="$1" color="$ink" numberOfLines={1}>
        {name}
      </SizableText>
      {detail ? (
        <SizableText size="$1" color="$soft" numberOfLines={1} shrink={1}>
          {detail}
        </SizableText>
      ) : null}
      <XStack flex={1} />
      {opens ? <ChevronDown size={13} color="$soft" /> : null}
    </XStack>
  )

  return (
    <Collapsible
      {...slot('step')}
      data-status={status}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
      width="100%"
      rounded="$4"
      borderWidth={1}
      // An edge, not a red fill — `product/tone.ts` marks `stopped` the same
      // way, so it survives a brand that retunes the ramp.
      borderColor={status === 'error' ? '$faint' : '$borderColor'}
      bg="$panel"
      overflow="hidden"
      {...props}
    >
      {opens ? <CollapsibleTrigger width="100%">{header}</CollapsibleTrigger> : header}
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
            {children}
          </YStack>
        </CollapsibleContent>
      ) : null}
    </Collapsible>
  )
}
