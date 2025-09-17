import { getColors } from "@/lib/colors"
import { ColorPalette } from "@/components/color-palette"
import { ColorsProvider } from "@/hooks/use-colors"

export default function ColorsPage() {
  const colors = getColors()

  return (
    <ColorsProvider>
      <div className="container mx-auto py-10">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Colors</h1>
            <p className="text-muted-foreground">
              Beautiful, thoughtful palettes designed for interfaces. Click to copy.
            </p>
          </div>

          <div className="grid gap-8">
            {colors.map((colorPalette) => (
              <ColorPalette key={colorPalette.name} colorPalette={colorPalette} />
            ))}
          </div>
        </div>
      </div>
    </ColorsProvider>
  )
}