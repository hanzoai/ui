"use client"

import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/new-york/ui/badge"

export interface Tag {
  id: string
  label: string
}

export interface TagsProps extends React.HTMLAttributes<HTMLDivElement> {
  tags: Tag[]
  onRemove?: (id: string) => void
  variant?: "default" | "secondary" | "outline" | "destructive"
}

const Tags = React.forwardRef<HTMLDivElement, TagsProps>(
  ({ className, tags, onRemove, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      >
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant={variant}
            className={cn("gap-1", onRemove && "pr-1")}
          >
            {tag.label}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(tag.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {tag.label}</span>
              </button>
            )}
          </Badge>
        ))}
      </div>
    )
  }
)
Tags.displayName = "Tags"

export { Tags }
