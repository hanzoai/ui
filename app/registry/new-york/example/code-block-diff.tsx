import { CodeBlock } from "@/registry/default/ui/code-block"

export default function CodeBlockDiffDemo() {
  const diffCode = `function calculateTotal(items) {
  let total = 0
  for (const item of items) {
    total += item.price * item.quantity
  }
  // Apply discount if total is over $100
  if (total > 100) {
    total *= 0.9 // 10% discount
  }
  return total
}`

  return (
    <div className="w-full">
      <CodeBlock
        code={diffCode}
        language="javascript"
        filename="calculator.js"
        diff={{
          added: [6, 7, 8],
          removed: [2],
        }}
        showLineNumbers={true}
        theme="github-dark"
      />
    </div>
  )
}
