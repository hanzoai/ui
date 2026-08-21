'use client'

/**
 * Step — something the assistant did on the way to the answer, and how it went.
 *
 * A tool call, a retrieval, a plan, a stretch of reasoning, a progress report:
 * every one of them is a named region that reports a state and opens to show
 * its detail. Two repos had written that arrangement NINE times without ever
 * naming it — hanzo/chat once (`ToolCall.tsx` + `ProgressText.tsx`), hanzo.app
 * eight (`chat-panel/index.tsx` `ToolDisplay`, `SyntheticErrorDisplay`,
 * `ReasoningDisplay`, `PlanDisplay`, `AgentDisplay`, `ProgressDisplay`, the
 * inline `project_context` block, and the builder's own `CollapsibleSection` in
 * `ask-ai/chat-thread.tsx:330`). Nine chances to order the header differently,
 * and they took most of them.
 *
 * What goes INSIDE stays the surface's: chat renders the input as a code block
 * and the result through its own markdown, the app renders
 * `JSON.stringify(parameters, null, 2)`. That is `children`. The header, the
 * state mark, the disclosure and the frame are the same drawing in all nine and
 * they are here.
 *
 * The open/closed behaviour is `Collapsible`, not a hand-rolled height
 * animation. Both existing implementations rolled their own — chat measures
 * `scrollHeight` in a `useLayoutEffect`, keeps a `ResizeObserver` alive and
 * transitions an explicit pixel height — and that is the keyboard handling and
 * the `aria-expanded`/`aria-controls` pair re-derived by hand each time. The
 * primitive already has them.
 *
 * There is no duration and no elapsed time. Neither implementation shows one,
 * and chat's apparent progress is not measured at all: `useProgress.ts:54`
 * ticks a `setInterval` by 0.007 every 200ms and caps at 0.95 until the server
 * says otherwise. A number that is invented should not be given a place to
 * render.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import { Ban, Check, ChevronDown, TriangleAlert } from '@hanzogui/lucide-icons-2'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger, Spinner } from '../backends/gui'
import { slot } from '../backends/gui/slot'

/**
 * How a step went.
 *
 * Four, from the union of what the two implementations track. chat reports
 * `error`, `cancelled` and a progress ratio it treats as running-or-done
 * (`ToolCall.tsx:139`); the app reports `pending | executing | completed |
 * failed` (`chat-panel/index.tsx:97`) — and `pending` and `executing` draw the
 * same thing, because from the reader's side a step that has not started and a
 * step that is running are both "not yet".
 */
export type Ran = 'running' | 'done' | 'error' | 'cancelled'

/** Edge of the state mark, px. One size, so the header never reflows on a state
 *  change — a step that finishes must not move the text beside it. */
const MARK = 13

/**
 * The mark for each state. `running` is the one that moves.
 *
 * Tinted on the glyph, never on the box: `XStack` is a View and has no `color`,
 * so a colour set there type-errors rather than cascading — which is this
 * package's "a prop must actually arrive" rule catching a habit borrowed from
 * the DOM. Written as four call sites rather than a lookup table because the
 * Spinner and the three glyphs do not share a props type: the icons take a
 * themed `GetThemeValueForKey<'color'>` and the Spinner takes a plain string,
 * and the table that unified them only typechecked by widening both to `any`.
 */
const mark = (status: Ran) => {
  switch (status) {
    case 'running':
      return <Spinner size={MARK} color="$color11" />
    case 'done':
      return <Check size={MARK} color="$color11" />
    case 'error':
      return <TriangleAlert size={MARK} color="$color11" />
    case 'cancelled':
      return <Ban size={MARK} color="$color11" />
  }
}

export interface StepProps {
  /** What ran — a tool name, "Reasoning", "Plan". */
  name: string
  status?: Ran
  /**
   * One line beside the name: the command, the path, the query. Clamped to a
   * single line — the app truncates its own to 50 characters
   * (`chat-panel/index.tsx:1148`) precisely because an untruncated one wraps
   * the header and moves the chevron.
   */
  detail?: string
  /** Revealed when open. Omit it and the step has nothing to open, so it does
   *  not offer to: no chevron, no trigger, no keyboard stop. */
  children?: ReactNode
  /** Uncontrolled. */
  defaultOpen?: boolean
  /** Controlled — the app holds every step's state in one `Set` on the panel. */
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
}: StepProps) {
  // A step with no body is a statement, not a control. Rendering a dead chevron
  // and a focusable trigger over nothing is how a keyboard user is sent to a
  // stop that does not answer.
  const opens = children != null

  const header = (
    <XStack items="center" gap="$2" px="$3" py="$2" width="100%">
      <XStack width={MARK + 1} items="center" justify="center" shrink={0}>
        {mark(status)}
      </XStack>
      <SizableText size="$1" color="$color12" numberOfLines={1}>
        {name}
      </SizableText>
      {detail ? (
        <SizableText size="$1" color="$color10" numberOfLines={1} shrink={1}>
          {detail}
        </SizableText>
      ) : null}
      <XStack flex={1} />
      {opens ? <ChevronDown size={13} color="$color10" /> : null}
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
      // The failure edge, not a red one. `product/tone.ts` states the rule this
      // package works under — "this system has no colour to spend" — and marks
      // its `stopped` register with a border rather than a fill. A step that
      // errored is set apart the same way, so it still reads as a failure in a
      // brand that retunes the whole ramp.
      borderColor={status === 'error' ? '$color9' : '$borderColor'}
      bg="$color2"
      overflow="hidden"
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
