import { XStack } from "@hanzo/gui"
import {
  Badge,
  DataTable,
  DataTableColumnHeader,
  type DataTableColumnDef,
} from "@hanzo/ui"

type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

const payments: Payment[] = [
  { id: "m5gr84i9", amount: 316, status: "success", email: "ken99@example.com" },
  { id: "3u1reuv4", amount: 242, status: "success", email: "abe45@example.com" },
  { id: "derv1ws0", amount: 837, status: "processing", email: "monserrat44@example.com" },
  { id: "5kma53ae", amount: 874, status: "success", email: "silas22@example.com" },
  { id: "bhqecj4p", amount: 721, status: "failed", email: "carmella@example.com" },
]

const columns: Array<DataTableColumnDef<Payment>> = [
  { id: "status", accessorKey: "status", header: "Status" },
  { id: "email", accessorKey: "email", header: "Email" },
  {
    id: "amount",
    accessorKey: "amount",
    align: "right",
    header: () => <XStack justify="flex-end" width="100%">Amount</XStack>,
    cell: ({ row }) => (
      <XStack justify="flex-end" width="100%">
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
          row.original.amount,
        )}
      </XStack>
    ),
  },
]

/** Basic — a column list bound to an array; each cell falls back to the row's raw value when a column names no `cell`. */
export function Basic() {
  return <DataTable columns={columns} data={payments} pageSize={0} />
}

/** Sortable and filterable — `DataTableColumnHeader` turns a header into a toggle, and `filterColumnId` wires a text box to one column. */
export function SortableAndFilterable() {
  const sortable: Array<DataTableColumnDef<Payment>> = [
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "failed" ? "destructive" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    columns[2],
  ]
  return (
    <DataTable
      columns={sortable}
      data={payments}
      filterColumnId="email"
      filterPlaceholder="Filter emails…"
      pageSize={0}
    />
  )
}

/** Row selection and pagination — a `select` column with no `header`/`cell` gets a checkbox for free, and `pageSize` turns on the Previous/Next footer. */
export function SelectableAndPaginated() {
  const withSelection: Array<DataTableColumnDef<Payment>> = [
    { id: "select", enableSorting: false, enableHiding: false },
    ...columns,
  ]
  return <DataTable columns={withSelection} data={payments} pageSize={2} />
}
