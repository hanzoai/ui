import { BookOpen, Layers, Plus } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyState } from "@/registry/default/ui/empty-state"

export default function EmptyStateBuilderDemo() {
  return (
    <div className="min-h-[500px] rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/30 p-8">
      {/* Empty canvas state */}
      <EmptyState
        variant="subtle"
        size="lg"
        icon={Layers}
        title="Empty canvas"
        description="Drag and drop blocks here to start building your page. Choose from 24+ pre-built blocks or create your own custom layout."
        action={
          <>
            <Button size="lg">
              <Plus className="mr-2" />
              Add your first block
            </Button>
            <Button variant="outline" size="lg">
              <BookOpen className="mr-2" />
              View examples
            </Button>
          </>
        }
      />
    </div>
  )
}
