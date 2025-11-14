"use client"

import * as React from "react"
import { toast } from "sonner"

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = React.useState(false)

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast.success("Copied to clipboard")
    } catch (err) {
      console.error("Failed to copy:", err)
      toast.error("Failed to copy", {
        description: "Please try again",
      })
    }
  }, [])

  return { isCopied, copyToClipboard }
}
