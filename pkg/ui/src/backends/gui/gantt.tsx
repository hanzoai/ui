'use client'

/**
 * Gantt — a task list with a per-row progress track and a start/end date.
 *
 * One row is three lines: name and percent, a filled track, then the two
 * dates. The substrate is @hanzo/gui: `styled()` frames and theme tokens, so
 * it renders on web, native (expo) and Tauri. An empty task list renders a
 * placeholder rather than nothing.
 */
import { SizableText, XStack, YStack, styled } from '@hanzo/gui'
import { ink } from './ink'
import { slot } from './slot'

const TRACK_HEIGHT = 32

export interface GanttTask {
  id: string
  name: string
  start: Date
  end: Date
  /** 0–100. Defaults to 0. */
  progress?: number
}

const GanttFrame = styled(YStack, {
  name: 'Gantt',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$6',
  p: '$6',
})

const RowFrame = styled(YStack, { name: 'GanttRow', gap: '$2' })

const TrackFrame = styled(YStack, {
  name: 'GanttTrack',
  height: TRACK_HEIGHT,
  rounded: '$3',
  bg: '$edge',
  overflow: 'hidden',
})

const BarFrame = styled(YStack, {
  name: 'GanttBar',
  height: '100%',
  rounded: '$3',
  bg: '$accentBackground',
})

export type GanttProps = Omit<import('react').ComponentProps<typeof GanttFrame>, 'children'> & {
  tasks?: GanttTask[]
}

export function Gantt({ tasks = [], ...props }: GanttProps) {
  return (
    <GanttFrame {...slot('gantt')} {...props}>
      {tasks.length === 0 ? (
        <XStack {...slot('gantt-empty')} items="center" justify="center" p="$8">
          {ink('No tasks available. Add tasks to display Gantt chart.', SizableText, {
            size: '$2',
            color: '$quiet',
          })}
        </XStack>
      ) : (
        <YStack gap="$4">
          {tasks.map((task) => {
            const progress = Math.min(100, Math.max(0, task.progress ?? 0))
            return (
              <RowFrame key={task.id} {...slot('gantt-task')} data-progress={progress}>
                <XStack justify="space-between" items="center">
                  {ink(task.name, SizableText, { size: '$3', fontWeight: '600' })}
                  {ink(`${progress}%`, SizableText, { size: '$3', color: '$quiet' })}
                </XStack>
                <TrackFrame {...slot('gantt-track')}>
                  <BarFrame {...slot('gantt-bar')} width={`${progress}%`} />
                </TrackFrame>
                <XStack justify="space-between">
                  {ink(task.start.toLocaleDateString(), SizableText, { size: '$1', color: '$quiet' })}
                  {ink(task.end.toLocaleDateString(), SizableText, { size: '$1', color: '$quiet' })}
                </XStack>
              </RowFrame>
            )
          })}
        </YStack>
      )}
    </GanttFrame>
  )
}
