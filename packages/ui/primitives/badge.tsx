import React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../util"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-ring ",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-fg shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-fg hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-fg shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge: React.FC<BadgeProps> = ({ 
  className, variant, ...props 
}) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
)

export { Badge as default, badgeVariants, type BadgeProps }
