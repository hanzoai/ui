"use client"

import {
  GridPattern,
  GridPatternPresets,
} from "@/registry/default/ui/grid-pattern"

export function GridPatternHero() {
  return (
    <section className="relative min-h-[600px] overflow-hidden">
      {/* Animated gradient grid background */}
      <GridPattern
        variant="dots"
        size={3}
        gap={30}
        opacity={0.3}
        fade="edges"
        gradient={{
          from: "#ec4899",
          via: "#8b5cf6",
          to: "#3b82f6",
          opacity: 0.15,
        }}
        animation={{
          duration: 20,
          timing: "linear",
        }}
      />

      <div className="relative z-10 flex min-h-[600px] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Grid Pattern Background
          </h1>
          <p className="mt-4 text-xl text-muted-foreground">
            Beautiful, customizable grid patterns for your UI
          </p>
        </div>
      </div>
    </section>
  )
}

export function GridPatternCard() {
  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-6">
      <GridPattern
        {...GridPatternPresets.blueprint}
        opacity={0.1}
        className="absolute inset-0"
      />
      <div className="relative z-10">
        <h3 className="text-lg font-semibold">Blueprint Card</h3>
        <p className="mt-2 text-muted-foreground">
          A card with a subtle blueprint grid pattern background
        </p>
      </div>
    </div>
  )
}

export function GridPatternLayered() {
  return (
    <div className="relative h-96 overflow-hidden rounded-lg border">
      {/* Layer 1: Large grid */}
      <GridPattern
        variant="lines"
        gap={100}
        strokeWidth={1.5}
        opacity={0.08}
        color="#3b82f6"
      />

      {/* Layer 2: Medium grid */}
      <GridPattern
        variant="lines"
        gap={50}
        strokeWidth={1}
        opacity={0.06}
        color="#8b5cf6"
      />

      {/* Layer 3: Fine dots */}
      <GridPattern
        variant="dots"
        size={1.5}
        gap={15}
        opacity={0.04}
        color="#ec4899"
      />

      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Multi-Layer Grid</h2>
          <p className="mt-2 text-muted-foreground">
            Combining multiple grids creates depth
          </p>
        </div>
      </div>
    </div>
  )
}
