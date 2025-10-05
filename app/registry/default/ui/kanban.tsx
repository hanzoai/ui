"use client"

import * as React from "react"
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Calendar,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  User,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "./badge"
import { Button } from "./button"
import { Card, CardContent, CardHeader } from "./card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Input } from "./input"
import { Label } from "./label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Textarea } from "./textarea"

// Types
export interface KanbanCard {
  id: string
  title: string
  description?: string
  labels?: KanbanLabel[]
  priority?: "low" | "medium" | "high" | "urgent"
  assignee?: string
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface KanbanLabel {
  id: string
  name: string
  color: string
}

export interface KanbanColumn {
  id: string
  title: string
  cards: KanbanCard[]
  limit?: number
}

export interface KanbanBoard {
  id: string
  title: string
  columns: KanbanColumn[]
  labels: KanbanLabel[]
}

// Priority variants
const priorityVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
  {
    variants: {
      priority: {
        low: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
        medium:
          "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
        high: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
        urgent:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400",
      },
    },
    defaultVariants: {
      priority: "low",
    },
  }
)

// Sortable Card Component
function SortableCard({
  card,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  onEdit: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <KanbanCardComponent card={card} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

// Card Component
function KanbanCardComponent({
  card,
  onEdit,
  onDelete,
}: {
  card: KanbanCard
  onEdit: (card: KanbanCard) => void
  onDelete: (cardId: string) => void
}) {
  return (
    <Card className="mb-3 group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm leading-tight mb-2 break-words">
              {card.title}
            </h4>
            {card.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {card.description}
              </p>
            )}

            {/* Labels */}
            {card.labels && card.labels.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {card.labels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className="text-xs h-5"
                    style={{
                      backgroundColor: `${label.color}20`,
                      borderColor: label.color,
                      color: label.color,
                    }}
                  >
                    {label.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Priority and Meta */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {card.priority && (
                  <span
                    className={cn(
                      priorityVariants({ priority: card.priority })
                    )}
                  >
                    {card.priority}
                  </span>
                )}
                {card.assignee && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{card.assignee}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {card.dueDate && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(card.dueDate).toLocaleDateString()}</span>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(card)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(card.id)}
                      className="text-destructive"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}

// Column Component
function KanbanColumnComponent({
  column,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: {
  column: KanbanColumn
  onAddCard: (columnId: string) => void
  onEditCard: (card: KanbanCard) => void
  onDeleteCard: (cardId: string) => void
}) {
  const { setNodeRef } = useSortable({ id: column.id })

  return (
    <div
      ref={setNodeRef}
      className="bg-muted/50 rounded-lg p-4 min-w-[280px] max-w-[280px] flex flex-col"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {column.cards.length}
            {column.limit && `/${column.limit}`}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAddCard(column.id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Cards Container */}
      <SortableContext
        items={column.cards.map((card) => card.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 min-h-[200px]">
          {column.cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onEdit={onEditCard}
              onDelete={onDeleteCard}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// Card Form Dialog
function CardFormDialog({
  open,
  onOpenChange,
  card,
  onSave,
  labels,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: KanbanCard
  onSave: (cardData: Partial<KanbanCard>) => void
  labels: KanbanLabel[]
}) {
  const [formData, setFormData] = React.useState({
    title: card?.title || "",
    description: card?.description || "",
    priority: card?.priority || "low",
    assignee: card?.assignee || "",
    dueDate: card?.dueDate || "",
    labels: card?.labels?.map((l) => l.id) || [],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSave({
      ...card,
      ...formData,
      labels: labels.filter((l) => formData.labels.includes(l.id)),
      updatedAt: new Date().toISOString(),
    })
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || "",
        priority: card.priority || "low",
        assignee: card.assignee || "",
        dueDate: card.dueDate || "",
        labels: card.labels?.map((l) => l.id) || [],
      })
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "low",
        assignee: "",
        dueDate: "",
        labels: [],
      })
    }
  }, [card])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Edit Card" : "Create Card"}</DialogTitle>
          <DialogDescription>
            {card
              ? "Update the card details below."
              : "Create a new card for your kanban board."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter card title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter card description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value as any }))
                }
              >
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
            </div>

            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignee: e.target.value }))
                }
                placeholder="Assign to..."
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{card ? "Update" : "Create"} Card</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Main Kanban Board Component
export interface KanbanBoardProps {
  board: KanbanBoard
  onUpdateBoard: (board: KanbanBoard) => void
  className?: string
}

export function KanbanBoard({
  board,
  onUpdateBoard,
  className,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = React.useState<KanbanCard | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [cardFormOpen, setCardFormOpen] = React.useState(false)
  const [editingCard, setEditingCard] = React.useState<KanbanCard | null>(null)
  const [activeColumnId, setActiveColumnId] = React.useState<string>("")

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Filter cards based on search query
  const filteredBoard = React.useMemo(() => {
    if (!searchQuery.trim()) return board

    const filtered = {
      ...board,
      columns: board.columns.map((column) => ({
        ...column,
        cards: column.cards.filter(
          (card) =>
            card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            card.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            card.labels?.some((label) =>
              label.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
        ),
      })),
    }
    return filtered
  }, [board, searchQuery])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = board.columns
      .flatMap((col) => col.cards)
      .find((card) => card.id === active.id)
    setActiveCard(card || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    // Find the containers
    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return
    }

    // Move card between columns
    const updatedBoard = { ...board }
    const activeColumnIndex = updatedBoard.columns.findIndex(
      (col) => col.id === activeContainer
    )
    const overColumnIndex = updatedBoard.columns.findIndex(
      (col) => col.id === overContainer
    )

    const activeColumn = updatedBoard.columns[activeColumnIndex]
    const overColumn = updatedBoard.columns[overColumnIndex]

    const activeCardIndex = activeColumn.cards.findIndex(
      (card) => card.id === activeId
    )
    const [movedCard] = activeColumn.cards.splice(activeCardIndex, 1)

    // Check column limit
    if (overColumn.limit && overColumn.cards.length >= overColumn.limit) {
      return
    }

    overColumn.cards.push(movedCard)
    onUpdateBoard(updatedBoard)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId)

    if (!activeContainer || !overContainer) return

    const activeColumnIndex = board.columns.findIndex(
      (col) => col.id === activeContainer
    )
    const activeColumn = board.columns[activeColumnIndex]

    if (activeContainer === overContainer) {
      // Reordering within the same column
      const oldIndex = activeColumn.cards.findIndex(
        (card) => card.id === activeId
      )
      const newIndex = activeColumn.cards.findIndex(
        (card) => card.id === overId
      )

      if (oldIndex !== newIndex) {
        const updatedBoard = { ...board }
        updatedBoard.columns[activeColumnIndex].cards = arrayMove(
          activeColumn.cards,
          oldIndex,
          newIndex
        )
        onUpdateBoard(updatedBoard)
      }
    }
  }

  const findContainer = (id: UniqueIdentifier): string | undefined => {
    // Check if it's a column
    if (board.columns.some((col) => col.id === id)) {
      return id as string
    }

    // Find which column contains this card
    return board.columns.find((col) => col.cards.some((card) => card.id === id))
      ?.id
  }

  const handleAddCard = (columnId: string) => {
    setActiveColumnId(columnId)
    setEditingCard(null)
    setCardFormOpen(true)
  }

  const handleEditCard = (card: KanbanCard) => {
    setEditingCard(card)
    setActiveColumnId("")
    setCardFormOpen(true)
  }

  const handleSaveCard = (cardData: Partial<KanbanCard>) => {
    const updatedBoard = { ...board }

    if (editingCard) {
      // Update existing card
      const columnIndex = updatedBoard.columns.findIndex((col) =>
        col.cards.some((card) => card.id === editingCard.id)
      )
      if (columnIndex !== -1) {
        const cardIndex = updatedBoard.columns[columnIndex].cards.findIndex(
          (card) => card.id === editingCard.id
        )
        if (cardIndex !== -1) {
          updatedBoard.columns[columnIndex].cards[cardIndex] = {
            ...editingCard,
            ...cardData,
          } as KanbanCard
        }
      }
    } else {
      // Create new card
      const columnIndex = updatedBoard.columns.findIndex(
        (col) => col.id === activeColumnId
      )
      if (columnIndex !== -1) {
        const newCard: KanbanCard = {
          id: `card-${Date.now()}`,
          title: cardData.title!,
          description: cardData.description,
          labels: cardData.labels,
          priority: cardData.priority,
          assignee: cardData.assignee,
          dueDate: cardData.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        updatedBoard.columns[columnIndex].cards.push(newCard)
      }
    }

    onUpdateBoard(updatedBoard)
  }

  const handleDeleteCard = (cardId: string) => {
    const updatedBoard = { ...board }
    const columnIndex = updatedBoard.columns.findIndex((col) =>
      col.cards.some((card) => card.id === cardId)
    )
    if (columnIndex !== -1) {
      updatedBoard.columns[columnIndex].cards = updatedBoard.columns[
        columnIndex
      ].cards.filter((card) => card.id !== cardId)
      onUpdateBoard(updatedBoard)
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">{board.title}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="h-full p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 h-full pb-4">
              {filteredBoard.columns.map((column) => (
                <KanbanColumnComponent
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCard ? (
                <KanbanCardComponent
                  card={activeCard}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Card Form Dialog */}
      <CardFormDialog
        open={cardFormOpen}
        onOpenChange={setCardFormOpen}
        card={editingCard}
        onSave={handleSaveCard}
        labels={board.labels}
      />
    </div>
  )
}

// Export default for registry
export default KanbanBoard
