'use client'

/**
 * ProgressBlock — an agent's turn, as the steps it took.
 *
 * A run emits one event per token and per tool call, and printed flat that is a
 * wall. What a reader wants is the SHAPE of the work: it thought, it searched,
 * it read two files, it finished — each one line, each openable for the detail,
 * and the answer underneath at full size.
 *
 * So a step is a LABEL plus DETAIL, and the detail is closed by default. The
 * label is the claim ("Read 2 files"); the detail is the evidence
 * ("BuyNowButton.tsx", "styles.css"). A reader skims labels and opens the one
 * they doubt — which is the whole reason this beats a transcript.
 *
 * `done` is a state of the BLOCK, not a step: a run that is still working shows
 * no tick, and a tick that appears before the work stops is a lie a reader will
 * only catch once.
 *
 * Presentational. `steps()` maps session events to this shape and is exported
 * beside it, because every surface reading the same stream should group it the
 * same way.
 */
import { SizableText, XStack, YStack } from '@hanzo/gui'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileText,
  Lightbulb,
  Search,
  Sparkles,
  Terminal,
  TriangleAlert,
} from '@hanzogui/lucide-icons-2'
import { useState, type ComponentProps, type ReactNode } from 'react'

import { slot } from '../backends/gui/slot'

type Col = Omit<ComponentProps<typeof YStack>, 'children'>

/** What a step was. Chooses the icon, and nothing else. */
export type StepKind = 'think' | 'search' | 'read' | 'run' | 'write' | 'error' | 'step'

const ICON: Record<StepKind, typeof Search> = {
  think: Lightbulb,
  search: Sparkles,
  read: FileText,
  run: Terminal,
  write: FileText,
  error: TriangleAlert,
  step: CircleDot,
}

export interface Step {
  key: string
  kind: StepKind
  /** The claim — one line, always visible. */
  label: string
  /** The evidence, one line each. Absent means nothing to open. */
  detail?: string[]
  /** Open on first render — for the step being worked on right now. */
  open?: boolean
}

function Row({ step }: { step: Step }) {
  const [open, setOpen] = useState(step.open ?? false)
  const Icon = ICON[step.kind]
  const has = !!step.detail?.length

  return (
    <YStack gap="$0.5">
      <XStack
        items="center"
        gap="$1.5"
        cursor={has ? 'pointer' : 'default'}
        role={has ? 'button' : undefined}
        tabIndex={has ? 0 : undefined}
        aria-expanded={has ? open : undefined}
        onPress={() => has && setOpen((v) => !v)}
      >
        <Icon size={13} opacity={0.55} />
        <SizableText size="$2" color="$quiet">
          {step.label}
        </SizableText>
        {has ? (
          open ? (
            <ChevronDown size={12} opacity={0.5} />
          ) : (
            <ChevronRight size={12} opacity={0.5} />
          )
        ) : null}
      </XStack>

      {/* Indented under the label and hung off a hairline, so a long detail
          reads as belonging to its step rather than as the next one. */}
      {has && open ? (
        <YStack pl="$4" ml="$1" gap="$0.5" borderLeftWidth={1} borderColor="$borderColor">
          {step.detail!.map((line, i) => (
            <SizableText key={`${step.key}-${i}`} size="$2" color="$soft" pl="$2">
              {line}
            </SizableText>
          ))}
        </YStack>
      ) : null}
    </YStack>
  )
}

export interface ProgressBlockProps extends Col {
  steps: Step[]
  /** The work has stopped. Draws the tick. */
  done?: boolean
  doneLabel?: string
  /** The agent's message, at full size under the steps. */
  children?: ReactNode
}

export function ProgressBlock({
  steps,
  done = false,
  doneLabel = 'Done',
  children,
  ...rest
}: ProgressBlockProps) {
  return (
    <YStack {...slot('progress-block')} gap="$1.5" {...rest}>
      {steps.map((step) => (
        <Row key={step.key} step={step} />
      ))}

      {done ? (
        <XStack items="center" gap="$1.5">
          <Check size={13} opacity={0.75} />
          <SizableText size="$2" color="$quiet">
            {doneLabel}
          </SizableText>
        </XStack>
      ) : null}

      {children ? <YStack pt="$1">{children}</YStack> : null}
    </YStack>
  )
}

/** The shape `steps()` reads. A session event, or anything that looks like one. */
export interface Event {
  seq?: number
  id?: string
  kind?: string
  actor?: string
  payload?: unknown
}

/** Map an event's kind onto a step kind. Unknown kinds stay generic rather than
 *  being forced into the nearest icon, which would misreport what happened. */
function kindOf(kind: string): StepKind {
  const k = kind.toLowerCase()
  if (k.includes('think') || k.includes('reason')) return 'think'
  if (k.includes('search') || k.includes('grep')) return 'search'
  if (k.includes('read') || k.includes('file')) return 'read'
  if (k.includes('tool') || k.includes('exec') || k.includes('command')) return 'run'
  if (k.includes('write') || k.includes('edit') || k.includes('patch')) return 'write'
  if (k.includes('error') || k.includes('fail')) return 'error'
  return 'step'
}

/** One readable line out of whatever a payload turned out to be. */
function say(payload: unknown): string {
  if (payload == null) return ''
  if (typeof payload === 'string') return payload
  if (typeof payload !== 'object') return String(payload)
  const bag = payload as Record<string, unknown>
  for (const key of ['text', 'message', 'preview', 'content', 'name', 'command', 'path']) {
    const found = bag[key]
    if (typeof found === 'string' && found.trim()) return found
  }
  try {
    return JSON.stringify(payload)
  } catch {
    return ''
  }
}

/**
 * Group a run's events into steps.
 *
 * Consecutive events of the same kind become ONE step whose detail is their
 * lines — that is what turns twelve `tool-call` events into "Read 2 files" with
 * two names under it. `message` events are NOT steps: they are the answer, and
 * the caller renders them as `children`.
 */
export function steps(events: Event[]): { steps: Step[]; message: string } {
  const out: Step[] = []
  const said: string[] = []

  events.forEach((event, i) => {
    const kind = event.kind ?? 'step'
    const line = say(event.payload).trim()
    if (kind === 'message') {
      if (line) said.push(line)
      return
    }
    const step = kindOf(kind)
    const last = out[out.length - 1]
    if (last && last.kind === step) {
      if (line) (last.detail ??= []).push(line)
      return
    }
    out.push({
      key: `${event.seq ?? event.id ?? i}`,
      kind: step,
      label: kind,
      detail: line ? [line] : undefined,
    })
  })

  // A step's label counts what it did, once the run is grouped — "Read 2 files"
  // rather than "read". The verb is the event's own; the number is ours.
  for (const step of out) {
    const n = step.detail?.length ?? 0
    if (n > 1) step.label = `${step.label} ${n}`
  }

  return { steps: out, message: said.join('') }
}
