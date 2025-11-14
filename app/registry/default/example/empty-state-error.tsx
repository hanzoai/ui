import { AlertCircle, Home, RefreshCw } from "lucide-react"

import { Button } from "@/registry/default/ui/button"
import { EmptyState } from "@/registry/default/ui/empty-state"

export default function EmptyStateErrorDemo() {
  return (
    <div className="grid gap-8">
      {/* Network error */}
      <EmptyState
        variant="error"
        icon={AlertCircle}
        title="Connection failed"
        description="We're having trouble connecting to the server. Please check your internet connection and try again."
        action={
          <>
            <Button>
              <RefreshCw className="mr-2" />
              Retry
            </Button>
            <Button variant="outline">Report issue</Button>
          </>
        }
      />

      {/* 404 Not found */}
      <EmptyState
        variant="default"
        icon={AlertCircle}
        title="Page not found"
        description="The page you're looking for doesn't exist. It may have been moved or deleted."
        action={
          <>
            <Button>
              <Home className="mr-2" />
              Go home
            </Button>
            <Button variant="outline">Contact support</Button>
          </>
        }
      />
    </div>
  )
}
