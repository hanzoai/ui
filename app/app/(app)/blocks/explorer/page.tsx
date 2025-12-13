"use client"

import * as React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Index } from "@/__registry__"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import { Card } from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Skeleton } from "@/registry/default/ui/skeleton"
import { Spinner } from "@/registry/default/ui/spinner"

interface IframeState {
  loaded: boolean
  error: boolean
  showContent: boolean
}

function BlockPreview({ blockName }: { blockName: string }) {
  const [state, setState] = React.useState<IframeState>({
    loaded: false,
    error: false,
    showContent: false,
  })
  const [isInView, setIsInView] = React.useState(false)
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const minLoadTimeRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Intersection Observer for lazy loading
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
          }
        })
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleLoad = React.useCallback(() => {
    setState((prev) => ({ ...prev, loaded: true, error: false }))
    // Ensure minimum loading time of 200ms for smooth UX
    minLoadTimeRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, showContent: true }))
    }, 200)
  }, [])

  const handleError = React.useCallback(() => {
    setState({ loaded: true, error: true, showContent: true })
  }, [])

  const handleRetry = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setState({ loaded: false, error: false, showContent: false })
      if (iframeRef.current) {
        // Force reload by resetting src
        const src = iframeRef.current.src
        iframeRef.current.src = ""
        setTimeout(() => {
          if (iframeRef.current) {
            iframeRef.current.src = src
          }
        }, 0)
      }
    },
    []
  )

  React.useEffect(() => {
    return () => {
      if (minLoadTimeRef.current) {
        clearTimeout(minLoadTimeRef.current)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className="relative aspect-[4/3] min-h-[400px] bg-muted/50">
      {/* Loading skeleton */}
      {!state.showContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">
              {isInView ? "Loading preview..." : "Scroll to load..."}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-4 text-center">
            <AlertCircle className="size-8 text-destructive" />
            <div>
              <p className="text-sm font-medium">Failed to load preview</p>
              <p className="text-xs text-muted-foreground">
                The block could not be loaded
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-2"
            >
              <RefreshCw className="size-3" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Iframe with lazy loading and fade-in animation */}
      {isInView && (
        <iframe
          ref={iframeRef}
          src={`/view/${blockName}`}
          className={`h-full w-full border-0 transition-opacity duration-300 ${
            state.showContent && !state.error ? "opacity-100" : "opacity-0"
          }`}
          title={blockName}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

export default function BuilderPage() {
  const [filter, setFilter] = React.useState("")
  const [blocks, setBlocks] = React.useState<string[]>([])
  const [isLoadingBlocks, setIsLoadingBlocks] = React.useState(true)

  React.useEffect(() => {
    // Simulate async block loading with minimum display time
    const loadBlocks = async () => {
      setIsLoadingBlocks(true)
      const startTime = Date.now()

      // Get blocks from registry (flat structure)
      const blockIds = Object.keys(Index).filter((key) => {
        const item = Index[key]
        return item?.type === "components:block"
      })

      // Ensure minimum loading time of 200ms
      const elapsed = Date.now() - startTime
      if (elapsed < 200) {
        await new Promise((resolve) => setTimeout(resolve, 200 - elapsed))
      }

      setBlocks(blockIds.sort())
      setIsLoadingBlocks(false)
    }

    loadBlocks()
  }, [])

  const filteredBlocks = React.useMemo(() => {
    if (!filter) return blocks
    return blocks.filter((block) =>
      block.toLowerCase().includes(filter.toLowerCase())
    )
  }, [blocks, filter])

  return (
    <div className="flex h-screen flex-col">
      {/* Header with loading state */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Blocks</h1>
            {isLoadingBlocks && <Spinner className="size-4" />}
          </div>
          <Input
            placeholder="Filter blocks..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
            disabled={isLoadingBlocks}
          />
          <span className="text-sm text-muted-foreground">
            {isLoadingBlocks ? "Loading..." : `${filteredBlocks.length} blocks`}
          </span>
        </div>
      </div>

      {/* Grid with loading and empty states */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Loading skeleton */}
          {isLoadingBlocks &&
            Array.from({ length: 8 }).map((_, i) => (
              <Card
                key={i}
                className="overflow-hidden rounded-lg border-2 border-border"
              >
                <Skeleton className="aspect-[4/3] min-h-[400px] w-full rounded-none" />
                <div className="border-t bg-card p-4">
                  <Skeleton className="mb-2 h-5 w-3/4" />
                  <Skeleton className="mb-1 h-4 w-20" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-2/3" />
                </div>
              </Card>
            ))}

          {/* Empty state */}
          {!isLoadingBlocks && filteredBlocks.length === 0 && (
            <div className="col-span-full flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  No blocks found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter
                    ? `No blocks match "${filter}"`
                    : "No blocks available"}
                </p>
                {filter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFilter("")}
                    className="mt-4"
                  >
                    Clear filter
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Block cards */}
          {!isLoadingBlocks &&
            filteredBlocks.map((blockName) => {
              const block = Index[blockName]
              return (
                <a
                  key={blockName}
                  href={`/view/${blockName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Card className="overflow-hidden rounded-lg border-2 border-border shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-primary hover:shadow-lg hover:bg-accent/5">
                    {/* Preview with loading states */}
                    <BlockPreview blockName={blockName} />

                    {/* Block info - hidden until hover */}
                    <div className="border-t bg-card p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="text-base font-semibold leading-tight">
                          {blockName}
                        </h3>
                        {block?.category &&
                          block?.category !== "undefined" && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-xs font-medium"
                            >
                              {block.category}
                            </Badge>
                          )}
                      </div>
                      {block?.subcategory &&
                        block?.subcategory !== "undefined" && (
                          <div className="mb-2">
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {block.subcategory}
                            </Badge>
                          </div>
                        )}
                      {block?.description && (
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {block.description}
                        </p>
                      )}
                    </div>
                  </Card>
                </a>
              )
            })}
        </div>
      </ScrollArea>
    </div>
  )
}
