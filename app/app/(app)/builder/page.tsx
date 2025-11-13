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
import {
  Copy as CopyIcon,
  Download,
  Eye,
  GripVertical,
  Maximize2,
  Minimize2,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  Settings2,
  Smartphone,
  Tablet,
  Trash2,
} from "lucide-react"

import { BuilderPreview } from "@/components/builder-preview"
import { OpenInHButton } from "@/components/open-in-h-button"
import { Button } from "@/registry/default/ui/button"
import { Card } from "@/registry/default/ui/card"
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
  gridClass?: string
  children?: PageItem[]
  props?: Record<string, any>
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

  const addItem = (
    name: string,
    type: "block" | "component" | "container",
    gridClass?: string
  ) => {
    const newItem: PageItem = {
      id: crypto.randomUUID(),
      name,
      type,
      children: type === "container" ? [] : undefined,
      containerType: type === "container" ? "div" : undefined,
      layoutType: type === "container" ? "grid" : undefined,
      gridClass: gridClass || undefined,
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
              item.gridClass ||
              (item.layoutType === "flex"
                ? "flex flex-col gap-4"
                : item.layoutType === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-4")

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

  const layoutTemplates = [
    { name: "Single Column", grid: "grid grid-cols-1 gap-1", icon: "▭" },
    { name: "Two Columns", grid: "grid grid-cols-2 gap-1", icon: "▭▭" },
    { name: "Three Columns", grid: "grid grid-cols-3 gap-1", icon: "▭▭▭" },
    {
      name: "Sidebar Left",
      grid: "grid grid-cols-[250px_1fr] gap-1",
      icon: "▌▭",
    },
    {
      name: "Sidebar Right",
      grid: "grid grid-cols-[1fr_250px] gap-1",
      icon: "▭▐",
    },
    { name: "Hero + 2 Col", grid: "grid grid-cols-1 gap-0", icon: "▬" },
  ]

  return (
    <div className="flex h-screen max-h-screen gap-1 p-2">
      {/* Left Sidebar - Component/Block Library */}
      <div className="w-64 space-y-1">
        <div>
          <h2 className="text-sm font-semibold">Component Library</h2>
          <p className="text-[10px] text-muted-foreground">
            Add blocks, components, and layouts
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-7">
            <TabsTrigger value="blocks" className="text-[10px]">
              Blocks
            </TabsTrigger>
            <TabsTrigger value="components" className="text-[10px]">
              Components
            </TabsTrigger>
            <TabsTrigger value="layouts" className="text-[10px]">
              Layouts
            </TabsTrigger>
          </TabsList>

          <div className="mt-1 space-y-1">
            <Input
              placeholder={`Filter ${activeTab}...`}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="h-7 text-xs"
            />

            <ScrollArea className="h-[calc(100vh-160px)]">
              <TabsContent value="blocks" className="mt-0 space-y-1 pr-2">
                {filteredBlocks.map((block) => (
                  <Card
                    key={block}
                    className="group cursor-pointer overflow-hidden border transition-all hover:border-primary/50 hover:shadow-sm"
                    onClick={() => addItem(block, "block")}
                  >
                    <div className="border-b px-2 py-1 bg-muted/30">
                      <p className="truncate text-[10px] font-medium">
                        {block}
                      </p>
                    </div>
                    <div className="relative h-16 overflow-hidden bg-background flex items-center justify-center">
                      <div className="text-[10px] text-muted-foreground">
                        {block} preview
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="components" className="mt-0 pr-2">
                <div className="columns-1 gap-1 space-y-1">
                  {filteredComponents.map((component) => {
                    const isFullWidth =
                      component.includes("nav") ||
                      component.includes("header") ||
                      component.includes("footer") ||
                      component.includes("bar")
                    const isSmall =
                      component.includes("button") ||
                      component.includes("badge") ||
                      component.includes("avatar") ||
                      component.includes("switch") ||
                      component.includes("checkbox")

                    return (
                      <Card
                        key={component}
                        className="group cursor-pointer break-inside-avoid overflow-hidden border transition-all hover:border-primary/50 hover:shadow-sm"
                        onClick={() => addItem(component, "component")}
                      >
                        <div className="border-b px-2 py-1 bg-muted/30">
                          <p className="truncate text-[10px] font-medium">
                            {component}
                          </p>
                        </div>
                        <div
                          className={`relative overflow-hidden bg-background flex items-center justify-center ${isFullWidth ? "h-14" : isSmall ? "h-10" : "h-12"}`}
                        >
                          <div className="text-[10px] text-muted-foreground">
                            {component}
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100">
                            <Plus className="h-3 w-3" />
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="layouts" className="mt-0 space-y-1 pr-2">
                {layoutTemplates.map((layout) => (
                  <Card
                    key={layout.name}
                    className="group cursor-pointer overflow-hidden border transition-all hover:border-primary/50 hover:shadow-sm"
                    onClick={() =>
                      addItem(layout.name, "container", layout.grid)
                    }
                  >
                    <div className="border-b px-2 py-1 bg-muted/30">
                      <p className="truncate text-[10px] font-medium">
                        {layout.name}
                      </p>
                    </div>
                    <div className="relative h-16 overflow-hidden bg-background flex items-center justify-center">
                      <div className="text-2xl text-muted-foreground/50">
                        {layout.icon}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/0 opacity-0 transition-all group-hover:bg-primary/10 group-hover:opacity-100">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>

      <Separator orientation="vertical" />

      {/* Center - Page Builder Canvas */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Page Builder</h2>
            <p className="text-[10px] text-muted-foreground">
              {pageItems.length} items in page
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Viewport Controls */}
            <div className="flex rounded-lg border">
              <Button
                variant={viewport === "mobile" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("mobile")}
                className="rounded-r-none h-7 text-[10px]"
              >
                Mobile
              </Button>
              <Button
                variant={viewport === "tablet" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("tablet")}
                className="rounded-none border-x h-7 text-[10px]"
              >
                Tablet
              </Button>
              <Button
                variant={viewport === "desktop" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewport("desktop")}
                className="rounded-l-none h-7 text-[10px]"
              >
                Desktop
              </Button>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={copyCode}
                disabled={pageItems.length === 0}
                title="Copy code"
                className="h-7 w-7"
              >
                <CopyIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={downloadCode}
                disabled={pageItems.length === 0}
                title="Download"
                className="h-7 w-7"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
            <OpenInHButton name="builder" />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-160px)] rounded-lg border bg-background">
          <div className="flex min-h-full items-start justify-center p-4">
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
                  <div className="relative min-h-[600px] bg-background">
                    {pageItems.length === 0 ? (
                      <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-center">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Your page is empty
                          </p>
                          <p className="text-[10px] text-muted-foreground">
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
      {selectedItemData && (
        <>
          <Separator orientation="vertical" />
          <div className="w-64 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">Properties</h2>
                <p className="text-[10px] text-muted-foreground">
                  {selectedItemData.name}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="h-7 text-[10px]"
              >
                Close
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="space-y-1 pr-2">
                {/* Basic Settings */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold">Basic Settings</h3>
                  <div className="space-y-1">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Type
                      </label>
                      <p className="text-xs capitalize">
                        {selectedItemData.type}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Name
                      </label>
                      <p className="text-xs">{selectedItemData.name}</p>
                    </div>
                  </div>
                </div>

                {/* Container Settings */}
                {selectedItemData.type === "container" && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold">
                      Container Settings
                    </h3>
                    <div className="space-y-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
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
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="div">div</SelectItem>
                            <SelectItem value="section">section</SelectItem>
                            <SelectItem value="article">article</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
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
                          <SelectTrigger className="h-7 text-xs">
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
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold">Styling</h3>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">
                      Custom Classes
                    </label>
                    <Input
                      placeholder="e.g. bg-muted p-8"
                      value={selectedItemData.props?.className || ""}
                      onChange={(e) =>
                        updateItemProps(selectedItemData.id, {
                          className: e.target.value,
                        })
                      }
                      className="h-7 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Add Tailwind CSS classes
                    </p>
                  </div>
                </div>

                {/* Component Props */}
                {selectedItemData.type === "component" && (
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold">
                      Component Properties
                    </h3>
                    <div className="space-y-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
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
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">
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
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced */}
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold">Advanced</h3>
                  <div className="space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-7 text-[10px]"
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
                      className="w-full h-7 text-[10px] text-destructive hover:text-destructive"
                      onClick={() => {
                        removeItem(selectedItemData.id)
                        setSelectedItem(null)
                      }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      Delete Item
                    </Button>
                  </div>
                </div>

                {/* Component Info */}
                <div className="rounded-lg border bg-muted/50 p-2 text-[10px]">
                  <p className="font-medium">About this item:</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
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
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      onClick={onSelect}
    >
      <div className="absolute left-0 top-0 z-10 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 p-1">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded bg-card/90 p-0.5 shadow-sm hover:shadow backdrop-blur active:cursor-grabbing"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="h-5 w-5 bg-card/90 backdrop-blur"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </Button>
        {isSelected && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 bg-primary/90 text-primary-foreground backdrop-blur"
          >
            <Settings2 className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>

      <div className="relative overflow-hidden">
        {item.type === "container" ? (
          <div className="min-h-[100px] bg-muted/10 p-2">
            <div className="mb-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                {item.name}
              </p>
            </div>
            {item.children && item.children.length > 0 ? (
              <div
                className={
                  item.gridClass ||
                  (item.layoutType === "flex"
                    ? "flex flex-col gap-1"
                    : item.layoutType === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 gap-1"
                      : "space-y-1")
                }
              >
                {item.children.map((child) => (
                  <div
                    key={child.id}
                    className="border-l border-primary/30 pl-1"
                  >
                    {child.type === "container" ? (
                      <div className="text-[10px] text-muted-foreground">
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
                <p className="text-[10px] text-muted-foreground">
                  Empty container
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
  )
}
