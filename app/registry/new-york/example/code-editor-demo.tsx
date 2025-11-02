import { CodeEditor } from "@/registry/default/ui/code-editor"

export default function CodeEditorDemo() {
  return (
    <CodeEditor
      defaultValue={`function fibonacci(n) {
  if (n <= 1) return n

  return fibonacci(n - 1) + fibonacci(n - 2)
}

// Calculate the 10th Fibonacci number
const result = fibonacci(10)
console.log(\`The 10th Fibonacci number is: \${result}\`)`}
      language="javascript"
      height="300px"
    />
  )
}
