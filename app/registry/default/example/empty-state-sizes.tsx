import { Plus } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  EmptyState,
  EmptyStatePresets,
} from "@/registry/default/ui/empty-state"

export default function EmptyStateSizesDemo() {
  return (
    <div className="grid gap-8">
      {/* Small */}
      <EmptyState
        {...EmptyStatePresets.noItems}
        size="sm"
        action={
          <Button size="sm">
            <Plus className="mr-2" />
            Add
          </Button>
        }
      />

      {/* Default */}
      <EmptyState
        {...EmptyStatePresets.noResults}
        action={<Button>Search again</Button>}
      />

      {/* Large */}
      <EmptyState
        {...EmptyStatePresets.gettingStarted}
        size="lg"
        action={
          <>
            <Button size="lg">Get started</Button>
            <Button variant="outline" size="lg">
              Watch tutorial
            </Button>
          </>
        }
      />
    </div>
  )
}
