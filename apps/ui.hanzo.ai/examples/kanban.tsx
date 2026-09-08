import { useState } from 'react'
import { YStack } from '@hanzo/gui'
import { KanbanBoard, type KanbanBoardData } from '@hanzo/ui'

const seed = (): KanbanBoardData => ({
  id: 'board-1',
  title: 'Project Board',
  labels: [
    { id: 'bug', name: 'Bug', color: '#ef4444' },
    { id: 'feature', name: 'Feature', color: '#22c55e' },
  ],
  columns: [
    {
      id: 'todo',
      title: 'To Do',
      limit: 5,
      cards: [
        {
          id: 'card-1',
          title: 'Setup project',
          description: 'Initialize the project structure',
          priority: 'high',
          assignee: 'Alex',
          labels: [{ id: 'bug', name: 'Bug', color: '#ef4444' }],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
    {
      id: 'doing',
      title: 'In Progress',
      cards: [
        {
          id: 'card-2',
          title: 'Build the board',
          priority: 'medium',
          dueDate: '2024-12-31',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
    { id: 'done', title: 'Done', cards: [] },
  ],
})

/** Default — columns of draggable cards with search, priority, labels and a column limit. */
export function Default() {
  const [board, setBoard] = useState(seed)
  return (
    <YStack width="100%" height={520}>
      <KanbanBoard board={board} onUpdateBoard={setBoard} />
    </YStack>
  )
}

/** Column limit — "To Do" caps at one card; its Add button disables once that's reached. */
export function ColumnLimit() {
  const [board, setBoard] = useState<KanbanBoardData>(() => {
    const next = seed()
    next.columns[0].limit = 1
    return next
  })
  return (
    <YStack width="100%" height={420}>
      <KanbanBoard board={board} onUpdateBoard={setBoard} />
    </YStack>
  )
}

/** Empty board — three columns with no cards yet, ready to fill in from the Add button. */
export function Empty() {
  const [board, setBoard] = useState<KanbanBoardData>({
    id: 'board-2',
    title: 'New Board',
    labels: [],
    columns: [
      { id: 'todo', title: 'To Do', cards: [] },
      { id: 'doing', title: 'In Progress', cards: [] },
      { id: 'done', title: 'Done', cards: [] },
    ],
  })
  return (
    <YStack width="100%" height={420}>
      <KanbanBoard board={board} onUpdateBoard={setBoard} />
    </YStack>
  )
}
