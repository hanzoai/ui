"use client"

import * as React from "react"
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Panel,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Download, Upload, Play, RotateCcw } from "lucide-react"
import yaml from "js-yaml"

import { Button } from "@/registry/new-york/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/ui/tabs"
import { Textarea } from "@/registry/new-york/ui/textarea"

// Default Rails stack compose file
const DEFAULT_COMPOSE = `version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - rails
    networks:
      - frontend
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro

  rails:
    image: ruby:3.2-alpine
    command: bundle exec rails server -b 0.0.0.0
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    networks:
      - frontend
      - backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/myapp
      REDIS_URL: redis://redis:6379/0
    volumes:
      - ./app:/app

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    networks:
      - backend
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    networks:
      - backend
    volumes:
      - redis_data:/data

  sidekiq:
    image: ruby:3.2-alpine
    command: bundle exec sidekiq
    depends_on:
      - redis
      - postgres
    networks:
      - backend
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/myapp
      REDIS_URL: redis://redis:6379/0

networks:
  frontend:
  backend:

volumes:
  postgres_data:
  redis_data:
`

const EXAMPLE_STACKS = {
  rails: DEFAULT_COMPOSE,

  nextjsMongo: `version: '3.8'
services:
  nextjs:
    image: node:20-alpine
    command: npm run dev
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      - mongo
      - redis
    networks:
      - app
    volumes:
      - ./app:/app
      - /app/node_modules

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    networks:
      - app
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    networks:
      - app
    volumes:
      - redis_data:/data

networks:
  app:

volumes:
  mongo_data:
  redis_data:`,

  nextjsPostgres: `version: '3.8'
services:
  nextjs:
    image: node:20-alpine
    command: npm run dev
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/app
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: supersecret
    depends_on:
      - postgres
    networks:
      - app

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    networks:
      - app
    volumes:
      - postgres_data:/var/lib/postgresql/data

networks:
  app:

volumes:
  postgres_data:`,

  laravel: `version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - php
    networks:
      - frontend
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./public:/var/www/html/public

  php:
    image: php:8.3-fpm-alpine
    networks:
      - frontend
      - backend
    depends_on:
      - mysql
      - redis
    environment:
      DB_HOST: mysql
      DB_DATABASE: laravel
      DB_USERNAME: laravel
      DB_PASSWORD: password
      REDIS_HOST: redis
    volumes:
      - ./:/var/www/html

  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: laravel
      MYSQL_USER: laravel
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    networks:
      - backend
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    networks:
      - backend
    volumes:
      - redis_data:/data

  queue:
    image: php:8.3-fpm-alpine
    command: php artisan queue:work
    depends_on:
      - mysql
      - redis
    networks:
      - backend
    environment:
      DB_HOST: mysql
      REDIS_HOST: redis

networks:
  frontend:
  backend:

volumes:
  mysql_data:
  redis_data:`,

  wordpress: `version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - wordpress
    networks:
      - frontend
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - wordpress_data:/var/www/html

  wordpress:
    image: wordpress:latest
    depends_on:
      - db
      - redis
    networks:
      - frontend
      - backend
    environment:
      WORDPRESS_DB_HOST: db
      WORDPRESS_DB_NAME: wordpress
      WORDPRESS_DB_USER: wordpress
      WORDPRESS_DB_PASSWORD: password
      WORDPRESS_REDIS_HOST: redis
      WORDPRESS_REDIS_PORT: 6379
    volumes:
      - wordpress_data:/var/www/html

  db:
    image: mysql:8.4
    networks:
      - backend
    environment:
      MYSQL_DATABASE: wordpress
      MYSQL_USER: wordpress
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpassword
    volumes:
      - mysql_data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    networks:
      - backend
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

  adminer:
    image: adminer:latest
    ports:
      - "8080:8080"
    networks:
      - backend
    depends_on:
      - db

networks:
  frontend:
  backend:

volumes:
  wordpress_data:
  mysql_data:
  redis_data:`,

  analytics: `version: '3.8'
services:
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports:
      - "8123:8123"
      - "9000:9000"
    networks:
      - analytics
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    environment:
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1

  kafka:
    image: confluentinc/cp-kafka:latest
    ports:
      - "9092:9092"
    networks:
      - analytics
    environment:
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    networks:
      - analytics
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  vector:
    image: timberio/vector:latest
    networks:
      - analytics
    depends_on:
      - clickhouse
      - kafka
    volumes:
      - ./vector.toml:/etc/vector/vector.toml:ro

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    networks:
      - analytics
    depends_on:
      - clickhouse
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

networks:
  analytics:

volumes:
  clickhouse_data:
  grafana_data:`,
}

function parseComposeToNodes(composeYaml: string): { nodes: Node[]; edges: Edge[] } {
  try {
    const compose = yaml.load(composeYaml) as any
    const services = compose.services || {}

    const nodes: Node[] = Object.keys(services).map((name, i) => ({
      id: name,
      type: "default",
      position: { x: 100 + (i % 3) * 250, y: 100 + Math.floor(i / 3) * 150 },
      data: {
        label: (
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="font-semibold">{name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {services[name].image || services[name].build || "custom"}
            </div>
            {services[name].ports && (
              <div className="mt-1 text-xs text-muted-foreground">
                📡 {services[name].ports[0]}
              </div>
            )}
          </div>
        ),
      },
    }))

    const edges: Edge[] = []
    Object.entries(services).forEach(([name, config]: [string, any]) => {
      if (config.depends_on) {
        const deps = Array.isArray(config.depends_on) ? config.depends_on : Object.keys(config.depends_on)
        deps.forEach((dep: string) => {
          edges.push({
            id: `${dep}-${name}`,
            source: dep,
            target: name,
            animated: true,
          })
        })
      }
    })

    return { nodes, edges }
  } catch (e) {
    return { nodes: [], edges: [] }
  }
}

export default function ComposeSpecPage() {
  const [yamlContent, setYamlContent] = React.useState(DEFAULT_COMPOSE)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  React.useEffect(() => {
    const { nodes: parsedNodes, edges: parsedEdges } = parseComposeToNodes(yamlContent)
    setNodes(parsedNodes)
    setEdges(parsedEdges)
  }, [yamlContent, setNodes, setEdges])

  const onConnect = React.useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const handleExport = () => {
    const blob = new Blob([yamlContent], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "docker-compose.yml"
    a.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setYamlContent(content)
      }
      reader.readAsText(file)
    }
  }

  const loadExample = (stack: keyof typeof EXAMPLE_STACKS) => {
    setYamlContent(EXAMPLE_STACKS[stack])
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Docker Compose Playground</h1>
        <p className="mt-2 text-muted-foreground">
          Visual editor for Docker Compose files with live YAML sync and React Flow
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export YAML
        </Button>
        <Button variant="outline" size="sm" asChild>
          <label>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
            <input
              type="file"
              accept=".yml,.yaml"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </Button>
        <Button onClick={() => loadExample("rails")} variant="outline" size="sm">
          Rails Stack
        </Button>
        <Button onClick={() => loadExample("nextjsPostgres")} variant="outline" size="sm">
          Next.js + Postgres
        </Button>
        <Button onClick={() => loadExample("nextjsMongo")} variant="outline" size="sm">
          Next.js + MongoDB
        </Button>
        <Button onClick={() => loadExample("laravel")} variant="outline" size="sm">
          Laravel + MySQL
        </Button>
        <Button onClick={() => loadExample("wordpress")} variant="outline" size="sm">
          WordPress
        </Button>
        <Button onClick={() => setYamlContent(DEFAULT_COMPOSE)} variant="outline" size="sm">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <Tabs defaultValue="visual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="visual">Visual Editor</TabsTrigger>
          <TabsTrigger value="yaml">YAML Editor</TabsTrigger>
          <TabsTrigger value="split">Split View</TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle>Service Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[600px] rounded-lg border">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  fitView
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                  <Panel position="top-right">
                    <div className="rounded-lg border bg-card p-2 text-xs">
                      {nodes.length} services • {edges.length} dependencies
                    </div>
                  </Panel>
                </ReactFlow>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yaml">
          <Card>
            <CardContent className="p-0">
              <Textarea
                className="min-h-[600px] resize-none rounded-lg border-0 bg-muted p-4 font-mono text-sm focus-visible:ring-0"
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder="Paste your docker-compose.yml here..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="split">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Visual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[500px] rounded-lg border">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                  >
                    <Background />
                    <Controls />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>YAML</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-[500px] resize-none font-mono text-sm"
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Example Stacks - Click to Load</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("rails")}
          >
            <h4 className="font-semibold">Rails Stack</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Nginx → Rails → PostgreSQL + Redis + Sidekiq
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("nextjsPostgres")}
          >
            <h4 className="font-semibold">Next.js + PostgreSQL</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Modern JS with SQL + NextAuth
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("nextjsMongo")}
          >
            <h4 className="font-semibold">Next.js + MongoDB</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              NoSQL stack with Redis caching
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("laravel")}
          >
            <h4 className="font-semibold">Laravel + MySQL</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              PHP stack with queue workers
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("analytics")}
          >
            <h4 className="font-semibold">Analytics Stack</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              ClickHouse + Kafka + Vector + Grafana
            </p>
          </Button>

          <Button
            variant="outline"
            className="h-auto flex-col items-start p-4 text-left"
            onClick={() => loadExample("wordpress")}
          >
            <h4 className="font-semibold">WordPress Pro</h4>
            <p className="mt-1 text-xs text-muted-foreground">
              Nginx + WP + MySQL + Redis + Adminer
            </p>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
