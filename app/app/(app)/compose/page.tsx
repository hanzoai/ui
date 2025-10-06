"use client"

import * as React from "react"
import { Download, Upload, Play } from "lucide-react"

import { Button } from "@/registry/new-york/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/new-york/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/ui/tabs"

export default function ComposeSpecPage() {
  const [yamlContent, setYamlContent] = React.useState(`version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - frontend

  api:
    image: node:20-alpine
    ports:
      - "3000:3000"
    networks:
      - frontend
      - backend
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: example
    networks:
      - backend
    volumes:
      - db_data:/var/lib/postgresql/data

networks:
  frontend:
  backend:

volumes:
  db_data:
`)

  const handleExport = () => {
    const blob = new Blob([yamlContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "docker-compose.yml"
    a.click()
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Docker Compose Playground</h1>
        <p className="mt-2 text-muted-foreground">
          Visual editor for Docker Compose files with live YAML sync
        </p>
      </div>

      <div className="space-y-6">
        <Tabs defaultValue="visual">
          <TabsList>
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="yaml">YAML Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Nodes</CardTitle>
                <CardDescription>
                  Drag and drop to create your Docker Compose architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex h-[600px] items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Visual editor coming soon
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Built with React Flow and @hanzo/compose-spec
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yaml" className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export YAML
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import YAML
              </Button>
              <Button variant="outline">
                <Play className="mr-2 h-4 w-4" />
                Validate
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <textarea
                  className="h-[600px] w-full resize-none rounded-lg border-0 bg-muted p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                  placeholder="Enter your docker-compose.yml content..."
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Architecture Preview</CardTitle>
                <CardDescription>
                  Visual representation of your Docker Compose stack
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="rounded-lg border bg-card p-4">
                        <h4 className="font-semibold">web (nginx:alpine)</h4>
                        <p className="text-xs text-muted-foreground">Port: 80:80</p>
                        <p className="text-xs text-muted-foreground">Network: frontend</p>
                      </div>

                      <div className="rounded-lg border bg-card p-4">
                        <h4 className="font-semibold">api (node:20-alpine)</h4>
                        <p className="text-xs text-muted-foreground">Port: 3000:3000</p>
                        <p className="text-xs text-muted-foreground">Networks: frontend, backend</p>
                      </div>

                      <div className="rounded-lg border bg-card p-4">
                        <h4 className="font-semibold">db (postgres:16-alpine)</h4>
                        <p className="text-xs text-muted-foreground">Network: backend</p>
                        <p className="text-xs text-muted-foreground">Volume: db_data</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted p-4">
                    <h4 className="text-sm font-semibold">Networks</h4>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>• frontend - web, api</li>
                      <li>• backend - api, db</li>
                    </ul>
                  </div>

                  <div className="rounded-lg border bg-muted p-4">
                    <h4 className="text-sm font-semibold">Volumes</h4>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <li>• db_data - PostgreSQL data</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>About Compose Spec</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              The <code className="rounded bg-muted px-1">@hanzo/compose-spec</code> package provides
              visual editing tools for Docker Compose files with real-time YAML synchronization.
            </p>

            <div>
              <h4 className="font-semibold">Features:</h4>
              <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                <li>Visual drag-and-drop service editor</li>
                <li>Real-time YAML synchronization</li>
                <li>Network topology visualization</li>
                <li>Volume management</li>
                <li>Validation and error checking</li>
                <li>Import/Export support</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold">Installation:</h4>
              <pre className="mt-2 rounded-lg bg-muted p-3">
                <code>npm install @hanzo/ui</code>
              </pre>
            </div>

            <div>
              <h4 className="font-semibold">Usage:</h4>
              <pre className="mt-2 rounded-lg bg-muted p-3">
                <code>{`import { ComposeEditor } from '@hanzo/ui/compose'

export default function Page() {
  return <ComposeEditor />
}`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
