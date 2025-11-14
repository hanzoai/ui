import { Button } from "@/registry/default/ui/button"
import {
  EmptyState,
  EmptyStatePresets,
} from "@/registry/default/ui/empty-state"

export default function EmptyStateDemo() {
  return (
    <div className="grid gap-8">
      {/* Basic usage with preset */}
      <EmptyState
        {...EmptyStatePresets.noResults}
        action={<Button variant="outline">Clear filters</Button>}
      />
    </div>
  )
}
