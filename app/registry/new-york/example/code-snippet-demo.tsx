import { CodeSnippet } from "@/registry/new-york/ui/code-snippet"

const sampleCode = `function greet(name: string) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome, \${name}\`;
}

const message = greet("World");
console.log(message);`

export default function CodeSnippetDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <CodeSnippet
          code={sampleCode}
          language="typescript"
          filename="greet.ts"
          showLineNumbers
          showCopyButton
        />
      </div>
    </div>
  )
}
