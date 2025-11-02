import { CodeBlock } from "@/registry/default/ui/code-block"

export default function CodeBlockDemo() {
  const sampleCode = `function fibonacci(n) {
  if (n <= 1) {
    return n
  }
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// Calculate the 10th Fibonacci number
const result = fibonacci(10)
console.log(result) // Output: 55`

  return (
    <div className="w-full">
      <CodeBlock
        code={sampleCode}
        language="javascript"
        filename="fibonacci.js"
        theme="dark"
        showLineNumbers={true}
        showCopyButton={true}
        highlightLines={[6, 7]}
      />
    </div>
  )
}
