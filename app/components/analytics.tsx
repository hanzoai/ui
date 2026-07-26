"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

import { analytics } from "@/lib/analytics"

export function Analytics() {
  const pathname = usePathname()
  const started = useRef(false)

  useEffect(() => {
    if (!started.current) {
      started.current = true
      analytics.init()
    }
    analytics.pageview(pathname ?? undefined)
  }, [pathname])

  return null
}
