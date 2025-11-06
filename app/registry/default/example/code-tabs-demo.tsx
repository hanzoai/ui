import { CodeTabs } from "@/registry/default/ui/code-tabs"

export default function CodeTabsDemo() {
  const tabs = [
    {
      label: "JavaScript",
      language: "javascript",
      code: `function greet(name) {
  return \`Hello, \${name}!\`
}

console.log(greet("World"))`,
    },
    {
      label: "TypeScript",
      language: "typescript",
      code: `function greet(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(greet("World"))`,
    },
    {
      label: "Python",
      language: "python",
      code: `def greet(name):
    return f"Hello, {name}!"

print(greet("World"))`,
    },
  ]

  return (
    <div className="w-full max-w-3xl">
      <CodeTabs tabs={tabs} />
    </div>
  )
}
