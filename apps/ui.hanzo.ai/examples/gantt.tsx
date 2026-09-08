import { YStack } from '@hanzo/gui'
import { Gantt, type GanttTask } from '@hanzo/ui'

const tasks: GanttTask[] = [
  { id: '1', name: 'Project Planning', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15), progress: 100 },
  { id: '2', name: 'Design Phase', start: new Date(2024, 0, 10), end: new Date(2024, 1, 5), progress: 75 },
  { id: '3', name: 'Development', start: new Date(2024, 1, 1), end: new Date(2024, 3, 30), progress: 45 },
  { id: '4', name: 'Testing', start: new Date(2024, 3, 15), end: new Date(2024, 4, 15), progress: 0 },
]

/** Default — one row per task, each with a progress track and its date range. */
export function Default() {
  return (
    <YStack width="100%" maxW={640}>
      <Gantt tasks={tasks} />
    </YStack>
  )
}

/** Empty — with no tasks the chart shows a placeholder instead of nothing. */
export function Empty() {
  return (
    <YStack width="100%" maxW={640}>
      <Gantt tasks={[]} />
    </YStack>
  )
}
