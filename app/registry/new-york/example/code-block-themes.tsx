import { CodeBlock } from "@/registry/default/ui/code-block"

export default function CodeBlockThemesDemo() {
  const sampleCode = `const greeting = "Hello, World!"
console.log(greeting)`

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Dark Theme</h3>
        <CodeBlock
          code={sampleCode}
          language="javascript"
          theme="dark"
          showLineNumbers={false}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Light Theme</h3>
        <CodeBlock
          code={sampleCode}
          language="javascript"
          theme="light"
          showLineNumbers={false}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Dracula Theme</h3>
        <CodeBlock
          code={sampleCode}
          language="javascript"
          theme="dracula"
          showLineNumbers={false}
        />
      </div>
    </div>
  )
}
