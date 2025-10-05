"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  Code,
  Copy,
  Edit,
  MessageSquare,
  Network,
  Palette,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Stop,
  Trash2,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/registry/default/ui/badge"
import { Button } from "@/registry/default/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/registry/default/ui/dialog"
import { Input } from "@/registry/default/ui/input"
import { Label } from "@/registry/default/ui/label"
import { Progress } from "@/registry/default/ui/progress"
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
import { Textarea } from "@/registry/default/ui/textarea"

// Types and Interfaces
export type AgentType =
  | "research"
  | "code"
  | "analysis"
  | "creative"
  | "automation"
export type AgentStatus = "idle" | "working" | "completed" | "error"
export type WorkflowMode = "sequential" | "parallel" | "custom"

export interface Task {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high"
  status: "pending" | "in-progress" | "completed" | "failed"
  assignedTo?: string
  progress: number
  createdAt: Date
  estimatedTime?: number
}

export interface Agent {
  id: string
  name: string
  type: AgentType
  capabilities: string[]
  status: AgentStatus
  currentTask?: Task
  position: { x: number; y: number }
  connections: string[]
  avatar?: string
  description?: string
  performance: {
    tasksCompleted: number
    successRate: number
    avgCompletionTime: number
  }
}

export interface WorkflowConnection {
  id: string
  source: string
  target: string
  condition?: string
  animated?: boolean
}

export interface AIAgentsProps {
  agents?: Agent[]
  onAgentCreate?: (
    agent: Omit<Agent, "id" | "position" | "performance">
  ) => void
  onTaskAssign?: (task: Task, agentId: string) => void
  onWorkflowSave?: (workflow: {
    agents: Agent[]
    connections: WorkflowConnection[]
  }) => void
  workflowMode?: WorkflowMode
  className?: string
}

// Agent type configurations
const agentTypeConfig = {
  research: {
    icon: Search,
    color: "bg-blue-500",
    capabilities: [
      "web-search",
      "data-analysis",
      "fact-checking",
      "source-validation",
    ],
  },
  code: {
    icon: Code,
    color: "bg-green-500",
    capabilities: ["code-generation", "debugging", "testing", "optimization"],
  },
  analysis: {
    icon: Brain,
    color: "bg-purple-500",
    capabilities: [
      "data-processing",
      "pattern-recognition",
      "insights",
      "reporting",
    ],
  },
  creative: {
    icon: Palette,
    color: "bg-pink-500",
    capabilities: [
      "content-creation",
      "design",
      "brainstorming",
      "storytelling",
    ],
  },
  automation: {
    icon: Zap,
    color: "bg-orange-500",
    capabilities: [
      "workflow-execution",
      "api-integration",
      "scheduling",
      "monitoring",
    ],
  },
}

// Communication animation component
const CommunicationFlow: React.FC<{
  connections: WorkflowConnection[]
  agents: Agent[]
}> = ({ connections, agents }) => {
  const [activeFlows, setActiveFlows] = useState<string[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      if (connections.length > 0) {
        const randomConnection =
          connections[Math.floor(Math.random() * connections.length)]
        setActiveFlows((prev) => [...prev, randomConnection.id])

        setTimeout(() => {
          setActiveFlows((prev) =>
            prev.filter((id) => id !== randomConnection.id)
          )
        }, 2000)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [connections])

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ overflow: "visible" }}
    >
      {connections.map((connection) => {
        const sourceAgent = agents.find((a) => a.id === connection.source)
        const targetAgent = agents.find((a) => a.id === connection.target)

        if (!sourceAgent || !targetAgent) return null

        const isActive = activeFlows.includes(connection.id)

        return (
          <g key={connection.id}>
            <defs>
              <marker
                id={`arrowhead-${connection.id}`}
                markerWidth="10"
                markerHeight="7"
                refX="10"
                refY="3.5"
                orient="auto"
              >
                <polygon
                  points="0 0, 10 3.5, 0 7"
                  fill={isActive ? "#3b82f6" : "#94a3b8"}
                />
              </marker>
            </defs>
            <line
              x1={sourceAgent.position.x + 50}
              y1={sourceAgent.position.y + 50}
              x2={targetAgent.position.x + 50}
              y2={targetAgent.position.y + 50}
              stroke={isActive ? "#3b82f6" : "#94a3b8"}
              strokeWidth={isActive ? "3" : "2"}
              strokeDasharray={isActive ? "5,5" : "0"}
              markerEnd={`url(#arrowhead-${connection.id})`}
              className={isActive ? "animate-pulse" : ""}
            />
            {isActive && (
              <circle r="4" fill="#3b82f6" className="animate-pulse">
                <animateMotion
                  dur="2s"
                  repeatCount="1"
                  path={`M${sourceAgent.position.x + 50},${sourceAgent.position.y + 50} L${targetAgent.position.x + 50},${targetAgent.position.y + 50}`}
                />
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// Agent card component
const AgentCard: React.FC<{
  agent: Agent
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDrag?: (position: { x: number; y: number }) => void
  isDragging?: boolean
}> = ({
  agent,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDrag,
  isDragging,
}) => {
  const dragRef = useRef<HTMLDivElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const config = agentTypeConfig[agent.type]
  const Icon = config.icon

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!onDrag) return

      setIsDragActive(true)
      const startX = e.clientX - agent.position.x
      const startY = e.clientY - agent.position.y

      const handleMouseMove = (e: MouseEvent) => {
        const newX = e.clientX - startX
        const newY = e.clientY - startY
        onDrag({ x: Math.max(0, newX), y: Math.max(0, newY) })
      }

      const handleMouseUp = () => {
        setIsDragActive(false)
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }

      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    },
    [agent.position, onDrag]
  )

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case "idle":
        return "bg-gray-500"
      case "working":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case "idle":
        return Clock
      case "working":
        return Activity
      case "completed":
        return CheckCircle
      case "error":
        return AlertCircle
      default:
        return Clock
    }
  }

  const StatusIcon = getStatusIcon(agent.status)

  return (
    <Card
      ref={dragRef}
      className={cn(
        "absolute w-64 transition-all duration-200 cursor-move select-none",
        isSelected && "ring-2 ring-blue-500",
        isDragActive && "shadow-lg scale-105",
        isDragging && "opacity-50"
      )}
      style={{
        left: agent.position.x,
        top: agent.position.y,
        transform: isDragActive ? "scale(1.05)" : "scale(1)",
      }}
      onMouseDown={handleMouseDown}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-lg text-white", config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm">{agent.name}</CardTitle>
              <CardDescription className="text-xs capitalize">
                {agent.type} Agent
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete?.()
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-3 w-3", getStatusColor(agent.status))} />
          <span className="text-xs font-medium capitalize">{agent.status}</span>
        </div>

        {agent.currentTask && (
          <div className="bg-muted p-2 rounded text-xs">
            <div className="font-medium">{agent.currentTask.title}</div>
            <Progress value={agent.currentTask.progress} className="mt-1 h-1" />
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {agent.capabilities.slice(0, 3).map((capability) => (
            <Badge key={capability} variant="secondary" className="text-xs">
              {capability}
            </Badge>
          ))}
          {agent.capabilities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Tasks: {agent.performance.tasksCompleted}</span>
          <span>Success: {agent.performance.successRate}%</span>
        </div>
      </CardContent>
    </Card>
  )
}

// Agent creation dialog
const CreateAgentDialog: React.FC<{
  onAgentCreate: (agent: Omit<Agent, "id" | "position" | "performance">) => void
}> = ({ onAgentCreate }) => {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "research" as AgentType,
    description: "",
    capabilities: [] as string[],
  })

  const handleSubmit = () => {
    if (!formData.name) return

    onAgentCreate({
      name: formData.name,
      type: formData.type,
      status: "idle",
      capabilities:
        formData.capabilities.length > 0
          ? formData.capabilities
          : agentTypeConfig[formData.type].capabilities,
      connections: [],
      description: formData.description,
    })

    setFormData({
      name: "",
      type: "research",
      description: "",
      capabilities: [],
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure a new AI agent for your workflow
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter agent name"
            />
          </div>

          <div>
            <Label htmlFor="type">Agent Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: AgentType) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(agentTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{type}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the agent's purpose and role"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              Create Agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Task assignment dialog
const TaskAssignmentDialog: React.FC<{
  agents: Agent[]
  onTaskAssign: (task: Task, agentId: string) => void
}> = ({ agents, onTaskAssign }) => {
  const [open, setOpen] = useState(false)
  const [taskData, setTaskData] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    assignedTo: "",
    estimatedTime: 0,
  })

  const handleSubmit = () => {
    if (!taskData.title || !taskData.assignedTo) return

    const task: Task = {
      id: crypto.randomUUID(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
      estimatedTime: taskData.estimatedTime || undefined,
    }

    onTaskAssign(task, taskData.assignedTo)

    setTaskData({
      title: "",
      description: "",
      priority: "medium",
      assignedTo: "",
      estimatedTime: 0,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Assign Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign New Task</DialogTitle>
          <DialogDescription>
            Create and assign a task to an agent
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={taskData.title}
              onChange={(e) =>
                setTaskData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter task title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={taskData.description}
              onChange={(e) =>
                setTaskData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the task requirements"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={taskData.priority}
                onValueChange={(value: Task["priority"]) =>
                  setTaskData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="estimatedTime">Estimated Time (hours)</Label>
              <Input
                id="estimatedTime"
                type="number"
                value={taskData.estimatedTime}
                onChange={(e) =>
                  setTaskData((prev) => ({
                    ...prev,
                    estimatedTime: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="assignedTo">Assign to Agent</Label>
            <Select
              value={taskData.assignedTo}
              onValueChange={(value) =>
                setTaskData((prev) => ({ ...prev, assignedTo: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents
                  .filter((agent) => agent.status === "idle")
                  .map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            agentTypeConfig[agent.type].color
                          )}
                        />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!taskData.title || !taskData.assignedTo}
            >
              Assign Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
export const AIAgents: React.FC<AIAgentsProps> = ({
  agents: initialAgents = [],
  onAgentCreate,
  onTaskAssign,
  onWorkflowSave,
  workflowMode = "custom",
  className,
}) => {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [connections, setConnections] = useState<WorkflowConnection[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [isWorkflowRunning, setIsWorkflowRunning] = useState(false)
  const workflowRef = useRef<HTMLDivElement>(null)

  // Initialize default agents if none provided
  useEffect(() => {
    if (initialAgents.length === 0) {
      const defaultAgents: Agent[] = [
        {
          id: "1",
          name: "Research Assistant",
          type: "research",
          capabilities: ["web-search", "data-analysis", "fact-checking"],
          status: "idle",
          position: { x: 50, y: 50 },
          connections: ["2"],
          performance: {
            tasksCompleted: 12,
            successRate: 95,
            avgCompletionTime: 45,
          },
        },
        {
          id: "2",
          name: "Code Generator",
          type: "code",
          capabilities: ["code-generation", "debugging", "testing"],
          status: "working",
          position: { x: 400, y: 50 },
          connections: ["3"],
          currentTask: {
            id: "t1",
            title: "Generate React Component",
            description: "Create a reusable button component",
            priority: "high",
            status: "in-progress",
            progress: 65,
            createdAt: new Date(),
          },
          performance: {
            tasksCompleted: 8,
            successRate: 90,
            avgCompletionTime: 38,
          },
        },
        {
          id: "3",
          name: "Quality Analyst",
          type: "analysis",
          capabilities: ["code-review", "performance-analysis", "testing"],
          status: "idle",
          position: { x: 750, y: 50 },
          connections: [],
          performance: {
            tasksCompleted: 15,
            successRate: 98,
            avgCompletionTime: 25,
          },
        },
      ]
      setAgents(defaultAgents)

      const defaultConnections: WorkflowConnection[] = [
        { id: "c1", source: "1", target: "2", animated: true },
        { id: "c2", source: "2", target: "3", animated: true },
      ]
      setConnections(defaultConnections)
    }
  }, [initialAgents])

  const handleAgentCreate = (
    agentData: Omit<Agent, "id" | "position" | "performance">
  ) => {
    const newAgent: Agent = {
      ...agentData,
      id: crypto.randomUUID(),
      position: { x: 100 + agents.length * 300, y: 100 },
      performance: {
        tasksCompleted: 0,
        successRate: 100,
        avgCompletionTime: 0,
      },
    }

    setAgents((prev) => [...prev, newAgent])
    onAgentCreate?.(agentData)
  }

  const handleTaskAssign = (task: Task, agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId
          ? { ...agent, currentTask: task, status: "working" as AgentStatus }
          : agent
      )
    )
    onTaskAssign?.(task, agentId)

    // Simulate task progress
    const progressInterval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.id === agentId && agent.currentTask) {
            const newProgress = Math.min(agent.currentTask.progress + 10, 100)
            const updatedTask = { ...agent.currentTask, progress: newProgress }

            if (newProgress === 100) {
              clearInterval(progressInterval)
              return {
                ...agent,
                currentTask: undefined,
                status: "completed" as AgentStatus,
                performance: {
                  ...agent.performance,
                  tasksCompleted: agent.performance.tasksCompleted + 1,
                },
              }
            }

            return { ...agent, currentTask: updatedTask }
          }
          return agent
        })
      )
    }, 2000)
  }

  const handleAgentDrag = (
    agentId: string,
    position: { x: number; y: number }
  ) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === agentId ? { ...agent, position } : agent
      )
    )
  }

  const handleDeleteAgent = (agentId: string) => {
    setAgents((prev) => prev.filter((agent) => agent.id !== agentId))
    setConnections((prev) =>
      prev.filter((conn) => conn.source !== agentId && conn.target !== agentId)
    )
    if (selectedAgent === agentId) {
      setSelectedAgent(null)
    }
  }

  const handleWorkflowToggle = () => {
    setIsWorkflowRunning(!isWorkflowRunning)

    if (!isWorkflowRunning) {
      // Start workflow simulation
      agents.forEach((agent, index) => {
        setTimeout(() => {
          setAgents((prev) =>
            prev.map((a) =>
              a.id === agent.id ? { ...a, status: "working" as AgentStatus } : a
            )
          )
        }, index * 1000)
      })
    } else {
      // Stop workflow
      setAgents((prev) =>
        prev.map((agent) => ({ ...agent, status: "idle" as AgentStatus }))
      )
    }
  }

  const handleSaveWorkflow = () => {
    const workflow = { agents, connections }
    onWorkflowSave?.(workflow)
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <Tabs defaultValue="workflow" className="w-full h-full">
        <div className="flex items-center justify-between p-4 border-b">
          <TabsList>
            <TabsTrigger value="workflow">Workflow Designer</TabsTrigger>
            <TabsTrigger value="agents">Agent Manager</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <CreateAgentDialog onAgentCreate={handleAgentCreate} />
            <TaskAssignmentDialog
              agents={agents}
              onTaskAssign={handleTaskAssign}
            />
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={isWorkflowRunning ? "destructive" : "default"}
              onClick={handleWorkflowToggle}
            >
              {isWorkflowRunning ? (
                <>
                  <Stop className="h-4 w-4 mr-2" />
                  Stop Workflow
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Workflow
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleSaveWorkflow}>
              Save Workflow
            </Button>
          </div>
        </div>

        <TabsContent value="workflow" className="flex-1 p-0">
          <div
            ref={workflowRef}
            className="relative w-full h-[600px] bg-muted/20 overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          >
            <CommunicationFlow connections={connections} agents={agents} />

            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                isSelected={selectedAgent === agent.id}
                onSelect={() => setSelectedAgent(agent.id)}
                onEdit={() => {
                  /* TODO: Implement edit */
                }}
                onDelete={() => handleDeleteAgent(agent.id)}
                onDrag={(position) => handleAgentDrag(agent.id, position)}
              />
            ))}

            {agents.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Bot className="h-12 w-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Agents Created</h3>
                  <p className="text-sm">
                    Create your first AI agent to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const config = agentTypeConfig[agent.type]
              const Icon = config.icon

              return (
                <Card key={agent.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "p-3 rounded-lg text-white",
                          config.color
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {agent.type} Agent
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status</span>
                      <Badge
                        variant={
                          agent.status === "working" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {agent.status}
                      </Badge>
                    </div>

                    {agent.currentTask && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Current Task</div>
                        <div className="bg-muted p-3 rounded-lg">
                          <div className="font-medium text-sm">
                            {agent.currentTask.title}
                          </div>
                          <Progress
                            value={agent.currentTask.progress}
                            className="mt-2"
                          />
                          <div className="text-xs text-muted-foreground mt-1">
                            {agent.currentTask.progress}% Complete
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="text-sm font-medium">Capabilities</div>
                      <div className="flex flex-wrap gap-1">
                        {agent.capabilities.map((capability) => (
                          <Badge
                            key={capability}
                            variant="outline"
                            className="text-xs"
                          >
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold">
                          {agent.performance.tasksCompleted}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Tasks
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {agent.performance.successRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Success
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">
                          {agent.performance.avgCompletionTime}m
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Avg Time
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="flex-1 p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{agents.length}</div>
                    <div className="text-sm text-muted-foreground">
                      Total Agents
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {agents.filter((a) => a.status === "working").length}
                    </div>
                    <div className="text-sm text-muted-foreground">Active</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Workflow Status</span>
                    <Badge
                      variant={isWorkflowRunning ? "default" : "secondary"}
                    >
                      {isWorkflowRunning ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Connected Agents</span>
                    <span>{connections.length} connections</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Agent Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {agents.map((agent) => (
                      <div
                        key={agent.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-3 h-3 rounded-full",
                              agentTypeConfig[agent.type].color
                            )}
                          />
                          <div>
                            <div className="font-medium text-sm">
                              {agent.name}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {agent.type}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {agent.performance.successRate}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            success rate
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIAgents
