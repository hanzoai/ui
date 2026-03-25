import * as React from "react"

import { cn } from "@/registry/bases/base/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
<<<<<<< HEAD
        "cn-textarea placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full outline-none disabled:cursor-not-allowed disabled:opacity-50",
=======
        "cn-textarea flex field-sizing-content min-h-16 w-full outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
>>>>>>> shadcn/main
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
