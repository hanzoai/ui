"use client"

import * as Charts from "./charts"

export default function ChartsPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
          <p className="text-muted-foreground">
            Beautiful charts built with Recharts. Copy and paste into your apps.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          <Charts.ChartAreaDefault />
          <Charts.ChartBarDefault />
          <Charts.ChartLineDefault />
          <Charts.ChartPieSimple />
        </div>
      </div>
    </div>
  )
}