"use client"

import {
  GridPattern,
  GridPatternPresets,
} from "@/registry/default/ui/grid-pattern"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"

export default function GridPatternDemo() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Basic Grid Patterns</h3>
        <Tabs defaultValue="dots" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dots">Dots</TabsTrigger>
            <TabsTrigger value="lines">Lines</TabsTrigger>
            <TabsTrigger value="crosses">Crosses</TabsTrigger>
            <TabsTrigger value="plus">Plus</TabsTrigger>
            <TabsTrigger value="squares">Squares</TabsTrigger>
          </TabsList>
          <TabsContent value="dots">
            <div className="relative h-64 w-full rounded-lg border bg-background">
              <GridPattern variant="dots" size={4} gap={30} opacity={0.4} />
              <div className="relative z-10 flex h-full items-center justify-center">
                <span className="text-xl font-medium">Dot Pattern</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="lines">
            <div className="relative h-64 w-full rounded-lg border bg-background">
              <GridPattern
                variant="lines"
                strokeWidth={1}
                gap={40}
                opacity={0.3}
              />
              <div className="relative z-10 flex h-full items-center justify-center">
                <span className="text-xl font-medium">Line Grid</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="crosses">
            <div className="relative h-64 w-full rounded-lg border bg-background">
              <GridPattern
                variant="crosses"
                size={10}
                gap={25}
                opacity={0.35}
              />
              <div className="relative z-10 flex h-full items-center justify-center">
                <span className="text-xl font-medium">Cross Pattern</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="plus">
            <div className="relative h-64 w-full rounded-lg border bg-background">
              <GridPattern variant="plus" size={8} gap={30} opacity={0.3} />
              <div className="relative z-10 flex h-full items-center justify-center">
                <span className="text-xl font-medium">Plus Pattern</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="squares">
            <div className="relative h-64 w-full rounded-lg border bg-background">
              <GridPattern
                variant="squares"
                size={20}
                gap={35}
                opacity={0.25}
              />
              <div className="relative z-10 flex h-full items-center justify-center">
                <span className="text-xl font-medium">Square Grid</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Fade Effects</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern variant="dots" fade="edges" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Edge Fade</span>
            </div>
          </div>
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern variant="dots" fade="center" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Center Fade</span>
            </div>
          </div>
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern variant="dots" fade="radial" />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Radial Fade</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Gradient Overlay</h3>
        <div className="relative h-64 w-full rounded-lg border bg-background">
          <GridPattern
            variant="lines"
            gradient={{
              from: "#ec4899",
              via: "#8b5cf6",
              to: "#3b82f6",
              opacity: 0.2,
            }}
          />
          <div className="relative z-10 flex h-full items-center justify-center">
            <span className="text-xl font-medium">Gradient Grid</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Animated Pattern</h3>
        <div className="relative h-64 w-full rounded-lg border bg-background">
          <GridPattern
            variant="dots"
            size={2}
            gap={20}
            opacity={0.3}
            animation={{
              duration: 10,
              timing: "linear",
              direction: "normal",
            }}
          />
          <div className="relative z-10 flex h-full items-center justify-center">
            <span className="text-xl font-medium">Animated Grid</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Presets</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern {...GridPatternPresets.blueprint} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Blueprint</span>
            </div>
          </div>
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern {...GridPatternPresets.graph} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Graph Paper</span>
            </div>
          </div>
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern {...GridPatternPresets.dotMatrix} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Dot Matrix</span>
            </div>
          </div>
          <div className="relative h-48 rounded-lg border bg-background">
            <GridPattern {...GridPatternPresets.isometric} />
            <div className="relative z-10 flex h-full items-center justify-center">
              <span className="font-medium">Isometric</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold">Multi-Layer Pattern</h3>
        <div className="relative h-64 w-full rounded-lg border bg-background">
          <GridPattern variant="lines" gap={80} strokeWidth={1} opacity={0.1} />
          <GridPattern
            variant="lines"
            gap={40}
            strokeWidth={0.5}
            opacity={0.05}
          />
          <GridPattern variant="dots" size={1} gap={10} opacity={0.03} />
          <div className="relative z-10 flex h-full items-center justify-center">
            <span className="text-xl font-medium">Multi-Layer Depth</span>
          </div>
        </div>
      </div>
    </div>
  )
}
