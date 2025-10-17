"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react"

import { Badge } from "@/registry/default/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/default/ui/card"
import { Progress } from "@/registry/default/ui/progress"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/registry/default/ui/tabs"
import { extended } from "@/registry/extended"
import { registry } from "@/registry/registry"

interface ComponentHealth {
  name: string
  status: "healthy" | "warning" | "error"
  hasDoc: boolean
  hasImplementation: boolean
  hasTests: boolean
  lastUpdated?: string
  issues: string[]
}

interface HealthMetrics {
  total: number
  healthy: number
  warnings: number
  errors: number
  coverage: number
}

export default function HealthDashboard() {
  const [components, setComponents] = useState<ComponentHealth[]>([])
  const [metrics, setMetrics] = useState<HealthMetrics>({
    total: 0,
    healthy: 0,
    warnings: 0,
    errors: 0,
    coverage: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    checkComponentHealth()
  }, [])

  const checkComponentHealth = async () => {
    // Combine all registries
    const allComponents = [...registry, ...extended]
    const healthData: ComponentHealth[] = []

    for (const component of allComponents) {
      const health: ComponentHealth = {
        name: component.name,
        status: "healthy",
        hasDoc: false,
        hasImplementation: false,
        hasTests: false,
        issues: [],
      }

      // Check documentation
      try {
        const docResponse = await fetch(`/docs/components/${component.name}`)
        health.hasDoc = docResponse.status === 200
        if (!health.hasDoc) {
          health.issues.push("Missing documentation")
          health.status = "warning"
        }
      } catch {
        health.hasDoc = false
        health.issues.push("Documentation check failed")
        health.status = "error"
      }

      // Check implementation (simplified check)
      health.hasImplementation = component.files && component.files.length > 0
      if (!health.hasImplementation) {
        health.issues.push("Missing implementation files")
        health.status = "error"
      }

      // Check for tests (would need actual test file check)
      health.hasTests = false // Placeholder

      healthData.push(health)
    }

    // Calculate metrics
    const healthy = healthData.filter((c) => c.status === "healthy").length
    const warnings = healthData.filter((c) => c.status === "warning").length
    const errors = healthData.filter((c) => c.status === "error").length

    setMetrics({
      total: healthData.length,
      healthy,
      warnings,
      errors,
      coverage: (healthy / healthData.length) * 100,
    })

    setComponents(healthData)
    setLoading(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-500"
      case "warning":
        return "text-yellow-500"
      case "error":
        return "text-red-500"
      default:
        return "text-gray-500"
    }
  }

  const filteredComponents =
    selectedCategory === "all"
      ? components
      : components.filter((c) => c.status === selectedCategory)

  if (loading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">
              Checking component health...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Component Health Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of all hanzo/ui components
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Components
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">
              Across all registries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {metrics.healthy}
            </div>
            <p className="text-xs text-muted-foreground">
              {((metrics.healthy / metrics.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {metrics.warnings}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {metrics.errors}
            </div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Health Score */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Health Score</CardTitle>
          <CardDescription>
            Percentage of components without issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {metrics.coverage.toFixed(1)}%
              </span>
              {metrics.coverage > 80 ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
            </div>
            <Progress value={metrics.coverage} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>Target: 95%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component List */}
      <Card>
        <CardHeader>
          <CardTitle>Component Status</CardTitle>
          <CardDescription>
            Detailed health status for each component
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({components.length})</TabsTrigger>
              <TabsTrigger value="healthy">
                Healthy ({metrics.healthy})
              </TabsTrigger>
              <TabsTrigger value="warning">
                Warnings ({metrics.warnings})
              </TabsTrigger>
              <TabsTrigger value="error">Errors ({metrics.errors})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-2">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">Component</th>
                      <th className="p-2 text-center">Status</th>
                      <th className="p-2 text-center">Docs</th>
                      <th className="p-2 text-center">Implementation</th>
                      <th className="p-2 text-center">Tests</th>
                      <th className="p-2 text-left">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComponents.map((component) => (
                      <tr key={component.name} className="border-b">
                        <td className="p-2 font-medium">{component.name}</td>
                        <td className="p-2 text-center">
                          {getStatusIcon(component.status)}
                        </td>
                        <td className="p-2 text-center">
                          {component.hasDoc ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {component.hasImplementation ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {component.hasTests ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {component.issues.map((issue, idx) => (
                              <Badge
                                key={idx}
                                variant={
                                  component.status === "error"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last Update */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        Dashboard updates in real-time • Last check:{" "}
        {new Date().toLocaleTimeString()}
      </div>
    </div>
  )
}
