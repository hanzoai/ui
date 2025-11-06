"use client"

import * as React from "react"
import { Index } from "@/__registry__"

interface BuilderPreviewProps {
  name: string
  type: "block" | "component"
  scale?: number
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

export function BuilderPreview({ name, type, scale = 1 }: BuilderPreviewProps) {
  // Get the component from the registry (flat structure)
  const registryKey = name
  const registryItem = Index[registryKey]

  if (!registryItem || !registryItem.component) {
    return <PreviewPlaceholder name={name} type={type} error />
  }

  const Component = registryItem.component

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        width: `${100 / scale}%`,
        height: type === "block" ? `${600 / scale}px` : `${200 / scale}px`,
      }}
      className="overflow-hidden bg-background"
    >
      <ErrorBoundary
        fallback={<PreviewPlaceholder name={name} type={type} error />}
      >
        <React.Suspense
          fallback={<PreviewPlaceholder name={name} type={type} />}
        >
          <Component />
        </React.Suspense>
      </ErrorBoundary>
    </div>
  )
}

function PreviewPlaceholder({
  name,
  type,
  error = false,
}: {
  name: string
  type: "block" | "component"
  error?: boolean
}) {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 p-8">
      <div className="text-center">
        <p className="text-sm font-medium">{name}</p>
        <p className="mt-1 text-xs text-muted-foreground capitalize">{type}</p>
        {error ? (
          <p className="mt-2 text-xs text-destructive">Not available</p>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Loading...</p>
        )}
      </div>
    </div>
  )
}
