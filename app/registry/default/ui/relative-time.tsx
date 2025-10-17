"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface RelativeTimeProps
  extends React.HTMLAttributes<HTMLTimeElement> {
  date: Date | string
  format?: "auto" | "short" | "long"
  updateInterval?: number
}

const RelativeTime = React.forwardRef<HTMLTimeElement, RelativeTimeProps>(
  (
    { className, date, format = "auto", updateInterval = 60000, ...props },
    ref
  ) => {
    const [relativeTime, setRelativeTime] = React.useState("")

    const getRelativeTime = React.useCallback(() => {
      const now = new Date()
      const then = new Date(date)
      const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)

      if (format === "short") {
        if (diffInSeconds < 60) return `${diffInSeconds}s`
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
        if (diffInSeconds < 604800)
          return `${Math.floor(diffInSeconds / 86400)}d`
        if (diffInSeconds < 2592000)
          return `${Math.floor(diffInSeconds / 604800)}w`
        if (diffInSeconds < 31536000)
          return `${Math.floor(diffInSeconds / 2592000)}mo`
        return `${Math.floor(diffInSeconds / 31536000)}y`
      }

      if (diffInSeconds < 60) return "just now"
      if (diffInSeconds < 120) return "1 minute ago"
      if (diffInSeconds < 3600)
        return `${Math.floor(diffInSeconds / 60)} minutes ago`
      if (diffInSeconds < 7200) return "1 hour ago"
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)} hours ago`
      if (diffInSeconds < 172800) return "1 day ago"
      if (diffInSeconds < 604800)
        return `${Math.floor(diffInSeconds / 86400)} days ago`
      if (diffInSeconds < 1209600) return "1 week ago"
      if (diffInSeconds < 2592000)
        return `${Math.floor(diffInSeconds / 604800)} weeks ago`
      if (diffInSeconds < 5184000) return "1 month ago"
      if (diffInSeconds < 31536000)
        return `${Math.floor(diffInSeconds / 2592000)} months ago`
      if (diffInSeconds < 63072000) return "1 year ago"
      return `${Math.floor(diffInSeconds / 31536000)} years ago`
    }, [date, format])

    React.useEffect(() => {
      setRelativeTime(getRelativeTime())

      const interval = setInterval(() => {
        setRelativeTime(getRelativeTime())
      }, updateInterval)

      return () => clearInterval(interval)
    }, [getRelativeTime, updateInterval])

    return (
      <time
        ref={ref}
        dateTime={new Date(date).toISOString()}
        className={cn(className)}
        {...props}
      >
        {relativeTime}
      </time>
    )
  }
)
RelativeTime.displayName = "RelativeTime"

export { RelativeTime }
