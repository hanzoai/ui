import { Search, X } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyState } from "@/registry/default/ui/empty-state"
import { Input } from "@/registry/default/ui/input"

export default function EmptyStateSearchDemo() {
  return (
    <div className="w-full space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search components..."
          className="pl-9 pr-9"
          defaultValue="xyz123"
          disabled
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X className="size-4" />
          <span className="sr-only">Clear search</span>
        </Button>
      </div>

      {/* Empty state */}
      <EmptyState
        icon={Search}
        title="No components found"
        description="We couldn't find any components matching 'xyz123'. Try a different search term or browse all components."
        action={
          <>
            <Button>
              <X className="mr-2" />
              Clear search
            </Button>
            <Button variant="outline">Browse all</Button>
          </>
        }
      />
    </div>
  )
}
