import { YStack } from "@hanzo/gui"
import { CodeBlock } from "@hanzo/ui"

const FIBONACCI = `function fibonacci(n) {
  if (n <= 1) {
    return n
  }
  return fibonacci(n - 1) + fibonacci(n - 2)
}

const result = fibonacci(10)
console.log(result) // 55`

const CALCULATOR = `function calculateTotal(items) {
  let total = 0
  for (const item of items) {
    total += item.price
  }
  if (total > 100) {
    total *= 0.9 // 10% discount
  }
  return total
}`

/** Default — a filename, a language badge, line numbers, and a copy button that confirms itself for two seconds. */
export function Default() {
  return (
    <CodeBlock
      code={FIBONACCI}
      language="javascript"
      filename="fibonacci.js"
      highlightLines={[5]}
    />
  )
}

/** Diff — added and removed lines each carry their own sign and left-edge color, independent of the highlighted range. */
export function Diff() {
  return (
    <CodeBlock
      code={CALCULATOR}
      language="javascript"
      filename="calculator.js"
      theme="github-dark"
      diff={{ added: [5, 6], removed: [3] }}
    />
  )
}

/** Themes — eight named syntax palettes, each a fixed color quartet independent of the surrounding page's own theme. */
export function Themes() {
  const sample = `const greeting = "Hello, World!"\nconsole.log(greeting)`
  return (
    <YStack gap="$4">
      <CodeBlock code={sample} language="javascript" theme="light" showLineNumbers={false} />
      <CodeBlock code={sample} language="javascript" theme="dracula" showLineNumbers={false} />
      <CodeBlock code={sample} language="javascript" theme="nord" showLineNumbers={false} />
    </YStack>
  )
}

/** Bare — no filename, no language and no copy button, so the header is dropped and only the numbered code remains. */
export function Bare() {
  return (
    <CodeBlock
      code={FIBONACCI}
      language=""
      showCopyButton={false}
      size="sm"
      maxHeight={160}
    />
  )
}
