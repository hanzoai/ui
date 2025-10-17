import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const statusVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        warning:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        gray: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
      },
      dot: {
        true: "pl-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      dot: true,
    },
  }
)

export interface StatusProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusVariants> {}

const Status = React.forwardRef<HTMLSpanElement, StatusProps>(
  ({ className, variant, dot, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(statusVariants({ variant, dot }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "success" && "bg-green-500",
              variant === "warning" && "bg-yellow-500",
              variant === "error" && "bg-red-500",
              variant === "info" && "bg-blue-500",
              variant === "gray" && "bg-gray-500",
              variant === "default" && "bg-primary"
            )}
          />
        )}
        {children}
      </span>
    )
  }
)
Status.displayName = "Status"

export { Status, statusVariants }
