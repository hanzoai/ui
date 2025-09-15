import * as React from "react"

interface FrameworkDocsProps extends React.HTMLAttributes<HTMLDivElement> {
  data: string
}

export function FrameworkDocs({ ...props }: FrameworkDocsProps) {
  // TODO: Implement framework docs with Fumadocs
  // This component needs to be refactored to work with the new documentation system
  return (
    <div>
      <p className="text-muted-foreground">
        Framework documentation for {props.data} will be available soon.
      </p>
    </div>
  )
}
