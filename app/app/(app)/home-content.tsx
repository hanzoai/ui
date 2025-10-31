"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/new-york/ui/tabs"

import { RootComponents } from "./components"

const examples = [
  { id: "dashboard", label: "Dashboard", path: "/examples-embed/dashboard" },
  { id: "mail", label: "Mail", path: "/examples-embed/mail" },
  { id: "tasks", label: "Tasks", path: "/examples-embed/tasks" },
  { id: "playground", label: "Playground", path: "/examples-embed/playground" },
  { id: "forms", label: "Forms", path: "/examples-embed/forms" },
  { id: "music", label: "Music", path: "/examples-embed/music" },
  { id: "authentication", label: "Authentication", path: "/examples-embed/authentication" },
  { id: "cards", label: "Cards", path: "/examples-embed/cards" },
]

export function HomeContent() {
  return (
    <div className="container py-12">
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="mb-8 inline-flex h-auto items-center gap-1 bg-transparent p-0">
          <TabsTrigger
            value="components"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
          >
            Components
          </TabsTrigger>
          {examples.map((example) => (
            <TabsTrigger
              key={example.id}
              value={example.id}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {example.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="components" className="mt-0">
          <RootComponents />
        </TabsContent>

        {examples.map((example) => (
          <TabsContent key={example.id} value={example.id} className="mt-0">
            <div className="overflow-hidden rounded-lg border bg-background shadow-lg">
              <iframe
                src={example.path}
                className="h-[900px] w-full border-0"
                title={`${example.label} Example`}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
