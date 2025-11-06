import { CodeExplorer } from "@/registry/default/ui/code-explorer"

const files = [
  {
    id: "1",
    name: "src",
    type: "folder" as const,
    path: "/src",
    isExpanded: true,
    children: [
      {
        id: "2",
        name: "components",
        type: "folder" as const,
        path: "/src/components",
        isExpanded: true,
        children: [
          {
            id: "3",
            name: "Button.tsx",
            type: "file" as const,
            path: "/src/components/Button.tsx",
            size: 2048,
            language: "typescript",
            content: "export function Button() { ... }",
          },
          {
            id: "4",
            name: "Card.tsx",
            type: "file" as const,
            path: "/src/components/Card.tsx",
            size: 3172,
            language: "typescript",
            content: "export function Card() { ... }",
          },
        ],
      },
      {
        id: "5",
        name: "lib",
        type: "folder" as const,
        path: "/src/lib",
        children: [
          {
            id: "6",
            name: "utils.ts",
            type: "file" as const,
            path: "/src/lib/utils.ts",
            size: 1024,
            language: "typescript",
            content: "export function cn() { ... }",
          },
        ],
      },
      {
        id: "7",
        name: "app.tsx",
        type: "file" as const,
        path: "/src/app.tsx",
        size: 4096,
        language: "typescript",
        content: "export default function App() { ... }",
      },
    ],
  },
  {
    id: "8",
    name: "package.json",
    type: "file" as const,
    path: "/package.json",
    size: 512,
    language: "json",
    content: '{ "name": "my-app" }',
  },
]

export default function CodeExplorerDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <CodeExplorer
          files={files}
          showSearch
          showFileIcons
          showFileSize
          height="500px"
        />
      </div>
    </div>
  )
}
