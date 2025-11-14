"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  AlertCircle,
  FileQuestion,
  Heart,
  Package,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/registry/default/ui/button"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center gap-6 p-8 rounded-lg border border-dashed animate-in fade-in-50 duration-500",
  {
    variants: {
      variant: {
        default: "border-border bg-muted/30",
        subtle: "border-transparent bg-transparent",
        error: "border-destructive/50 bg-destructive/5",
        success: "border-primary/50 bg-primary/5",
      },
      size: {
        sm: "p-6 gap-4 max-w-sm",
        default: "p-8 gap-6 max-w-md",
        lg: "p-12 gap-8 max-w-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// Illustration wrapper component
function EmptyStateIllustration({
  icon: Icon,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon
}) {
  return (
    <div
      className={cn(
        "relative flex size-20 items-center justify-center rounded-full bg-muted animate-in zoom-in-50 duration-700",
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon className="size-10 text-muted-foreground" strokeWidth={1.5} />
      )}
    </div>
  )
}

// Title component
function EmptyStateTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl font-semibold tracking-tight animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-100",
        className
      )}
      {...props}
    />
  )
}

// Description component
function EmptyStateDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm text-muted-foreground max-w-sm animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-200",
        className
      )}
      {...props}
    />
  )
}

// Actions component
function EmptyStateActions({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-700 delay-300",
        className
      )}
      {...props}
    />
  )
}

// Main component
export interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      title,
      description,
      action,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(emptyStateVariants({ variant, size }), className)}
        {...props}
      >
        {children ? (
          children
        ) : (
          <>
            {icon && <EmptyStateIllustration icon={icon} />}
            {title && <EmptyStateTitle>{title}</EmptyStateTitle>}
            {description && (
              <EmptyStateDescription>{description}</EmptyStateDescription>
            )}
            {action && <EmptyStateActions>{action}</EmptyStateActions>}
          </>
        )}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

export {
  EmptyState,
  EmptyStateIllustration,
  EmptyStateTitle,
  EmptyStateDescription,
  EmptyStateActions,
  emptyStateVariants,
}

// Pre-configured variants for common use cases
export const EmptyStatePresets = {
  noResults: {
    icon: Search,
    title: "No results found",
    description:
      "We couldn't find anything matching your search. Try adjusting your filters or search terms.",
  },
  noItems: {
    icon: Package,
    title: "No items yet",
    description: "Get started by adding your first item.",
  },
  noFavorites: {
    icon: Heart,
    title: "No favorites yet",
    description:
      "Items you favorite will appear here. Start exploring to find what you love.",
  },
  gettingStarted: {
    icon: Sparkles,
    title: "Let's get started",
    description: "Create your first project to begin your journey.",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description:
      "We encountered an error loading this content. Please try again.",
    variant: "error" as const,
  },
  notFound: {
    icon: FileQuestion,
    title: "Nothing here",
    description: "The content you're looking for doesn't exist or was removed.",
  },
} as const
