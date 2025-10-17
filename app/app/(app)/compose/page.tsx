"use client"

import * as React from "react"
import {
  addEdge,
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeTypes,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import yaml from "js-yaml"
// import "@xyflow/react/dist/style.css" // Causes build issues, styles inlined in component
import {
  Download,
  HardDrive,
  Library,
  Network,
  Plus,
  Settings2,
} from "lucide-react"

import { Button } from "@/registry/new-york/ui/button"
import { Card } from "@/registry/new-york/ui/card"
import { Input } from "@/registry/new-york/ui/input"
import { Label } from "@/registry/new-york/ui/label"
import { ScrollArea } from "@/registry/new-york/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/new-york/ui/select"
import { Separator } from "@/registry/new-york/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/registry/new-york/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/new-york/ui/tabs"

const COMMON_IMAGES = [
  { name: "nginx", image: "nginx:alpine", category: "proxy" },
  { name: "postgres", image: "postgres:16-alpine", category: "database" },
  { name: "mysql", image: "mysql:8.4", category: "database" },
  { name: "mongodb", image: "mongo:7", category: "database" },
  { name: "redis", image: "redis:7-alpine", category: "cache" },
  { name: "node", image: "node:20-alpine", category: "runtime" },
  { name: "php", image: "php:8.3-fpm-alpine", category: "runtime" },
  { name: "ruby", image: "ruby:3.2-alpine", category: "runtime" },
  { name: "python", image: "python:3.12-alpine", category: "runtime" },
  {
    name: "clickhouse",
    image: "clickhouse/clickhouse-server:latest",
    category: "analytics",
  },
  {
    name: "kafka",
    image: "confluentinc/cp-kafka:latest",
    category: "streaming",
  },
  { name: "grafana", image: "grafana/grafana:latest", category: "monitoring" },
]

interface ComposeService {
  image: string
  ports?: string[]
  environment?: Record<string, string>
  networks?: string[]
  volumes?: string[]
  depends_on?: string[]
}

function ServiceNode({ data }: { data: any }) {
  return (
    <div className="rounded-lg border-2 bg-card p-4 shadow-lg min-w-[200px]">
      <div className="flex items-center gap-2">
        <div className="rounded bg-primary/10 p-2">
          <Settings2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{data.name}</div>
          <div className="text-xs text-muted-foreground">{data.image}</div>
        </div>
      </div>
      {data.ports && (
        <div className="mt-2 text-xs text-muted-foreground">
          📡 {data.ports[0]}
        </div>
      )}
      {data.networks && (
        <div className="mt-1 flex gap-1">
          {data.networks.map((net: string) => (
            <span
              key={net}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
            >
              {net}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  service: ServiceNode,
}

export default function ComposeSpecPage() {
  const [projectName, setProjectName] = React.useState("my-stack")
  const [services, setServices] = React.useState<
    Record<string, ComposeService>
  >({})
  const [networks, setNetworks] = React.useState<string[]>(["default"])
  const [volumes, setVolumes] = React.useState<string[]>([])
  const [selectedService, setSelectedService] = React.useState<string | null>(
    null
  )

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Update nodes when services change
  React.useEffect(() => {
    const newNodes: Node[] = Object.entries(services).map(
      ([name, config], i) => ({
        id: name,
        type: "service",
        position: { x: 100 + (i % 4) * 250, y: 100 + Math.floor(i / 4) * 150 },
        data: { name, ...config },
      })
    )

    const newEdges: Edge[] = []
    Object.entries(services).forEach(([name, config]) => {
      config.depends_on?.forEach((dep) => {
        newEdges.push({
          id: `${dep}-${name}`,
          source: dep,
          target: name,
          animated: true,
          style: { stroke: "hsl(var(--primary))" },
        })
      })
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [services, setNodes, setEdges])

  const addService = (template: (typeof COMMON_IMAGES)[0]) => {
    const serviceName = `${template.name}_${Object.keys(services).length + 1}`
    setServices({
      ...services,
      [serviceName]: {
        image: template.image,
        networks: ["default"],
      },
    })
  }

  const onConnect = React.useCallback(
    (params: Connection) => {
      // Add dependency when connecting nodes
      if (params.source && params.target) {
        setServices((prev) => ({
          ...prev,
          [params.target!]: {
            ...prev[params.target!],
            depends_on: [
              ...(prev[params.target!]?.depends_on || []),
              params.source!,
            ],
          },
        }))
      }
      setEdges((eds) => addEdge(params, eds))
    },
    [setEdges]
  )

  const generateYAML = () => {
    const compose = {
      version: "3.8",
      services,
      networks: networks.reduce((acc, net) => ({ ...acc, [net]: {} }), {}),
      volumes: volumes.reduce((acc, vol) => ({ ...acc, [vol]: {} }), {}),
    }
    return yaml.dump(compose, { indent: 2 })
  }

  const downloadCompose = () => {
    const yamlContent = generateYAML()
    const blob = new Blob([yamlContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "docker-compose.yml"
    a.click()
  }

  const updateServiceConfig = (
    serviceName: string,
    key: string,
    value: any
  ) => {
    setServices((prev) => ({
      ...prev,
      [serviceName]: {
        ...prev[serviceName],
        [key]: value,
      },
    }))
  }

  return (
    <div className="flex h-screen">
      {/* Main Canvas */}
      <div className="flex-1">
        <div className="flex h-full flex-col">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between border-b bg-card p-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold">Docker Compose Editor</h1>
              <span className="rounded bg-muted px-2 py-1 text-xs">
                {Object.keys(services).length} services
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setServices({})
                  setNetworks(["default"])
                  setVolumes([])
                }}
              >
                Clear
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement("input")
                  input.type = "file"
                  input.accept = ".yml,.yaml"
                  input.onchange = (e: any) => {
                    const file = e.target.files[0]
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      const content = e.target?.result as string
                      const parsed = yaml.load(content) as any
                      setServices(parsed.services || {})
                      setNetworks(
                        Object.keys(parsed.networks || { default: {} })
                      )
                      setVolumes(Object.keys(parsed.volumes || {}))
                    }
                    reader.readAsText(file)
                  }
                  input.click()
                }}
              >
                Import
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add service
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Add Service</SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="mt-4 h-[calc(100vh-100px)]">
                    <div className="space-y-2">
                      {COMMON_IMAGES.map((template) => (
                        <Button
                          key={template.image}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => addService(template)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          <div className="flex-1 text-left">
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {template.image}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-background">
            {Object.keys(services).length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Settings2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    No services yet
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Click "Add service" to start building your stack
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => addService(COMMON_IMAGES[1])}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add your first service
                  </Button>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => setSelectedService(node.id)}
                fitView
                className="bg-background"
              >
                <Background
                  gap={16}
                  color="hsl(var(--muted-foreground) / 0.3)"
                />
                <Controls className="border-border bg-card" />
                <Panel position="top-right" className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNetworks([...networks, `network_${networks.length}`])
                    }
                  >
                    <Network className="mr-2 h-4 w-4" />
                    Add network
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVolumes([...volumes, `vol_${volumes.length}`])
                    }
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Add volume
                  </Button>
                </Panel>
              </ReactFlow>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Configuration */}
      <div className="flex w-80 flex-col border-l bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Compose</h2>
          <div className="mt-4 space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="my-stack"
            />
          </div>
        </div>

        <Tabs defaultValue="services" className="flex-1">
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="services" className="flex-1">
              <Settings2 className="mr-2 h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="config" className="flex-1">
              <Network className="mr-2 h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-0 flex-1">
            <ScrollArea className="h-[calc(100vh-220px)]">
              <div className="space-y-2 p-4">
                {selectedService ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{selectedService}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedService(null)}
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Image</Label>
                      <Input
                        value={services[selectedService]?.image || ""}
                        onChange={(e) =>
                          updateServiceConfig(
                            selectedService,
                            "image",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Ports</Label>
                      <Input
                        placeholder="80:80"
                        onBlur={(e) => {
                          if (e.target.value) {
                            updateServiceConfig(selectedService, "ports", [
                              e.target.value,
                            ])
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Networks</Label>
                      <Select
                        onValueChange={(value) => {
                          updateServiceConfig(selectedService, "networks", [
                            value,
                          ])
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {networks.map((net) => (
                            <SelectItem key={net} value={net}>
                              {net}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground">
                    Click a service node to configure
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="config" className="mt-0 flex-1">
            <div className="space-y-4 p-4">
              <div>
                <div className="flex items-center justify-between">
                  <Label>Networks</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const name = prompt("Network name:")
                      if (name) setNetworks([...networks, name])
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {networks.map((net) => (
                    <div
                      key={net}
                      className="rounded bg-muted px-2 py-1 text-sm"
                    >
                      {net}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label>Volumes</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const name = prompt("Volume name:")
                      if (name) setVolumes([...volumes, name])
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2 space-y-1">
                  {volumes.map((vol) => (
                    <div
                      key={vol}
                      className="rounded bg-muted px-2 py-1 text-sm"
                    >
                      {vol}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="space-y-2 p-4">
          <Button onClick={downloadCompose} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download compose
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Library className="mr-2 h-4 w-4" />
                Library
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Service Library</SheetTitle>
              </SheetHeader>
              <ScrollArea className="mt-4 h-[calc(100vh-100px)]">
                <div className="space-y-4">
                  {[
                    "proxy",
                    "database",
                    "cache",
                    "runtime",
                    "analytics",
                    "streaming",
                    "monitoring",
                  ].map((category) => (
                    <div key={category}>
                      <h4 className="mb-2 text-sm font-semibold capitalize">
                        {category}
                      </h4>
                      <div className="space-y-2">
                        {COMMON_IMAGES.filter(
                          (img) => img.category === category
                        ).map((template) => (
                          <Button
                            key={template.image}
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => {
                              addService(template)
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {template.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  )
}
