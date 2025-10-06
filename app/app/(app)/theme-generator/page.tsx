"use client"

import * as React from "react"
import { HexColorPicker } from "react-colorful"
import { Download, Shuffle, RotateCcw } from "lucide-react"

import { Button } from "@/registry/new-york/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york/ui/card"
import { Input } from "@/registry/new-york/ui/input"
import { Label } from "@/registry/new-york/ui/label"
import { ScrollArea } from "@/registry/new-york/ui/scroll-area"
import { Separator } from "@/registry/new-york/ui/separator"
import { Slider } from "@/registry/new-york/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/new-york/ui/popover"

const DEFAULT_COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  "card-foreground": "#0a0a0a",
  popover: "#ffffff",
  "popover-foreground": "#0a0a0a",
  primary: "#0070f3",
  "primary-foreground": "#ffffff",
  secondary: "#f4f4f5",
  "secondary-foreground": "#0a0a0a",
  muted: "#f4f4f5",
  "muted-foreground": "#71717a",
  accent: "#f4f4f5",
  "accent-foreground": "#0a0a0a",
  destructive: "#ef4444",
  "destructive-foreground": "#ffffff",
  border: "#e4e4e7",
  input: "#e4e4e7",
  ring: "#0070f3",
}

export default function ThemeGeneratorPage() {
  const [colors, setColors] = React.useState(DEFAULT_COLORS)
  const [radius, setRadius] = React.useState(0.5)
  const [mode, setMode] = React.useState<"light" | "dark">("light")

  const updateColor = (key: string, value: string) => {
    setColors({ ...colors, [key]: value })
  }

  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return "0 0% 0%"

    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0,
      s = 0,
      l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
  }

  const generateCSS = () => {
    const css = `:root {
${Object.entries(colors)
  .map(([key, value]) => `  --${key}: ${hexToHSL(value)};`)
  .join("\n")}
  --radius: ${radius}rem;
}`
    return css
  }

  const copyCSS = () => {
    navigator.clipboard.writeText(generateCSS())
  }

  const randomizeTheme = () => {
    const randomHex = () =>
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")

    setColors({
      ...colors,
      primary: randomHex(),
      secondary: randomHex(),
      accent: randomHex(),
    })
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Theme Generator</h1>
        <p className="mt-2 text-muted-foreground">
          Customize your theme with live preview. Generate CSS variables for your
          app.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Controls Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>Customize your color palette</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {Object.entries(colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm capitalize">
                        {key.replace(/-/g, " ")}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                          >
                            <div
                              className="mr-2 h-4 w-4 rounded border"
                              style={{ backgroundColor: value }}
                            />
                            {value}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto">
                          <HexColorPicker
                            color={value}
                            onChange={(v) => updateColor(key, v)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radius</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Slider
                  value={[radius]}
                  onValueChange={(v) => setRadius(v[0])}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-sm text-muted-foreground">{radius}rem</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button onClick={randomizeTheme} variant="outline" className="flex-1">
              <Shuffle className="mr-2 h-4 w-4" />
              Random
            </Button>
            <Button
              onClick={() => setColors(DEFAULT_COLORS)}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <Button onClick={copyCSS} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Copy CSS
          </Button>
        </div>

        {/* Preview Area */}
        <div
          className="space-y-6"
          style={
            {
              "--background": hexToHSL(colors.background),
              "--foreground": hexToHSL(colors.foreground),
              "--primary": hexToHSL(colors.primary),
              "--primary-foreground": hexToHSL(colors["primary-foreground"]),
              "--secondary": hexToHSL(colors.secondary),
              "--secondary-foreground": hexToHSL(colors["secondary-foreground"]),
              "--muted": hexToHSL(colors.muted),
              "--muted-foreground": hexToHSL(colors["muted-foreground"]),
              "--accent": hexToHSL(colors.accent),
              "--accent-foreground": hexToHSL(colors["accent-foreground"]),
              "--border": hexToHSL(colors.border),
              "--radius": `${radius}rem`,
            } as React.CSSProperties
          }
        >
          <Tabs defaultValue="preview">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Preview</CardTitle>
                  <CardDescription>
                    See your theme in action with live components
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button>Primary Button</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Input Field</Label>
                    <Input placeholder="Enter text..." />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Nested Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          This is how cards look with your theme
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Another Card</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          With muted text and borders
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle>CSS Variables</CardTitle>
                  <CardDescription>
                    Copy these into your globals.css
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-muted p-4 text-sm">
                    <code>{generateCSS()}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
