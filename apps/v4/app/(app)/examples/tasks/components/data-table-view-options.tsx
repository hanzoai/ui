"use client"

<<<<<<<< HEAD:app/app/(app)/examples/tasks/components/data-table-view-options.tsx
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Table } from "@tanstack/react-table"
import { Settings2 } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
========
import { type Table } from "@tanstack/react-table"
import { Settings2 } from "lucide-react"

import { Button } from "@/registry/new-york-v4/ui/button"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/tasks/components/data-table-view-options.tsx
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
<<<<<<<< HEAD:app/app/(app)/examples/tasks/components/data-table-view-options.tsx
} from "@/registry/default/ui/dropdown-menu"
========
  DropdownMenuTrigger,
} from "@/registry/new-york-v4/ui/dropdown-menu"
>>>>>>>> shadcn/main:apps/v4/app/(app)/examples/tasks/components/data-table-view-options.tsx

export function DataTableViewOptions<TData>({
  table,
}: {
  table: Table<TData>
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <Settings2 />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
