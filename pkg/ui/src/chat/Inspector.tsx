'use client'

/**
 * Inspector — what the agent did, beside what it said.
 *
 * The thread carries the answer. This carries the evidence: a summary at the
 * top, then the run's own regions underneath — what it was given, what it
 * produced, what ran on the way. It is the pane a person reads to decide
 * whether to believe the answer, which is why the summary is first and the
 * detail is under it rather than the other way round.
 *
 * It is the CONTENTS of the right rail, not the rail. `Aside` is the column —
 * the border, the width, the fact that it is a column at all — and this goes
 * inside it. Two components because a surface hides the rail at narrow widths
 * by not rendering it, and that decision has nothing to do with what is in it.
 *
 * ONE inspector, whatever the run was. A section carries `facts` (name to
 * value) or `parts` (drawn by `Parts`), and `MessagePart` already covers every
 * shape a run produces: tool calls and their results for a chat turn, files and
 * console output for a coding run, `citation` for a research run's sources, an
 * `artifact` for anything it made. A second panel per kind of run would be four
 * copies of this file disagreeing about spacing.
 *
 * A section with nothing in it does not render, so a caller passes the same
 * list every time and does not write the emptiness checks.
 */
import { ScrollView, SizableText, XStack, YStack } from '@hanzo/gui'
import type { ComponentProps, ReactNode } from 'react'

import { slot } from '../backends/gui/slot'
import type { Facts } from './directive'
import { Code } from './Code'
import { Parts, show, type MessagePart, type PartActions } from './Parts'

/** One region of a run. Either half may be present; both is fine. */
export interface Section {
  /** The heading. */
  name: string
  /** Drawn as a table of name and value. */
  facts?: Facts
  /** Drawn by `Parts` — steps, artifacts, sources, files. */
  parts?: readonly MessagePart[]
}

const filled = (section: Section): boolean =>
  (section.facts != null && Object.keys(section.facts).length > 0) ||
  (section.parts != null && section.parts.length > 0)

export interface InspectorProps
  extends PartActions,
    Omit<ComponentProps<typeof YStack>, 'children'> {
  /** The pane's own heading. */
  title?: string
  /** One paragraph: what the run did. Absent, no summary block draws. */
  summary?: string
  /** The regions, in order. Empty ones are skipped. */
  sections?: readonly Section[]
  /** Shown when there is no summary and every section is empty. */
  placeholder?: ReactNode
}

export function Inspector({
  title = 'Run',
  summary,
  sections = [],
  placeholder,
  prose,
  onRetry,
  onOpen,
  onSource,
  ...props
}: InspectorProps) {
  const shown = sections.filter(filled)
  const bare = summary == null && shown.length === 0

  return (
    <YStack {...slot('inspector')} flex={1} minH={0} width="100%" {...props}>
      <XStack items="center" px="$1" pb="$2" shrink={0}>
        <SizableText size="$1" color="$soft" fontWeight="600">
          {title}
        </SizableText>
      </XStack>

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack gap="$4" pb="$4">
          {summary ? (
            <YStack
              {...slot('inspector-summary')}
              p="$3"
              gap="$2"
              rounded="$4"
              borderWidth={1}
              borderColor="$borderColor"
              bg="$panel"
            >
              <SizableText size="$2" color="$ink">
                {summary}
              </SizableText>
            </YStack>
          ) : null}

          {shown.map((section) => (
            <YStack key={section.name} {...slot('inspector-section')} gap="$2">
              <SizableText size="$1" color="$quiet" fontWeight="600">
                {section.name}
              </SizableText>
              {section.facts ? <Table facts={section.facts} /> : null}
              {section.parts?.length ? (
                <Parts
                  parts={section.parts}
                  prose={prose}
                  onRetry={onRetry}
                  onOpen={onOpen}
                  onSource={onSource}
                />
              ) : null}
            </YStack>
          ))}

          {bare && placeholder != null ? (
            <SizableText size="$2" color="$soft">
              {placeholder}
            </SizableText>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  )
}

/**
 * A record, as rows.
 *
 * A string is its own presentation; anything else goes through `Code`, because
 * a nested object flattened into a line is unreadable and `show` already
 * serialises one safely. That is the only rule here, and it is why this is a
 * dozen lines rather than a formatting library.
 */
function Table({ facts }: { facts: Facts }) {
  return (
    <YStack
      {...slot('inspector-facts')}
      rounded="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
    >
      {Object.entries(facts).map(([name, value], i) => (
        <YStack
          key={name}
          gap="$1.5"
          px="$3"
          py="$2"
          borderTopWidth={i === 0 ? 0 : 1}
          borderColor="$borderColor"
        >
          <SizableText size="$1" color="$quiet">
            {name}
          </SizableText>
          {typeof value === 'string' ? (
            <SizableText size="$2" color="$ink">
              {value}
            </SizableText>
          ) : (
            <Code language="json">{show(value)}</Code>
          )}
        </YStack>
      ))}
    </YStack>
  )
}
