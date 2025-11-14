import { Plus, RefreshCw, Search } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIllustration,
  EmptyStatePresets,
  EmptyStateTitle,
} from "@/registry/default/ui/empty-state"

export default function EmptyStateVariantsDemo() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* No Results */}
      <EmptyState
        {...EmptyStatePresets.noResults}
        action={
          <>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2" />
              Clear filters
            </Button>
            <Button size="sm">
              <Search className="mr-2" />
              New search
            </Button>
          </>
        }
      />

      {/* No Items */}
      <EmptyState
        {...EmptyStatePresets.noItems}
        action={
          <Button>
            <Plus className="mr-2" />
            Add item
          </Button>
        }
      />

      {/* No Favorites */}
      <EmptyState {...EmptyStatePresets.noFavorites} />

      {/* Getting Started */}
      <EmptyState
        {...EmptyStatePresets.gettingStarted}
        action={
          <>
            <Button>Get started</Button>
            <Button variant="ghost">Learn more</Button>
          </>
        }
      />

      {/* Error State */}
      <EmptyState
        {...EmptyStatePresets.error}
        action={
          <Button variant="outline">
            <RefreshCw className="mr-2" />
            Try again
          </Button>
        }
      />

      {/* Not Found */}
      <EmptyState
        {...EmptyStatePresets.notFound}
        action={<Button variant="outline">Go back</Button>}
      />
    </div>
  )
}
