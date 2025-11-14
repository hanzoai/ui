import { Compass, Heart, Star } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyState } from "@/registry/default/ui/empty-state"

export default function EmptyStateFavoritesDemo() {
  return (
    <div className="space-y-8">
      {/* Favorites header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Your Favorites
          </h2>
          <p className="text-sm text-muted-foreground">
            Components you've saved for quick access
          </p>
        </div>
        <Button variant="outline" disabled>
          <Star className="mr-2" />
          Sort by recent
        </Button>
      </div>

      {/* Empty state */}
      <EmptyState
        icon={Heart}
        title="No favorites yet"
        description="Start exploring our component library and save your favorites for quick access. Click the heart icon on any component to add it here."
        action={
          <>
            <Button>
              <Compass className="mr-2" />
              Explore components
            </Button>
            <Button variant="outline">View blocks</Button>
          </>
        }
      />
    </div>
  )
}
