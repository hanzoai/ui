"use client"

<<<<<<<< HEAD:app/app/(app)/examples/tasks/components/data-table-row-actions.tsx
import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
========
import { type Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/tasks/components/data-table-row-actions.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
<<<<<<<< HEAD:app/app/(app)/examples/tasks/components/data-table-row-actions.tsx
} from "@/registry/default/ui/dropdown-menu"
========
} from "@/registry/new-york-v4/ui/dropdown-menu"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/tasks/components/data-table-row-actions.tsx

import { labels } from "../data/data"
import { taskSchema } from "../data/schema"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = taskSchema.parse(row.original)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
<<<<<<<< HEAD:app/app/(app)/examples/tasks/components/data-table-row-actions.tsx
          className="data-[state=open]:bg-muted size-8"
========
          className="size-8 data-[state=open]:bg-muted"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/tasks/components/data-table-row-actions.tsx
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem>Edit</DropdownMenuItem>
        <DropdownMenuItem>Make a copy</DropdownMenuItem>
        <DropdownMenuItem>Favorite</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={task.label}>
              {labels.map((label) => (
                <DropdownMenuRadioItem key={label.value} value={label.value}>
                  {label.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          Delete
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
