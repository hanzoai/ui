"use client"

export default function ColorsPage() {
  const colors = [
    { name: "background", class: "bg-background" },
    { name: "foreground", class: "bg-foreground" },
    { name: "card", class: "bg-card" },
    { name: "card-foreground", class: "bg-card-foreground" },
    { name: "popover", class: "bg-popover" },
    { name: "popover-foreground", class: "bg-popover-foreground" },
    { name: "primary", class: "bg-primary" },
    { name: "primary-foreground", class: "bg-primary-foreground" },
    { name: "secondary", class: "bg-secondary" },
    { name: "secondary-foreground", class: "bg-secondary-foreground" },
    { name: "muted", class: "bg-muted" },
    { name: "muted-foreground", class: "bg-muted-foreground" },
    { name: "accent", class: "bg-accent" },
    { name: "accent-foreground", class: "bg-accent-foreground" },
    { name: "destructive", class: "bg-destructive" },
    { name: "destructive-foreground", class: "bg-destructive-foreground" },
    { name: "border", class: "bg-border" },
    { name: "input", class: "bg-input" },
    { name: "ring", class: "bg-ring" },
  ]

  const chartColors = [
    { name: "chart-1", class: "bg-chart-1" },
    { name: "chart-2", class: "bg-chart-2" },
    { name: "chart-3", class: "bg-chart-3" },
    { name: "chart-4", class: "bg-chart-4" },
    { name: "chart-5", class: "bg-chart-5" },
  ]

  return (
    <div className="container mx-auto py-10">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Colors</h1>
          <p className="text-muted-foreground">
            The color palette and design tokens for the UI components.
          </p>
        </div>

        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Theme Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {colors.map((color) => (
                <div key={color.name} className="space-y-1.5">
                  <div
                    className={`h-12 w-full rounded-md border ${color.class}`}
                  />
                  <div className="px-1">
                    <p className="text-sm font-medium">{color.name}</p>
                    <code className="text-xs text-muted-foreground">
                      {color.class}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Chart Colors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {chartColors.map((color) => (
                <div key={color.name} className="space-y-1.5">
                  <div
                    className={`h-12 w-full rounded-md border ${color.class}`}
                  />
                  <div className="px-1">
                    <p className="text-sm font-medium">{color.name}</p>
                    <code className="text-xs text-muted-foreground">
                      {color.class}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}