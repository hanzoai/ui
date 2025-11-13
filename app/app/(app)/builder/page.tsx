"use client"

import * as React from "react"
import { Index } from "@/__registry__"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ChevronLeft, ChevronRight, Copy, Download, Eye, GripVertical, Layout, Maximize2, Minimize2, Monitor, Moon, Palette, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Plus, Settings2, Smartphone, Sun, Tablet, Trash2 } from "lucide-react"

import { BuilderPreview } from "@/components/builder-preview"
import { ClassAutocomplete } from "@/components/class-autocomplete"
import { OpenInHButton } from "@/components/open-in-h-button"
import { Button } from "@/registry/default/ui/button"
import { Card } from "@/registry/default/ui/card"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/registry/default/ui/context-menu"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select"
import { Separator } from "@/registry/default/ui/separator"
import { Label } from "@/registry/default/ui/label"
import { Slider } from "@/registry/default/ui/slider"
import { Slider } from "@/registry/default/ui/slider"
import { Switch } from "@/registry/default/ui/switch"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"

interface PageItem {
  id: string
  name: string
  type: "block" | "component" | "container"
  containerType?: "div" | "section" | "article"
  layoutType?: "flex" | "grid" | "stack"
  children?: PageItem[]
  props?: Record<string, any>
  layout?: {
    display?: "block" | "inline-block" | "flex" | "grid" | "inline-flex"
    flexDirection?: "row" | "row-reverse" | "col" | "col-reverse"
    flexWrap?: "wrap" | "wrap-reverse" | "nowrap"
    justifyContent?: "start" | "end" | "center" | "between" | "around" | "evenly"
    alignItems?: "start" | "end" | "center" | "baseline" | "stretch"
    gap?: string
    gridCols?: string
    gridRows?: string
    gridTemplate?: string
    position?: "static" | "relative" | "absolute" | "fixed" | "sticky"
    zIndex?: number
    width?: string
    height?: string
    minWidth?: string
    minHeight?: string
    maxWidth?: string
    maxHeight?: string
    overflow?: "auto" | "hidden" | "scroll" | "visible"
    overflowX?: "auto" | "hidden" | "scroll" | "visible"
    overflowY?: "auto" | "hidden" | "scroll" | "visible"
  }
}

interface ThemeColor {
  l: number  // Lightness (0-100)
  c: number  // Chroma (0-0.4)
  h: number  // Hue (0-360)
}

interface ThemeColors {
  background: ThemeColor
  foreground: ThemeColor
  primary: ThemeColor
  secondary: ThemeColor
  accent: ThemeColor
  border: ThemeColor
}

const presetSchemes = {
  ocean: {
    background: { l: 98, c: 0.01, h: 220 },
    foreground: { l: 15, c: 0.02, h: 220 },
    primary: { l: 55, c: 0.20, h: 220 },
    secondary: { l: 90, c: 0.02, h: 220 },
    accent: { l: 70, c: 0.15, h: 200 },
    border: { l: 88, c: 0.01, h: 220 },
  },
  forest: {
    background: { l: 98, c: 0.01, h: 140 },
    foreground: { l: 15, c: 0.02, h: 140 },
    primary: { l: 45, c: 0.18, h: 145 },
    secondary: { l: 90, c: 0.02, h: 140 },
    accent: { l: 60, c: 0.12, h: 120 },
    border: { l: 88, c: 0.01, h: 140 },
  },
  sunset: {
    background: { l: 98, c: 0.01, h: 30 },
    foreground: { l: 15, c: 0.02, h: 30 },
    primary: { l: 60, c: 0.22, h: 25 },
    secondary: { l: 90, c: 0.02, h: 30 },
    accent: { l: 70, c: 0.18, h: 340 },
    border: { l: 88, c: 0.01, h: 30 },
  },
  monochrome: {
    background: { l: 100, c: 0, h: 0 },
    foreground: { l: 14.5, c: 0, h: 0 },
    primary: { l: 20.5, c: 0, h: 0 },
    secondary: { l: 97, c: 0, h: 0 },
    accent: { l: 70, c: 0, h: 0 },
    border: { l: 92.2, c: 0, h: 0 },
  },
}

export default function EnhancedBuilder() {
  const [blocks, setBlocks] = React.useState<string[]>([])
  const [components, setComponents] = React.useState<string[]>([])
  const [pageItems, setPageItems] = React.useState<PageItem[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("blocks")
  const [viewport, setViewport] = React.useState<
    "desktop" | "tablet" | "mobile"
  >("desktop")
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = React.useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = React.useState(false)

  // Theme state
  const [isDarkMode, setIsDarkMode] = React.useState(false)
  const [themeColors, setThemeColors] = React.useState<ThemeColors>(presetSchemes.ocean)
  const [colorMode, setColorMode] = React.useState<"oklch" | "hsl" | "hex">("oklch")

  React.useEffect(() => {
    // Get blocks from registry
    const blockIds = Object.keys(Index).filter((key) => {
      const item = Index[key]
      return item?.type === "components:block"
    })
    setBlocks(blockIds.sort())

    // Get UI components from registry
    const componentIds = Object.keys(Index).filter((key) => {
      const item = Index[key]
      return item?.type === "components:ui"
    })
    setComponents(componentIds.sort())
  }, [])

  // Filter blocks and components FIRST
  const filteredBlocks = React.useMemo(
    () =>
      blocks.filter((block) =>
        block.toLowerCase().includes(filter.toLowerCase())
      ),
    [blocks, filter]
  )

  const filteredComponents = React.useMemo(
    () =>
      components.filter((component) =>
        component.toLowerCase().includes(filter.toLowerCase())
      ),
    [components, filter]
  )

  // THEN categorize them (now filteredBlocks and filteredComponents exist)
  const blockCategories = React.useMemo(() => {
    const categories: Record<string, string[]> = {
      Dashboard: [],
      Authentication: [],
      Sidebar: [],
      Calendar: [],
      Newsletter: [],
      Login: [],
      Signup: [],
      Other: [],
    }

    filteredBlocks.forEach((block) => {
      if (block.startsWith("dashboard-")) categories["Dashboard"].push(block)
      else if (block.startsWith("authentication-") || block.startsWith("otp-"))
        categories["Authentication"].push(block)
      else if (block.startsWith("sidebar-")) categories["Sidebar"].push(block)
      else if (block.startsWith("calendar-")) categories["Calendar"].push(block)
      else if (block.startsWith("newsletter-"))
        categories["Newsletter"].push(block)
      else if (block.startsWith("login-")) categories["Login"].push(block)
      else if (block.startsWith("signup-")) categories["Signup"].push(block)
      else categories["Other"].push(block)
    })

    // Remove empty categories
    return Object.fromEntries(
      Object.entries(categories).filter(([_, items]) => items.length > 0)
    )
  }, [filteredBlocks])

  const componentCategories = React.useMemo(() => {
    const categories: Record<string, string[]> = {
      Form: [],
      Layout: [],
      Navigation: [],
      Display: [],
      Feedback: [],
      AI: [],
      Other: [],
    }

    filteredComponents.forEach((comp) => {
      if (
        ["input", "button", "checkbox", "select", "textarea", "form"].some(
          (c) => comp.includes(c)
        )
      )
        categories["Form"].push(comp)
      else if (
        ["card", "separator", "sheet", "dialog", "drawer"].some((c) =>
          comp.includes(c)
        )
      )
        categories["Layout"].push(comp)
      else if (
        ["navigation", "breadcrumb", "tabs", "menu"].some((c) =>
          comp.includes(c)
        )
      )
        categories["Navigation"].push(comp)
      else if (
        ["table", "list", "avatar", "badge", "calendar"].some((c) =>
          comp.includes(c)
        )
      )
        categories["Display"].push(comp)
      else if (
        ["alert", "toast", "progress", "skeleton"].some((c) => comp.includes(c))
      )
        categories["Feedback"].push(comp)
      else if (comp.startsWith("ai-")) categories["AI"].push(comp)
      else categories["Other"].push(comp)
    })

    return Object.fromEntries(
      Object.entries(categories).filter(([_, items]) => items.length > 0)
    )
  }, [filteredComponents])

  const addItem = (name: string, type: "block" | "component" | "container") => {
    const newItem: PageItem = {
      id: crypto.randomUUID(),
      name,
      type,
      children: type === "container" ? [] : undefined,
      containerType: type === "container" ? "div" : undefined,
      layoutType: type === "container" ? "flex" : undefined,
    }
    setPageItems([...pageItems, newItem])
  }

  const removeItem = (id: string) => {
    setPageItems(pageItems.filter((item) => item.id !== id))
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    setPageItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  const generatePageCode = () => {
    // Collect all unique imports from the page tree
    const collectImports = (items: PageItem[]) => {
      const blocks = new Set<string>()
      const components = new Set<string>()

      const traverse = (item: PageItem) => {
        if (item.type === "block") {
          blocks.add(item.name)
        } else if (item.type === "component") {
          components.add(item.name)
        }
        if (item.children) {
          item.children.forEach(traverse)
        }
      }

      items.forEach(traverse)

      const blockImports = Array.from(blocks)
        .map(
          (name) =>
            `import ${toPascalCase(name)} from "@/registry/default/block/${name}"`
        )
        .join("\n")

      const componentImports = Array.from(components)
        .map(
          (name) =>
            `import { ${toPascalCase(name)} } from "@/registry/default/ui/${name}"`
        )
        .join("\n")

      return [blockImports, componentImports].filter(Boolean).join("\n")
    }

    const renderProps = (props?: Record<string, any>) => {
      if (!props || Object.keys(props).length === 0) return ""

      return Object.entries(props)
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key}="${value}"`
          } else if (typeof value === "boolean") {
            return value ? key : ""
          } else if (typeof value === "number") {
            return `${key}={${value}}`
          }
          return ""
        })
        .filter(Boolean)
        .join(" ")
    }

    const renderItems = (items: PageItem[], indent = 2): string => {
      return items
        .map((item): string => {
          const spacing = " ".repeat(indent * 2)
          const props = renderProps(item.props)

          if (item.type === "block") {
            const componentName = toPascalCase(item.name)
            return props
              ? `${spacing}<${componentName} ${props} />`
              : `${spacing}<${componentName} />`
          } else if (item.type === "component") {
            const componentName = toPascalCase(item.name)
            return props
              ? `${spacing}<${componentName} ${props} />`
              : `${spacing}<${componentName} />`
          } else if (item.type === "container") {
            const Tag = item.containerType || "div"
            const layoutClass =
              item.layoutType === "flex"
                ? "flex flex-col gap-4"
                : item.layoutType === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-4"

            const customClass = item.props?.className || ""
            const fullClassName = [layoutClass, customClass]
              .filter(Boolean)
              .join(" ")

            const children: string =
              item.children && item.children.length > 0
                ? "\n" + renderItems(item.children, indent + 1) + "\n" + spacing
                : ""

            return children
              ? `${spacing}<${Tag} className="${fullClassName}">${children}</${Tag}>`
              : `${spacing}<${Tag} className="${fullClassName}" />`
          }
          return ""
        })
        .join("\n")
    }

    const allImports = collectImports(pageItems)

    return `"use client"

import * as React from "react"
${allImports}

export default function CustomPage() {
  return (
    <div className="flex min-h-screen flex-col">
${renderItems(pageItems, 3)}
    </div>
  )
}
`
  }

  const copyCode = async () => {
    const code = generatePageCode()
    await navigator.clipboard.writeText(code)
  }

  const downloadCode = () => {
    const code = generatePageCode()
    const blob = new Blob([code], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "page.tsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  const deployWithHanzo = () => {
    const code = generatePageCode()
    console.log("Deploying with Hanzo:", code)
    window.open("https://hanzo.ai/deploy", "_blank")
  }

  const toPascalCase = (str: string) => {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("")
  }

  const viewportWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  }

  const updateItemProps = (id: string, props: Record<string, any>) => {
    setPageItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, props: { ...item.props, ...props } } : item
      )
    )
  }

  const updateItemSettings = (
    id: string,
    settings: Partial<Omit<PageItem, "id" | "name" | "type">>
  ) => {
    setPageItems((items) =>
      items.map((item) => (item.id === id ? { ...item, ...settings } : item))
    )
  }

  const addChildToContainer = (containerId: string, child: PageItem) => {
    setPageItems((items) =>
      items.map((item) =>
        item.id === containerId && item.type === "container"
          ? {
              ...item,
              children: [...(item.children || []), child],
            }
          : item
      )
    )
  }

  const removeChildFromContainer = (containerId: string, childId: string) => {
    setPageItems((items) =>
      items.map((item) =>
        item.id === containerId && item.type === "container"
          ? {
              ...item,
              children: item.children?.filter((c) => c.id !== childId),
            }
          : item
      )
    )
  }

  const selectedItemData = pageItems.find((item) => item.id === selectedItem)

  return (
    <div className="flex h-screen max-h-screen">
      {/* Left Sidebar - Component/Block Library */}
      <div className={`relative flex-shrink-0 transition-all duration-200 ${isFullscreen || leftSidebarCollapsed ? "w-0" : "w-72"} ${isFullscreen || leftSidebarCollapsed ? "hidden" : "border-r p-3 space-y-3"}`}>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Library</h2>
          <p className="text-xs text-muted-foreground">
            Blocks & Components
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="blocks" className="text-xs">Blocks</TabsTrigger>
            <TabsTrigger value="components" className="text-xs">Components</TabsTrigger>
          </TabsList>

          <div className="mt-3 space-y-2">
            <Input
              placeholder={`Search ${activeTab}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-8 text-xs"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => addItem("container", "container")}
              className="w-full h-7 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Container
            </Button>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <TabsContent value="blocks" className="mt-0 space-y-2">
                {filteredBlocks.map((block) => (
                  <Card
                    key={block}
                    className="group cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-sm"
                    onClick={() => addItem(block, "block")}
                  >
                    <div className="relative h-24 overflow-hidden bg-muted/30">
                      <div className="pointer-events-none scale-75">
                        <BuilderPreview
                          name={block}
                          type="block"
                          scale={0.2}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-background/0 opacity-0 transition-opacity group-hover:bg-background/90 group-hover:opacity-100">
                        <Plus className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="border-t px-2 py-1.5">
                      <p className="truncate text-[11px] font-medium">{block}</p>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="components" className="mt-0 space-y-1.5">
                {filteredComponents.map((component) => (
                  <Card
                    key={component}
                    className="group cursor-pointer px-2.5 py-2 transition-all hover:border-primary/50 hover:shadow-sm"
                    onClick={() => addItem(component, "component")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{component}</p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>

      {/* Center - Page Builder Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header - Hidden in fullscreen */}
        <div className={`flex items-center justify-between border-b px-3 py-2 ${isFullscreen ? "hidden" : ""}`}>
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-semibold">Canvas</h2>
            <p className="text-xs text-muted-foreground">
              {pageItems.length} {pageItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Sidebar Collapse Buttons */}
            {!isFullscreen && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
                  className="h-7 w-7"
                  title={leftSidebarCollapsed ? "Show library" : "Hide library"}
                >
                  {leftSidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            {/* Viewport Controls */}
            <div className="flex rounded-md border h-7">
              <Button
                variant={viewport === "mobile" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewport("mobile")}
                className="h-6 w-6 rounded-r-none"
                title="Mobile (375px)"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewport === "tablet" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewport("tablet")}
                className="h-6 w-6 rounded-none border-x"
                title="Tablet (768px)"
              >
                <Tablet className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewport === "desktop" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewport("desktop")}
                className="h-6 w-6 rounded-l-none"
                title="Desktop (100%)"
              >
                <Monitor className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="h-7 w-7"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            <Separator orientation="vertical" className="h-6" />
            {!isFullscreen && selectedItemData && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                  className="h-7 w-7"
                  title={rightSidebarCollapsed ? "Show properties" : "Hide properties"}
                >
                  {rightSidebarCollapsed ? <PanelRightOpen className="h-3.5 w-3.5" /> : <PanelRightClose className="h-3.5 w-3.5" />}
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </>
            )}
            <OpenInHButton name="builder" />
            <Separator orientation="vertical" className="h-8" />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                disabled={pageItems.length === 0}
              >
                Copy Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCode}
                disabled={pageItems.length === 0}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={deployWithHanzo}
                disabled={pageItems.length === 0}
              >
                Deploy with Hanzo
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className={`flex-1 bg-background ${isFullscreen ? "" : "border-t"}`}>
          <div className="flex min-h-full items-start justify-center">
            <div
              style={{
                width: viewportWidths[viewport],
                maxWidth: "100%",
                transition: "width 0.3s ease",
              }}
            >
              <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pageItems.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="relative min-h-screen bg-background pl-16">
                    {pageItems.length === 0 ? (
                      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-center -ml-16">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Your page is empty
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Add blocks, components, or containers from the left
                          </p>
                        </div>
                      </div>
                    ) : (
                      pageItems.map((item) => (
                        <SortableItem
                          key={item.id}
                          item={item}
                          onRemove={() => removeItem(item.id)}
                          onSelect={() => setSelectedItem(item.id)}
                          isSelected={selectedItem === item.id}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>

                <DragOverlay>
                  {activeId ? (
                    <div className="rounded-lg border bg-card p-4 shadow-lg">
                      <p className="text-sm font-medium">
                        {pageItems.find((item) => item.id === activeId)?.name}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Right Sidebar - Property Editor */}
      {selectedItemData && !isFullscreen && !rightSidebarCollapsed && (
        <>
          <div className="relative flex-shrink-0 w-80 border-l p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Properties</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedItemData.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-120px)]">
              <div className="space-y-6 pr-4">
                {/* Basic Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Basic Settings</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Type
                      </label>
                      <p className="text-sm capitalize">
                        {selectedItemData.type}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        Name
                      </label>
                      <p className="text-sm">{selectedItemData.name}</p>
                    </div>
                  </div>
                </div>

                {/* Container Settings */}
                {selectedItemData.type === "container" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Container Settings
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          HTML Tag
                        </label>
                        <Select
                          value={selectedItemData.containerType || "div"}
                          onValueChange={(value) =>
                            updateItemSettings(selectedItemData.id, {
                              containerType: value as
                                | "div"
                                | "section"
                                | "article",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="div">div</SelectItem>
                            <SelectItem value="section">section</SelectItem>
                            <SelectItem value="article">article</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Layout Type
                        </label>
                        <Select
                          value={selectedItemData.layoutType || "flex"}
                          onValueChange={(value) =>
                            updateItemSettings(selectedItemData.id, {
                              layoutType: value as "flex" | "grid" | "stack",
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flex">Flex (Column)</SelectItem>
                            <SelectItem value="grid">Grid (2 cols)</SelectItem>
                            <SelectItem value="stack">
                              Stack (Vertical)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Styling */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Styling</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Tailwind Classes
                    </label>
                    <ClassAutocomplete
                      value={selectedItemData.props?.className || ""}
                      onChange={(classes) =>
                        updateItemProps(selectedItemData.id, {
                          className: classes,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Container Children */}
                {selectedItemData.type === "container" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Container Children (
                      {selectedItemData.children?.length || 0})
                    </h3>
                    {selectedItemData.children &&
                    selectedItemData.children.length > 0 ? (
                      <div className="space-y-2">
                        {selectedItemData.children.map((child, index) => (
                          <div
                            key={child.id}
                            className="flex items-center justify-between rounded-md border bg-card p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                #{index + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium">
                                  {child.name}
                                </p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {child.type}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                removeChildFromContainer(
                                  selectedItemData.id,
                                  child.id
                                )
                              }
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No children yet. Children can be added in a future
                        update.
                      </p>
                    )}
                  </div>
                )}

                {/* Component Props */}
                {selectedItemData.type === "component" && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">
                      Component Properties
                    </h3>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Variant
                        </label>
                        <Input
                          placeholder="e.g. default, outline"
                          value={selectedItemData.props?.variant || ""}
                          onChange={(e) =>
                            updateItemProps(selectedItemData.id, {
                              variant: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          Size
                        </label>
                        <Input
                          placeholder="e.g. sm, md, lg"
                          value={selectedItemData.props?.size || ""}
                          onChange={(e) =>
                            updateItemProps(selectedItemData.id, {
                              size: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Advanced</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const code = JSON.stringify(selectedItemData, null, 2)
                        navigator.clipboard.writeText(code)
                      }}
                    >
                      Copy Item JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => {
                        removeItem(selectedItemData.id)
                        setSelectedItem(null)
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Item
                    </Button>
                  </div>
                </div>

                {/* Component Info */}
                <div className="rounded-lg border bg-muted/50 p-3 text-xs">
                  <p className="font-medium">About this item:</p>
                  <ul className="mt-2 space-y-1 text-muted-foreground">
                    <li>• ID: {selectedItemData.id.slice(0, 8)}...</li>
                    <li>• Type: {selectedItemData.type}</li>
                    {selectedItemData.children && (
                      <li>• Children: {selectedItemData.children.length}</li>
                    )}
                  </ul>
                </div>
              </div>
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  )
}

function SortableItem({
  item,
  onRemove,
  onSelect,
  isSelected,
}: {
  item: PageItem
  onRemove: () => void
  onSelect: () => void
  isSelected: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          className={`group relative ${isSelected ? "ring-2 ring-primary" : ""}`}
          onClick={onSelect}
        >
      <div className="absolute -left-12 top-2 z-10 flex flex-col items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded bg-card p-1 shadow-sm hover:shadow active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="h-6 w-6 bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
        {isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 bg-background/80 backdrop-blur"
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="relative overflow-hidden border-b last:border-b-0">
        {item.type === "container" ? (
          <div className="min-h-[100px] bg-muted/20 p-4">
            <div className="mb-2 flex items-center gap-2 border-b border-dashed pb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Container ({item.containerType || "div"}) -{" "}
                {item.layoutType || "flex"}
              </p>
            </div>
            {item.children && item.children.length > 0 ? (
              <div
                className={
                  item.layoutType === "flex"
                    ? "flex flex-col gap-4"
                    : item.layoutType === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                      : "space-y-4"
                }
              >
                {item.children.map((child) => (
                  <div
                    key={child.id}
                    className="border-l-2 border-primary/50 pl-3"
                  >
                    {child.type === "container" ? (
                      <div className="text-xs text-muted-foreground">
                        Nested Container: {child.name}
                      </div>
                    ) : (
                      <BuilderPreview
                        name={child.name}
                        type={child.type as "block" | "component"}
                        scale={0.75}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[80px] items-center justify-center">
                <p className="text-xs text-muted-foreground">
                  Empty container - Add items from the left sidebar
                </p>
              </div>
            )}
          </div>
        ) : (
          <BuilderPreview
            name={item.name}
            type={item.type as "block" | "component"}
            scale={1}
          />
        )}
      </div>
    </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onSelect}>
          <Eye className="mr-2 h-4 w-4" />
          Inspect Element
        </ContextMenuItem>
        <ContextMenuItem onClick={onSelect}>
          <Palette className="mr-2 h-4 w-4" />
          Edit Styles
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => {
            const code = JSON.stringify(item, null, 2)
            navigator.clipboard.writeText(code)
          }}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy JSON
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
