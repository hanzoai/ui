import { FileSpreadsheet, Plus, Upload } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyState } from "@/registry/default/ui/empty-state"

export default function EmptyStateDataTableDemo() {
  return (
    <div className="rounded-lg border">
      {/* Table header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="font-semibold">Data Records</h3>
          <p className="text-sm text-muted-foreground">0 total records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Upload className="mr-2" />
            Import
          </Button>
          <Button size="sm" disabled>
            <Plus className="mr-2" />
            New record
          </Button>
        </div>
      </div>

      {/* Empty state in table */}
      <div className="p-8">
        <EmptyState
          variant="subtle"
          icon={FileSpreadsheet}
          title="No data yet"
          description="Get started by adding your first record or importing existing data from a CSV file."
          action={
            <>
              <Button>
                <Plus className="mr-2" />
                Add record
              </Button>
              <Button variant="outline">
                <Upload className="mr-2" />
                Import CSV
              </Button>
            </>
          }
        />
      </div>
    </div>
  )
}
