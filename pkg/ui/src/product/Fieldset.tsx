'use client'

/**
 * Fieldset — a titled group of settings, and the surface it sits on.
 *
 * The name is the HTML one and the right one: a bounded set of related controls
 * under a legend. `FieldRow` and the `Field*` controls are what go inside it;
 * this is the box they were always drawn in and that no package ever owned, so
 * every settings page drew its own — hanzo.app twice, the console once, billing
 * across six panels — and they disagreed on the radius, the fill and, in one
 * case, on whether a destructive group should be a solid red card.
 *
 * `Panel` (from `Metric`) is NOT this: it is a dashboard tile sized to sit in a
 * row of metrics. A settings group is full width, carries a legend and an icon,
 * and has a destructive register. Two boxes, two jobs, two names.
 *
 * Danger says danger with its EDGE. A solid saturated fill makes the one group
 * you should find only when you are looking for it the loudest object on the
 * page; colour is an accent here, so the border carries it and the surface stays
 * on the ladder with its neighbours.
 */
import type { ReactNode } from 'react'
import { Text, XStack, YStack } from '@hanzo/gui'

export type FieldsetProps = {
  /** The legend. Sentence case — it names a group, it is not a headline. */
  title?: string
  /** Optional glyph before the legend, at the legend's own size. */
  icon?: ReactNode
  /** One line under the legend saying what the group is for. */
  description?: string
  /** Right-aligned control on the legend line (a link, a small action). */
  action?: ReactNode
  /** The destructive register — irreversible actions only. */
  danger?: boolean
  children: ReactNode
}

export function Fieldset({ title, icon, description, action, danger, children }: FieldsetProps) {
  const edge = danger ? '$red9' : '$borderColor'
  return (
    <YStack
      width="100%"
      p="$4"
      gap="$3"
      rounded="$4"
      borderWidth={1}
      borderColor={edge}
      bg="$color2"
    >
      {title || action ? (
        <XStack items="center" gap="$2" justify="space-between" flexWrap="wrap">
          <XStack items="center" gap="$2" flex={1} minW={0}>
            {icon}
            {title ? (
              <Text fontSize="$3" fontWeight="500" color={danger ? '$red10' : '$color12'}>
                {title}
              </Text>
            ) : null}
          </XStack>
          {action}
        </XStack>
      ) : null}

      {description ? (
        // Sits under the legend, not beside it: a description that shares the
        // line with the title competes with it and wraps first on a phone.
        <Text fontSize="$2" color="$color11">
          {description}
        </Text>
      ) : null}

      <YStack gap="$3">{children}</YStack>
    </YStack>
  )
}
