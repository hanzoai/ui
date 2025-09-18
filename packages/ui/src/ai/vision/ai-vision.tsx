import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AIVisionProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: string
  model?: string
  apiKey?: string
  imageUrl?: string
  onAnalysis?: (result: any) => void
  onError?: (error: Error) => void
}

export const AIVision = React.forwardRef<HTMLDivElement, AIVisionProps>(
  ({ className, children, imageUrl, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-4', className)}
        {...props}
      >
        {imageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            <img
              src={imageUrl}
              alt="AI Vision Input"
              className="object-contain w-full h-full"
            />
          </div>
        )}
        <div className="space-y-2">{children}</div>
      </div>
    )
  }
)
AIVision.displayName = 'AIVision'