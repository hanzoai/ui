"use client"

import * as React from "react"
import { Index } from "@/__registry__"
import { Card } from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"

export default function BuilderPage() {
  const [filter, setFilter] = React.useState("")
  const [blocks, setBlocks] = React.useState<string[]>([])

  React.useEffect(() => {
    // Get blocks from registry (flat structure)
    const blockIds = Object.keys(Index).filter((key) => {
      const item = Index[key]
      return item?.type === "components:block"
    })
    setBlocks(blockIds.sort())
  }, [])

  const filteredBlocks = React.useMemo(() => {
    if (!filter) return blocks
    return blocks.filter((block) =>
      block.toLowerCase().includes(filter.toLowerCase())
    )
  }, [blocks, filter])

  return (
    <div className="flex h-screen flex-col">
      {/* Simple header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Blocks</h1>
          <Input
            placeholder="Filter blocks..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground">
            {filteredBlocks.length} blocks
          </span>
        </div>
      </div>

      {/* Simple grid of block outlines */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBlocks.map((blockName) => {
            const block = Index[blockName]
            return (
              <a
                key={blockName}
                href={`/view/${blockName}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="overflow-hidden border-2 border-muted transition-all hover:border-primary hover:shadow-lg">
                  {/* Preview container */}
                  <div className="relative aspect-video bg-muted">
                    <iframe
                      src={`/view/${blockName}`}
                      className="h-full w-full border-0"
                      title={blockName}
                      loading="lazy"
                    />
                  </div>

                  {/* Block info */}
                  <div className="border-t p-3">
                    <h3 className="font-mono text-sm font-medium">
                      {blockName}
                    </h3>
                    {block?.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
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
