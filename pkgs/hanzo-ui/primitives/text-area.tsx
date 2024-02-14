import React from 'react'

import { cn } from '../util'

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-muted-2 px-3 py-2 text-sm ' + 
          'placeholder:text-muted-3  focus-visible:outline-none focus-visible:ring-2 ' + 
          'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
TextArea.displayName = 'TextArea'

export default TextArea 
