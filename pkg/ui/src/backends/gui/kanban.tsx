'use client'

/**
 * Kanban — a board of columns holding draggable cards, with search, column
 * limits, labels, priority, assignee and due date, and a create/edit dialog.
 *
 * The board is controlled: callers hold `KanbanBoardData` and pass it down
 * with `onUpdateBoard`, so every mutation (drag, add, edit, delete) computes
 * the next board and hands it back rather than mutating in place. Drag and
 * drop is native HTML5 drag events (`draggable`, `dataTransfer`) gated by
 * `isWeb`, the same split `dropzone.tsx` uses for file drops — there is no
 * `@dnd-kit` in this workspace and none is needed for a same-tab reorder.
 */
import { SizableText, XStack, YStack, isWeb, styled } from '@hanzo/gui'
import { Calendar, MoreHorizontal, Plus, Search, User, X } from '@hanzogui/lucide-icons-2'
import * as React from 'react'
import { Badge } from './badge'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { ink } from './ink'
import { Input } from './input'
import { Label } from './label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { slot } from './slot'
import { Textarea } from './textarea'
import { sx } from '../../sx'

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export type KanbanPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface KanbanCard {
  id: string
  title: string
  description?: string
  labels?: KanbanLabel[]
  priority?: KanbanPriority
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
  limit?: number
}

export interface KanbanBoardData {
  id: string
  title: string
  columns: KanbanColumn[]
  labels: KanbanLabel[]
}

const PRIORITY_COLOR: Record<KanbanPriority, string> = {
  low: '$blue9',
  medium: '$yellow9',
  high: '$orange9',
  urgent: '$red9',
}

type Drag = { cardId: string; columnId: string }

/** Move a card from its column to `toColumnId`, optionally before `beforeId`. */
const moveCard = (
  board: KanbanBoardData,
  drag: Drag,
  toColumnId: string,
  beforeId?: string,
): KanbanBoardData => {
  const from = board.columns.find((col) => col.id === drag.columnId)
  const card = from?.cards.find((c) => c.id === drag.cardId)
  if (!from || !card) return board
  const to = board.columns.find((col) => col.id === toColumnId)
  if (!to) return board
  if (from.id !== to.id && to.limit && to.cards.length >= to.limit) return board

  return {
    ...board,
    columns: board.columns.map((col) => {
      if (col.id === from.id && col.id === to.id) {
        const rest = col.cards.filter((c) => c.id !== card.id)
        const at = beforeId ? rest.findIndex((c) => c.id === beforeId) : rest.length
        const index = at < 0 ? rest.length : at
        return { ...col, cards: [...rest.slice(0, index), card, ...rest.slice(index)] }
      }
      if (col.id === from.id) return { ...col, cards: col.cards.filter((c) => c.id !== card.id) }
      if (col.id === to.id) {
        const at = beforeId ? col.cards.findIndex((c) => c.id === beforeId) : col.cards.length
        const index = at < 0 ? col.cards.length : at
        return { ...col, cards: [...col.cards.slice(0, index), card, ...col.cards.slice(index)] }
      }
      return col
    }),
  }
}

const matches = (card: KanbanCard, query: string) => {
  const q = query.toLowerCase()
  return (
    card.title.toLowerCase().includes(q) ||
    (card.description?.toLowerCase().includes(q) ?? false) ||
    (card.labels?.some((label) => label.name.toLowerCase().includes(q)) ?? false)
  )
}

const BoardFrame = styled(YStack, { name: 'Kanban', flex: 1, height: '100%' })

const ColumnFrame = styled(YStack, {
  name: 'KanbanColumn',
  bg: '$raised',
  rounded: '$4',
  p: '$4',
  minW: 280,
  maxW: 280,
  gap: '$3',

  variants: {
    over: { true: { borderColor: '$borderColor', borderWidth: 1 } },
  } as const,
})

const CardFrame = styled(YStack, {
  name: 'KanbanCard',
  bg: '$background',
  borderWidth: 1,
  borderColor: '$borderColor',
  rounded: '$4',
  p: '$3',
  gap: '$2',
  cursor: 'grab',

  variants: {
    dragging: { true: { opacity: 0.5 } },
  } as const,
})

function KanbanCardView({
  card,
  drag,
  onDragStart,
  onDragEnd,
  onDropBefore,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  drag: Drag | null
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onDropBefore: (e: React.DragEvent) => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <CardFrame
      {...slot('kanban-card')}
      data-card-id={card.id}
      dragging={drag?.cardId === card.id}
      {...(isWeb
        ? {
            draggable: true,
            onDragStart,
            onDragEnd,
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
            onDrop: (e: React.DragEvent) => {
              e.preventDefault()
              e.stopPropagation()
              onDropBefore(e)
            },
          }
        : null)}
    >
      <XStack justify="space-between" items="flex-start" gap="$2">
        {ink(card.title, SizableText, { fontWeight: '600', fontSize: '$3', flex: 1 })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button {...slot('kanban-card-menu')} variant="ghost" size="icon-sm" aria-label="Card actions">
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </XStack>

      {card.description ? ink(card.description, SizableText, { fontSize: '$1', color: '$quiet' }) : null}

      {card.labels && card.labels.length > 0 ? (
        <XStack gap="$1" flexWrap="wrap">
          {card.labels.map((label) => (
            <Badge
              key={label.id}
              variant="outline"
              style={{ borderColor: label.color, color: label.color }}
            >
              {label.name}
            </Badge>
          ))}
        </XStack>
      ) : null}

      <XStack justify="space-between" items="center">
        <XStack gap="$2" items="center">
          {card.priority ? (
            <Badge {...slot('kanban-card-priority')} variant="outline" style={{ borderColor: PRIORITY_COLOR[card.priority], color: PRIORITY_COLOR[card.priority] }}>
              {card.priority}
            </Badge>
          ) : null}
          {card.assignee ? (
            <XStack gap="$1" items="center">
              <User size={12} color="$quiet" />
              {ink(card.assignee, SizableText, { fontSize: '$1', color: '$quiet' })}
            </XStack>
          ) : null}
        </XStack>
        {card.dueDate ? (
          <XStack gap="$1" items="center">
            <Calendar size={12} color="$quiet" />
            {ink(new Date(card.dueDate).toLocaleDateString(), SizableText, { fontSize: '$1', color: '$quiet' })}
          </XStack>
        ) : null}
      </XStack>
    </CardFrame>
  )
}

function KanbanColumnView({
  column,
  drag,
  onDragStart,
  onDragEnd,
  onDropOn,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  column: KanbanColumn
  drag: Drag | null
  onDragStart: (card: KanbanCard) => (e: React.DragEvent) => void
  onDragEnd: () => void
  onDropOn: (columnId: string, beforeId?: string) => (e: React.DragEvent) => void
  onAddCard: () => void
  onEditCard: (card: KanbanCard) => void
  onDeleteCard: (cardId: string) => void
}) {
  const full = column.limit != null && column.cards.length >= column.limit

  return (
    <ColumnFrame
      {...slot('kanban-column')}
      data-column-id={column.id}
      {...(isWeb
        ? {
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
            onDrop: onDropOn(column.id),
          }
        : null)}
    >
      <XStack justify="space-between" items="center">
        <XStack gap="$2" items="center">
          {ink(column.title, SizableText, { fontWeight: '600', fontSize: '$3' })}
          <Badge variant="secondary">
            {column.limit != null ? `${column.cards.length}/${column.limit}` : column.cards.length}
          </Badge>
        </XStack>
        <Button
          {...slot('kanban-add-card')}
          variant="ghost"
          size="icon-sm"
          aria-label={`Add card to ${column.title}`}
          disabled={full}
          onPress={onAddCard}
        >
          <Plus size={14} />
        </Button>
      </XStack>

      <YStack gap="$3" minH={40}>
        {column.cards.map((card) => (
          <KanbanCardView
            key={card.id}
            card={card}
            drag={drag}
            onDragStart={onDragStart(card)}
            onDragEnd={onDragEnd}
            onDropBefore={onDropOn(column.id, card.id)}
            onEdit={() => onEditCard(card)}
            onDelete={() => onDeleteCard(card.id)}
          />
        ))}
      </YStack>
    </ColumnFrame>
  )
}

function KanbanCardDialog({
  open,
  onOpenChange,
  card,
  labels,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: KanbanCard
  labels: KanbanLabel[]
  onSave: (data: Partial<KanbanCard>) => void
}) {
  const [title, setTitle] = React.useState(card?.title ?? '')
  const [description, setDescription] = React.useState(card?.description ?? '')
  const [priority, setPriority] = React.useState<KanbanPriority>(card?.priority ?? 'low')
  const [assignee, setAssignee] = React.useState(card?.assignee ?? '')
  const [dueDate, setDueDate] = React.useState(card?.dueDate ?? '')

  React.useEffect(() => {
    setTitle(card?.title ?? '')
    setDescription(card?.description ?? '')
    setPriority(card?.priority ?? 'low')
    setAssignee(card?.assignee ?? '')
    setDueDate(card?.dueDate ?? '')
  }, [card, open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title, description, priority, assignee, dueDate, labels: card?.labels })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent {...slot('kanban-card-dialog')}>
        <DialogHeader>
          <DialogTitle>{card ? 'Edit Card' : 'Create Card'}</DialogTitle>
          <DialogDescription>
            {card ? 'Update the card details below.' : 'Create a new card for your kanban board.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <YStack gap="$3">
            <YStack gap="$1">
              <Label htmlFor="kanban-title">Title</Label>
              <Input id="kanban-title" value={title} onChangeText={setTitle} placeholder="Card title" />
            </YStack>
            <YStack gap="$1">
              <Label htmlFor="kanban-description">Description</Label>
              <Textarea id="kanban-description" value={description} onChangeText={setDescription} rows={3} />
            </YStack>
            <XStack gap="$3">
              <YStack gap="$1" flex={1}>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v: string) => setPriority(v as KanbanPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </YStack>
              <YStack gap="$1" flex={1}>
                <Label htmlFor="kanban-assignee">Assignee</Label>
                <Input id="kanban-assignee" value={assignee} onChangeText={setAssignee} placeholder="Assign to..." />
              </YStack>
            </XStack>
            <YStack gap="$1">
              <Label htmlFor="kanban-due">Due date</Label>
              <Input id="kanban-due" type="date" value={dueDate} onChangeText={setDueDate} />
            </YStack>
          </YStack>

          <DialogFooter mt="$4">
            <Button type="button" variant="outline" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{card ? 'Update' : 'Create'} Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type KanbanBoardProps = {
  board: KanbanBoardData
  onUpdateBoard: (board: KanbanBoardData) => void
  className?: string
}

export function KanbanBoard({ board, onUpdateBoard, className }: KanbanBoardProps) {
  const [query, setQuery] = React.useState('')
  const [drag, setDrag] = React.useState<Drag | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingCard, setEditingCard] = React.useState<KanbanCard | undefined>(undefined)
  const [targetColumnId, setTargetColumnId] = React.useState('')

  const shown: KanbanBoardData = React.useMemo(
    () =>
      query.trim()
        ? { ...board, columns: board.columns.map((col) => ({ ...col, cards: col.cards.filter((c) => matches(c, query)) })) }
        : board,
    [board, query],
  )

  const onDragStart = (card: KanbanCard) => (e: React.DragEvent) => {
    const columnId = board.columns.find((col) => col.cards.some((c) => c.id === card.id))?.id ?? ''
    setDrag({ cardId: card.id, columnId })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', card.id)
  }
  const onDragEnd = () => setDrag(null)
  const onDropOn = (columnId: string, beforeId?: string) => (e: React.DragEvent) => {
    e.preventDefault()
    if (!drag) return
    const next = moveCard(board, drag, columnId, beforeId)
    if (next !== board) onUpdateBoard(next)
    setDrag(null)
  }

  const openAdd = (columnId: string) => {
    setTargetColumnId(columnId)
    setEditingCard(undefined)
    setDialogOpen(true)
  }
  const openEdit = (card: KanbanCard) => {
    setEditingCard(card)
    setTargetColumnId('')
    setDialogOpen(true)
  }

  const deleteCard = (cardId: string) =>
    onUpdateBoard({
      ...board,
      columns: board.columns.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== cardId) })),
    })

  const saveCard = (data: Partial<KanbanCard>) => {
    const now = new Date().toISOString()
    if (editingCard) {
      onUpdateBoard({
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          cards: col.cards.map((c) => (c.id === editingCard.id ? { ...c, ...data, updatedAt: now } : c)),
        })),
      })
      return
    }
    const card: KanbanCard = {
      id: `card-${Date.now()}`,
      title: data.title ?? '',
      description: data.description,
      priority: data.priority,
      assignee: data.assignee,
      dueDate: data.dueDate,
      labels: data.labels,
      createdAt: now,
      updatedAt: now,
    }
    onUpdateBoard({
      ...board,
      columns: board.columns.map((col) => (col.id === targetColumnId ? { ...col, cards: [...col.cards, card] } : col)),
    })
  }

  return (
    <BoardFrame {...slot('kanban')} {...sx(className)}>
      <XStack {...slot('kanban-header')} justify="space-between" items="center" p="$4" borderBottomWidth={1} borderColor="$borderColor">
        {ink(board.title, SizableText, { fontSize: '$6', fontWeight: '700' })}
        <XStack position="relative" width={256} items="center">
          <XStack position="absolute" l="$2" pointerEvents="none">
            <Search size={14} color="$quiet" />
          </XStack>
          <Input
            {...slot('kanban-search')}
            placeholder="Search cards..."
            value={query}
            onChangeText={setQuery}
            pl="$7"
          />
          {query ? (
            <XStack position="absolute" r="$2" cursor="pointer" onPress={() => setQuery('')} aria-label="Clear search">
              <X size={14} />
            </XStack>
          ) : null}
        </XStack>
      </XStack>

      <XStack {...slot('kanban-board')} gap="$4" p="$4" flex={1} overflow="scroll">
        {shown.columns.map((column) => (
          <KanbanColumnView
            key={column.id}
            column={column}
            drag={drag}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDropOn={onDropOn}
            onAddCard={() => openAdd(column.id)}
            onEditCard={openEdit}
            onDeleteCard={deleteCard}
          />
        ))}
      </XStack>

      <KanbanCardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editingCard}
        labels={board.labels}
        onSave={saveCard}
      />
    </BoardFrame>
  )
}
