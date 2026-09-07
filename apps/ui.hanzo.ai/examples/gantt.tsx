import { YStack } from '@hanzo/gui'
import { Gantt } from '@hanzo/ui'

const project = [
  { id: '1', name: 'Project Planning', start: new Date(2024, 0, 1), end: new Date(2024, 0, 15), progress: 100 },
  { id: '2', name: 'Design Phase', start: new Date(2024, 0, 10), end: new Date(2024, 1, 5), progress: 75 },
  { id: '3', name: 'Development', start: new Date(2024, 1, 1), end: new Date(2024, 3, 30), progress: 45 },
  { id: '4', name: 'Testing', start: new Date(2024, 3, 15), end: new Date(2024, 4, 15), progress: 0 },
]

/** Default — four tasks, each a labelled progress bar between its start and end date. */
export function Default() {
  return (
    <YStack width="100%" maxW={720}>
      <Gantt tasks={project} />
    </YStack>
  )
}

/** Empty — with no tasks the card shows a placeholder instead of an empty list. */
export function Empty() {
  return (
    <YStack width="100%" maxW={720}>
      <Gantt tasks={[]} />
    </YStack>
  )
}

/** Single task in progress — one row, midway through, so the fill sits at half width. */
export function InProgress() {
  return (
    <YStack width="100%" maxW={720}>
      <Gantt
        tasks={[
          { id: '1', name: 'Migrate database', start: new Date(2024, 5, 1), end: new Date(2024, 5, 10), progress: 50 },
        ]}
      />
    </YStack>
  )
}
