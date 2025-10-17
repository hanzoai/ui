"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  RotateCw,
  Share2,
} from "lucide-react"

import { cn } from "@/lib/utils"

interface SafariProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  url?: string
  showToolbar?: boolean
}

const Safari = React.forwardRef<HTMLDivElement, SafariProps>(
  (
    {
      className,
      children,
      url = "https://ui.hanzo.ai",
      showToolbar = true,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-5xl overflow-hidden rounded-xl border shadow-2xl",
          className
        )}
        {...props}
      >
        {/* Window Chrome */}
        <div className="flex items-center gap-2 border-b bg-zinc-100 px-3 py-2 dark:bg-zinc-900">
          {/* Traffic Lights */}
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>

          {/* Navigation Controls */}
          <div className="ml-2 flex items-center gap-1">
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <ChevronLeft className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <ChevronRight className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* URL Bar */}
          <div className="mx-3 flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 dark:bg-zinc-800">
            <svg
              className="h-4 w-4 text-zinc-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
            <span className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
              {url}
            </span>
            <button className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700">
              <RotateCw className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <Share2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <Plus className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
            <button className="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800">
              <Menu className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Optional Toolbar */}
        {showToolbar && (
          <div className="flex items-center gap-4 border-b bg-zinc-50 px-4 py-2 text-sm dark:bg-zinc-900">
            <button className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Favorites
            </button>
            <button className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Reading List
            </button>
            <button className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              History
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white dark:bg-zinc-950">{children}</div>
      </div>
    )
  }
)
Safari.displayName = "Safari"

export { Safari }
