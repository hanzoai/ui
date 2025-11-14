import { Code, Palette, Wand2 } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIllustration,
  EmptyStateTitle,
} from "@/registry/default/ui/empty-state"

export default function EmptyStateCustomDemo() {
  return (
    <div className="grid gap-8">
      {/* Custom composition */}
      <EmptyState>
        <EmptyStateIllustration icon={Palette} />
        <EmptyStateTitle>No themes created yet</EmptyStateTitle>
        <EmptyStateDescription>
          Start customizing your brand by creating a custom theme. You can
          adjust colors, fonts, and more.
        </EmptyStateDescription>
        <EmptyStateActions>
          <Button>
            <Wand2 className="mr-2" />
            Create theme
          </Button>
          <Button variant="outline">
            <Code className="mr-2" />
            View docs
          </Button>
        </EmptyStateActions>
      </EmptyState>

      {/* Subtle variant */}
      <EmptyState variant="subtle" size="sm">
        <EmptyStateIllustration icon={Code} />
        <EmptyStateTitle>No code snippets</EmptyStateTitle>
        <EmptyStateDescription>
          Save your favorite code snippets for quick access.
        </EmptyStateDescription>
      </EmptyState>
    </div>
  )
}
