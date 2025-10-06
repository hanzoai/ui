"use client"

import * as React from "react"

export interface BlockViewerProps {
  item: any
  tree: any
  highlightedFiles: any
  children: React.ReactNode
}

export function BlockViewer({
  item,
  tree,
  highlightedFiles,
  children,
}: BlockViewerProps) {
  return <div className="block-viewer">{children}</div>
}
