"use client"

import { CodeSnippet } from "@/registry/default/ui/code-snippet"

const exampleCode = `function fibonacci(n: number): number {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Calculate the 10th Fibonacci number
const result = fibonacci(10);
console.log(\`Fibonacci(10) = \${result}\`);`

export default function CodeSnippetDemo() {
  return (
    <div className="w-full space-y-6">
      <CodeSnippet
        code={exampleCode}
        language="typescript"
        filename="fibonacci.ts"
        showLineNumbers
        showCopyButton
        showLanguageBadge
      />
    </div>
  )
}
