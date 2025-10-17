"use client"

import * as React from "react"
import {
  Check,
  Copy,
  Download,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Settings2,
  Shuffle,
  Sparkles,
  Sun,
} from "lucide-react"
import { HexColorInput, HexColorPicker } from "react-colorful"

import { cn } from "@/lib/utils"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/registry/default/ui/alert"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Checkbox } from "@/registry/default/ui/checkbox"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover"
import { Progress } from "@/registry/default/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Separator } from "@/registry/default/ui/separator"
import { Slider } from "@/registry/default/ui/slider"
import { Switch } from "@/registry/default/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { Textarea } from "@/registry/default/ui/textarea"

const DEFAULT_LIGHT_COLORS = {
  background: "#ffffff",
  foreground: "#0a0a0a",
  card: "#ffffff",
  "card-foreground": "#0a0a0a",
  popover: "#ffffff",
  "popover-foreground": "#0a0a0a",
  primary: "#0099ff",
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
  ring: "#0099ff",
}

const DEFAULT_DARK_COLORS = {
  background: "#0a0a0a",
  foreground: "#fafafa",
  card: "#0a0a0a",
  "card-foreground": "#fafafa",
  popover: "#0a0a0a",
  "popover-foreground": "#fafafa",
  primary: "#0099ff",
  "primary-foreground": "#ffffff",
  secondary: "#262626",
  "secondary-foreground": "#fafafa",
  muted: "#262626",
  "muted-foreground": "#a3a3a3",
  accent: "#262626",
  "accent-foreground": "#fafafa",
  destructive: "#dc2626",
  "destructive-foreground": "#ffffff",
  border: "#262626",
  input: "#262626",
  ring: "#0099ff",
}

const PRESET_THEMES = {
  "Electric Blue": {
    primary: "#0099ff",
    secondary: "#1e293b",
    accent: "#06b6d4",
  },
  Forest: {
    primary: "#10b981",
    secondary: "#065f46",
    accent: "#34d399",
  },
  Sunset: {
    primary: "#f97316",
    secondary: "#dc2626",
    accent: "#fbbf24",
  },
  "Purple Haze": {
    primary: "#8b5cf6",
    secondary: "#7c3aed",
    accent: "#a78bfa",
  },
  Ocean: {
    primary: "#0ea5e9",
    secondary: "#0284c7",
    accent: "#38bdf8",
  },
}

export default function ThemeGeneratorPage() {
  const [colors, setColors] = React.useState(DEFAULT_LIGHT_COLORS)
  const [radius, setRadius] = React.useState(0.5)
  const [mode, setMode] = React.useState<"light" | "dark">("light")
  const [copied, setCopied] = React.useState(false)
  const [activeColorKey, setActiveColorKey] = React.useState<string | null>(
    null
  )

  const updateColor = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const toggleMode = () => {
    const newMode = mode === "light" ? "dark" : "light"
    setMode(newMode)
    setColors(newMode === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS)
  }

  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return "0 0% 0%"

    const r = parseInt(result[1], 16) / 255
    const g = parseInt(result[2], 16) / 255
    const b = parseInt(result[3], 16) / 255

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
    const css = `@layer base {
  :root {
${Object.entries(colors)
  .map(([key, value]) => `    --${key}: ${hexToHSL(value)};`)
  .join("\n")}
    --radius: ${radius}rem;
  }

  .dark {
${Object.entries(colors)
  .map(([key, value]) => `    --${key}: ${hexToHSL(value)};`)
  .join("\n")}
  }
}`
    return css
  }

  const copyCSS = async () => {
    try {
      await navigator.clipboard.writeText(generateCSS())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy CSS:", err)
    }
  }

  const applyPresetTheme = (presetName: string) => {
    const preset = PRESET_THEMES[presetName as keyof typeof PRESET_THEMES]
    if (preset) {
      setColors((prev) => ({
        ...prev,
        primary: preset.primary,
        "primary-foreground": mode === "dark" ? "#ffffff" : "#ffffff",
        secondary: preset.secondary,
        "secondary-foreground": mode === "dark" ? "#fafafa" : "#0a0a0a",
        accent: preset.accent,
        "accent-foreground": mode === "dark" ? "#fafafa" : "#0a0a0a",
        ring: preset.primary,
      }))
    }
  }

  const randomizeTheme = () => {
    const randomHex = () => {
      const hue = Math.floor(Math.random() * 360)
      const saturation = 50 + Math.floor(Math.random() * 50)
      const lightness = 40 + Math.floor(Math.random() * 30)
      return hslToHex(hue, saturation, lightness)
    }

    const primary = randomHex()
    const secondary = randomHex()
    const accent = randomHex()

    setColors((prev) => ({
      ...prev,
      primary,
      "primary-foreground": "#ffffff",
      secondary,
      "secondary-foreground": mode === "dark" ? "#fafafa" : "#0a0a0a",
      accent,
      "accent-foreground": mode === "dark" ? "#fafafa" : "#0a0a0a",
      ring: primary,
    }))
  }

  const hslToHex = (h: number, s: number, l: number) => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  return (
    <div className="container max-w-[1600px] py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            Theme Generator
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Create beautiful themes with live preview and instant export
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleMode}
            className="relative"
          >
            {mode === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Enhanced Controls Sidebar */}
        <div className="space-y-6">
          {/* Preset Themes */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Preset Themes
              </CardTitle>
              <CardDescription>Start with a pre-designed theme</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(PRESET_THEMES).map((presetName) => (
                  <Button
                    key={presetName}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPresetTheme(presetName)}
                    className="justify-start text-xs"
                  >
                    {presetName}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Customization */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>Fine-tune your color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {Object.entries(colors).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs font-medium capitalize">
                        {key.replace(/-/g, " ")}
                      </Label>
                      <Popover
                        open={activeColorKey === key}
                        onOpenChange={(open) =>
                          setActiveColorKey(open ? key : null)
                        }
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-between font-mono text-xs h-9"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-5 w-5 rounded-md border shadow-sm"
                                style={{ backgroundColor: value }}
                              />
                              <span>{value.toUpperCase()}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              HSL: {hexToHSL(value).split(" ").join(", ")}
                            </div>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="start">
                          <div className="space-y-3">
                            <HexColorPicker
                              color={value}
                              onChange={(v) => updateColor(key, v)}
                              style={{ width: 200, height: 200 }}
                            />
                            <HexColorInput
                              color={value}
                              onChange={(v) => updateColor(key, v)}
                              className="w-full rounded-md border px-3 py-1 text-sm font-mono"
                              prefixed
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Border Radius Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Border Radius</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Slider
                  value={[radius]}
                  onValueChange={(v) => setRadius(v[0])}
                  min={0}
                  max={1.5}
                  step={0.05}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sharp</span>
                  <span className="font-mono">{radius}rem</span>
                  <span>Rounded</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={randomizeTheme}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Shuffle className="mr-2 h-4 w-4" />
              Randomize
            </Button>
            <Button
              onClick={() =>
                setColors(
                  mode === "light" ? DEFAULT_LIGHT_COLORS : DEFAULT_DARK_COLORS
                )
              }
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          <Button onClick={copyCSS} className="w-full" size="lg">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy CSS Variables
              </>
            )}
          </Button>
        </div>

        {/* Enhanced Preview Area */}
        <div className="space-y-6">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Live Preview</TabsTrigger>
              <TabsTrigger value="components">Components</TabsTrigger>
              <TabsTrigger value="code">Export Code</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-6">
              <div className="theme-preview-container" data-theme="custom">
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .theme-preview-container[data-theme="custom"] {
                        --background: ${hexToHSL(colors.background)};
                        --foreground: ${hexToHSL(colors.foreground)};
                        --card: ${hexToHSL(colors.card)};
                        --card-foreground: ${hexToHSL(colors["card-foreground"])};
                        --popover: ${hexToHSL(colors.popover)};
                        --popover-foreground: ${hexToHSL(colors["popover-foreground"])};
                        --primary: ${hexToHSL(colors.primary)};
                        --primary-foreground: ${hexToHSL(colors["primary-foreground"])};
                        --secondary: ${hexToHSL(colors.secondary)};
                        --secondary-foreground: ${hexToHSL(colors["secondary-foreground"])};
                        --muted: ${hexToHSL(colors.muted)};
                        --muted-foreground: ${hexToHSL(colors["muted-foreground"])};
                        --accent: ${hexToHSL(colors.accent)};
                        --accent-foreground: ${hexToHSL(colors["accent-foreground"])};
                        --destructive: ${hexToHSL(colors.destructive)};
                        --destructive-foreground: ${hexToHSL(colors["destructive-foreground"])};
                        --border: ${hexToHSL(colors.border)};
                        --input: ${hexToHSL(colors.input)};
                        --ring: ${hexToHSL(colors.ring)};
                        --radius: ${radius}rem;
                      }
                      .theme-preview-container[data-theme="custom"] * {
                        border-radius: calc(var(--radius) * 1);
                      }
                    `,
                  }}
                />
                <div
                  className="rounded-lg border bg-background p-8 shadow-sm"
                  style={{
                    backgroundColor: `hsl(var(--background))`,
                    color: `hsl(var(--foreground))`,
                    borderColor: `hsl(var(--border))`,
                  }}
                >
                  <div className="space-y-8">
                    {/* Hero Section Preview */}
                    <div className="space-y-4">
                      <h2 className="text-3xl font-bold">
                        Welcome to Your App
                      </h2>
                      <p className="text-lg text-muted-foreground">
                        This is how your theme looks in a real application
                        context
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <Button size="lg">Get Started</Button>
                        <Button size="lg" variant="secondary">
                          Learn More
                        </Button>
                        <Button size="lg" variant="outline">
                          Documentation
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Form Elements */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Form Elements</h3>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              placeholder="name@example.com"
                              type="email"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                              id="message"
                              placeholder="Type your message here..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox id="terms" />
                            <Label htmlFor="terms" className="text-sm">
                              Accept terms and conditions
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Selections</h3>
                        <div className="space-y-3">
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="option1">Option 1</SelectItem>
                              <SelectItem value="option2">Option 2</SelectItem>
                              <SelectItem value="option3">Option 3</SelectItem>
                            </SelectContent>
                          </Select>
                          <RadioGroup defaultValue="option-one">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="option-one"
                                id="option-one"
                              />
                              <Label htmlFor="option-one">Option One</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value="option-two"
                                id="option-two"
                              />
                              <Label htmlFor="option-two">Option Two</Label>
                            </div>
                          </RadioGroup>
                          <div className="flex items-center space-x-2">
                            <Switch id="notifications" />
                            <Label htmlFor="notifications">
                              Enable notifications
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader>
                          <CardTitle>Card Title</CardTitle>
                          <CardDescription>
                            Card description goes here
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            This is how cards appear with your custom theme. The
                            borders, shadows, and colors all adapt to your
                            selections.
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Statistics</CardTitle>
                          <CardDescription>
                            Your performance metrics
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Progress</span>
                            <span className="text-sm font-medium">75%</span>
                          </div>
                          <Progress value={75} className="h-2" />
                          <div className="flex gap-2 pt-2">
                            <Badge>Active</Badge>
                            <Badge variant="secondary">Updated</Badge>
                            <Badge variant="outline">New</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Alert */}
                    <Alert>
                      <AlertTitle>Heads up!</AlertTitle>
                      <AlertDescription>
                        You can customize every aspect of your theme using the
                        controls on the left. Changes are reflected in
                        real-time.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="components" className="mt-6">
              <div
                className="theme-components-container"
                data-theme="custom-components"
              >
                <style
                  dangerouslySetInnerHTML={{
                    __html: `
                      .theme-components-container[data-theme="custom-components"] {
                        --background: ${hexToHSL(colors.background)};
                        --foreground: ${hexToHSL(colors.foreground)};
                        --card: ${hexToHSL(colors.card)};
                        --card-foreground: ${hexToHSL(colors["card-foreground"])};
                        --popover: ${hexToHSL(colors.popover)};
                        --popover-foreground: ${hexToHSL(colors["popover-foreground"])};
                        --primary: ${hexToHSL(colors.primary)};
                        --primary-foreground: ${hexToHSL(colors["primary-foreground"])};
                        --secondary: ${hexToHSL(colors.secondary)};
                        --secondary-foreground: ${hexToHSL(colors["secondary-foreground"])};
                        --muted: ${hexToHSL(colors.muted)};
                        --muted-foreground: ${hexToHSL(colors["muted-foreground"])};
                        --accent: ${hexToHSL(colors.accent)};
                        --accent-foreground: ${hexToHSL(colors["accent-foreground"])};
                        --destructive: ${hexToHSL(colors.destructive)};
                        --destructive-foreground: ${hexToHSL(colors["destructive-foreground"])};
                        --border: ${hexToHSL(colors.border)};
                        --input: ${hexToHSL(colors.input)};
                        --ring: ${hexToHSL(colors.ring)};
                        --radius: ${radius}rem;
                      }
                      .theme-components-container[data-theme="custom-components"] * {
                        border-radius: calc(var(--radius) * 1);
                      }
                    `,
                  }}
                />
                <div
                  className="rounded-lg border bg-background p-8 space-y-8"
                  style={{
                    backgroundColor: `hsl(var(--background))`,
                    color: `hsl(var(--foreground))`,
                    borderColor: `hsl(var(--border))`,
                  }}
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Button Variants
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="link">Link</Button>
                        <Button size="sm">Small</Button>
                        <Button size="lg">Large</Button>
                        <Button disabled>Disabled</Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Badge Variants
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Typography</h3>
                      <div className="space-y-2">
                        <h1 className="text-4xl font-bold">Heading 1</h1>
                        <h2 className="text-3xl font-bold">Heading 2</h2>
                        <h3 className="text-2xl font-bold">Heading 3</h3>
                        <h4 className="text-xl font-bold">Heading 4</h4>
                        <p className="text-lg">Large paragraph text</p>
                        <p>Regular paragraph text</p>
                        <p className="text-sm text-muted-foreground">
                          Muted text
                        </p>
                        <p className="text-xs">Small text</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>CSS Variables</CardTitle>
                  <CardDescription>
                    Copy this code and paste it into your globals.css file
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="overflow-auto rounded-lg bg-muted p-6 text-sm">
                      <code className="language-css">{generateCSS()}</code>
                    </pre>
                    <Button
                      onClick={copyCSS}
                      size="sm"
                      className="absolute right-2 top-2"
                      variant="ghost"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-4 rounded-lg bg-muted/50 p-4">
                    <p className="text-sm font-medium mb-2">
                      Usage Instructions:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Copy the CSS variables above</li>
                      <li>
                        Open your project's global CSS file (usually globals.css
                        or app.css)
                      </li>
                      <li>
                        Replace the existing :root variables with your new theme
                      </li>
                      <li>Save the file and refresh your application</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
