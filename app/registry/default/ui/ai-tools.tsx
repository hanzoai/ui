"use client"

import * as React from "react"
import {
  Calculator,
  ChevronRight,
  Code,
  FileText,
  Globe,
  Play,
  Search,
  Settings,
  Wrench,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Input } from "@/registry/default/ui/input"
import { ScrollArea } from "@/registry/default/ui/scroll-area"
import { Separator } from "@/registry/default/ui/separator"
import { Textarea } from "@/registry/default/ui/textarea"

export interface AITool {
  name: string
  description: string
  icon?: React.ComponentType<{ className?: string }>
  category?: string
  parameters?: Record<string, any>
  execute?: (params: any) => Promise<any>
  enabled?: boolean
}

export interface AIToolsProps extends React.HTMLAttributes<HTMLDivElement> {
  tools?: AITool[]
  onToolExecute?: (toolName: string, params: any) => void
  onToolResult?: (toolName: string, result: any) => void
  onToolToggle?: (toolName: string, enabled: boolean) => void
  showCategories?: boolean
  searchable?: boolean
}

// Default tools
const defaultTools: AITool[] = [
  {
    name: "web_search",
    description: "Search the web for current information",
    icon: Search,
    category: "Information",
    enabled: true,
    parameters: { query: "" },
  },
  {
    name: "code_execution",
    description: "Execute code snippets safely",
    icon: Code,
    category: "Development",
    enabled: true,
    parameters: { code: "", language: "javascript" },
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations",
    icon: Calculator,
    category: "Utilities",
    enabled: true,
    parameters: { expression: "" },
  },
  {
    name: "file_reader",
    description: "Read and analyze file contents",
    icon: FileText,
    category: "Files",
    enabled: true,
    parameters: { file_path: "" },
  },
  {
    name: "api_call",
    description: "Make HTTP requests to external APIs",
    icon: Globe,
    category: "Network",
    enabled: false,
    parameters: { url: "", method: "GET", headers: {}, body: "" },
  },
]

const categoryIcons = {
  Information: Search,
  Development: Code,
  Utilities: Calculator,
  Files: FileText,
  Network: Globe,
  default: Wrench,
}

const AITools = React.forwardRef<HTMLDivElement, AIToolsProps>(
  (
    {
      className,
      children,
      tools = defaultTools,
      onToolExecute,
      onToolResult,
      onToolToggle,
      showCategories = true,
      searchable = true,
      ...props
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [selectedTool, setSelectedTool] = React.useState<string | null>(null)
    const [toolParameters, setToolParameters] = React.useState<
      Record<string, any>
    >({})
    const [isExecuting, setIsExecuting] = React.useState(false)

    // Filter tools based on search query
    const filteredTools = React.useMemo(() => {
      if (!searchQuery) return tools
      return tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }, [tools, searchQuery])

    // Group tools by category
    const categorizedTools = React.useMemo(() => {
      const categories: Record<string, AITool[]> = {}
      filteredTools.forEach((tool) => {
        const category = tool.category || "Other"
        if (!categories[category]) categories[category] = []
        categories[category].push(tool)
      })
      return categories
    }, [filteredTools])

    const handleToolExecute = async (tool: AITool) => {
      if (!tool.enabled) return

      setIsExecuting(true)
      try {
        const params = toolParameters[tool.name] || tool.parameters || {}

        if (tool.execute) {
          const result = await tool.execute(params)
          onToolResult?.(tool.name, result)
        } else {
          onToolExecute?.(tool.name, params)
        }
      } catch (error) {
        console.error(`Tool execution failed: ${tool.name}`, error)
      } finally {
        setIsExecuting(false)
      }
    }

    const handleParameterChange = (
      toolName: string,
      paramName: string,
      value: any
    ) => {
      setToolParameters((prev) => ({
        ...prev,
        [toolName]: {
          ...prev[toolName],
          [paramName]: value,
        },
      }))
    }

    const ToolCard = ({ tool }: { tool: AITool }) => {
      const Icon = tool.icon || Wrench
      const isSelected = selectedTool === tool.name
      const params = toolParameters[tool.name] || tool.parameters || {}

      return (
        <Card
          className={cn(
            "transition-all cursor-pointer",
            isSelected && "ring-2 ring-primary",
            !tool.enabled && "opacity-50"
          )}
          onClick={() => setSelectedTool(isSelected ? null : tool.name)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    tool.enabled
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium">
                    {tool.name}
                  </CardTitle>
                  {tool.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {tool.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onToolToggle && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToolToggle(tool.name, !tool.enabled)
                    }}
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                )}
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isSelected && "rotate-90"
                  )}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-3">
              {tool.description}
            </p>

            {isSelected && Object.keys(params).length > 0 && (
              <div className="space-y-3 border-t pt-3">
                <h4 className="text-sm font-medium">Parameters</h4>
                {Object.entries(params).map(([paramName, paramValue]) => (
                  <div key={paramName} className="space-y-1">
                    <label className="text-xs font-medium capitalize">
                      {paramName.replace(/_/g, " ")}
                    </label>
                    {typeof paramValue === "string" &&
                    paramValue.length > 50 ? (
                      <Textarea
                        value={params[paramName] || ""}
                        onChange={(e) =>
                          handleParameterChange(
                            tool.name,
                            paramName,
                            e.target.value
                          )
                        }
                        placeholder={`Enter ${paramName}`}
                        className="text-xs"
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={params[paramName] || ""}
                        onChange={(e) =>
                          handleParameterChange(
                            tool.name,
                            paramName,
                            e.target.value
                          )
                        }
                        placeholder={`Enter ${paramName}`}
                        className="text-xs"
                      />
                    )}
                  </div>
                ))}
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToolExecute(tool)
                  }}
                  disabled={!tool.enabled || isExecuting}
                  size="sm"
                  className="w-full"
                >
                  {isExecuting ? (
                    <>
                      <Zap className="h-3 w-3 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 mr-2" />
                      Execute
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wrench className="h-5 w-5" />
            <h3 className="font-semibold">AI Tools</h3>
            <Badge variant="secondary">
              {tools.filter((t) => t.enabled).length} enabled
            </Badge>
          </div>
        </div>

        {/* Search */}
        {searchable && (
          <div className="space-y-2">
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Tools */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {showCategories
              ? Object.entries(categorizedTools).map(
                  ([category, categoryTools]) => {
                    const CategoryIcon =
                      categoryIcons[category as keyof typeof categoryIcons] ||
                      categoryIcons.default
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-medium text-sm">{category}</h4>
                          <Separator className="flex-1" />
                        </div>
                        <div className="space-y-2 pl-6">
                          {categoryTools.map((tool) => (
                            <ToolCard key={tool.name} tool={tool} />
                          ))}
                        </div>
                      </div>
                    )
                  }
                )
              : filteredTools.map((tool) => (
                  <ToolCard key={tool.name} tool={tool} />
                ))}

            {filteredTools.length === 0 && (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h4 className="font-medium text-muted-foreground">
                  No tools found
                </h4>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search criteria
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {children}
      </div>
    )
  }
)
AITools.displayName = "AITools"

export { AITools, type AITool }
