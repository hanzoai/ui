import { Badge, Button, DataTable, DataTableColumnHeader, type DataTableColumnDef } from "@hanzo/ui"

type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const payments: Payment[] = [
  { id: "728ed52f", amount: 100, status: "pending", email: "m@example.com" },
  { id: "489e1d42", amount: 125, status: "processing", email: "sam@example.com" },
  { id: "a1b2c3d4", amount: 316, status: "success", email: "ken99@example.com" },
  { id: "d5e6f7a8", amount: 242, status: "success", email: "abe45@example.com" },
  { id: "b9c0d1e2", amount: 837, status: "failed", email: "monserrat44@example.com" },
]

/** Basic — one column per field, read straight off the row by `accessorKey`. */
export function Basic() {
  const columns: DataTableColumnDef<Payment>[] = [
    { id: "status", accessorKey: "status", header: "Status" },
    { id: "email", accessorKey: "email", header: "Email" },
    { id: "amount", accessorKey: "amount", header: "Amount", align: "right" },
  ]
  return <DataTable columns={columns} data={payments} />
}

/** Sortable and filterable — a custom `cell` formats the amount and colors the
 * status; `DataTableColumnHeader` gives the email column a click-to-sort
 * button; the toolbar's text field searches it. */
export function SortableFilterable() {
  const columns: DataTableColumnDef<Payment>[] = [
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as Payment["status"]
        const variant = status === "failed" ? "destructive" : status === "success" ? "default" : "secondary"
        return <Badge variant={variant}>{status}</Badge>
      },
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      id: "amount",
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      align: "right",
      cell: ({ row }) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(row.getValue("amount") as number),
    },
  ]
  return <DataTable columns={columns} data={payments} filterColumnId="email" filterPlaceholder="Filter emails…" pageSize={3} />
}

/** Selectable with row actions — an `id: 'select'` column gets its checkbox
 * for free; an `id: 'actions'` column is just a normal `cell` reading
 * `row.original`, the same convention the upstream guide's own demo uses. */
export function SelectableWithActions() {
  const columns: DataTableColumnDef<Payment>[] = [
    { id: "select", enableSorting: false, enableHiding: false },
    { id: "email", accessorKey: "email", header: "Email" },
    { id: "amount", accessorKey: "amount", header: "Amount", align: "right" },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard?.writeText(row.original.id)}>
          Copy ID
        </Button>
      ),
    },
  ]
  return <DataTable columns={columns} data={payments} />
}
