'use client'

/**
 * Gantt — a vertical list of tasks, each drawn as a labelled progress bar
 * spanning its own start and end date.
 *
 * One row is one task: a name and a percentage on top, a filled track for
 * progress in the middle, the start and end dates below. No timeline axis is
 * computed — each row's fill is just `progress`, so the component stays a
 * plain list (one YStack, one axis) rather than a two-dimensional layout, and
 * needs no `Grid`.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import type { ComponentProps } from 'react'
import { ink } from './ink'
import { slot } from './slot'

export interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  /** 0–100. Defaults to 0. */
  progress?: number
}

const Frame = styled(YStack, {
  name: 'Gantt',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  p: '$6',
  gap: '$4',
})

const Track = styled(YStack, {
  name: 'GanttTrack',
  height: 32,
  rounded: '$3',
  bg: '$edge',
  overflow: 'hidden',
})

const Fill = styled(YStack, {
  name: 'GanttFill',
  height: '100%',
  rounded: '$3',
  bg: '$accentBackground',
})

const clamp = (n: number) => Math.min(100, Math.max(0, n))

export type GanttProps = ComponentProps<typeof Frame> & {
  tasks?: GanttTask[]
}

function Gantt({ tasks = [], ...props }: GanttProps) {
  return (
    <Frame {...slot('gantt')} {...props}>
      {tasks.length === 0 ? (
        <XStack {...slot('gantt-empty')} items="center" justify="center" p="$8">
          {ink('No tasks available. Add tasks to display Gantt chart.', SizableText, {
            size: '$2',
            color: '$quiet',
          })}
        </XStack>
      ) : (
        tasks.map((task) => {
          const progress = clamp(task.progress ?? 0)
          return (
            <YStack key={task.id} {...slot('gantt-task')} gap="$2">
              <XStack justify="space-between">
                {ink(task.name, SizableText, { size: '$2', fontWeight: '600' })}
                {ink(`${progress}%`, SizableText, { size: '$2', color: '$quiet' })}
              </XStack>
              <Track {...slot('gantt-track')}>
                <Fill {...slot('gantt-fill')} width={`${progress}%`} />
              </Track>
              <XStack justify="space-between">
                {ink(task.start.toLocaleDateString(), SizableText, { size: '$1', color: '$quiet' })}
                {ink(task.end.toLocaleDateString(), SizableText, { size: '$1', color: '$quiet' })}
              </XStack>
            </YStack>
          )
        })
      )}
    </Frame>
  )
}

export { Gantt }
