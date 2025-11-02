"use client"

import * as React from "react"
import { KanbanBoard, type KanbanBoard as KanbanBoardType } from "@/registry/default/ui/kanban"

export default function KanbanDemo() {
  const [board, setBoard] = React.useState<KanbanBoardType>({
    id: "board-1",
    title: "Project Tasks",
    labels: [
      { id: "label-1", name: "Bug", color: "#ef4444" },
      { id: "label-2", name: "Feature", color: "#3b82f6" },
      { id: "label-3", name: "Docs", color: "#10b981" },
    ],
    columns: [
      {
        id: "todo",
        title: "To Do",
        cards: [
          {
            id: "card-1",
            title: "Setup project structure",
            description: "Initialize the basic project structure and configuration",
            priority: "high",
            assignee: "John",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "in-progress",
        title: "In Progress",
        cards: [
          {
            id: "card-2",
            title: "Build authentication flow",
            description: "Implement login and signup functionality",
            priority: "urgent",
            assignee: "Sarah",
            labels: [{ id: "label-2", name: "Feature", color: "#3b82f6" }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      {
        id: "done",
        title: "Done",
        cards: [
          {
            id: "card-3",
            title: "Design system setup",
            description: "Setup Tailwind CSS and design tokens",
            priority: "medium",
            assignee: "Mike",
            labels: [{ id: "label-3", name: "Docs", color: "#10b981" }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
    ],
  })

  return (
    <div className="w-full h-[600px] border rounded-lg">
      <KanbanBoard board={board} onUpdateBoard={setBoard} />
    </div>
  )
}
