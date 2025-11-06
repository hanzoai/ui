import { Sandbox } from "@/registry/default/ui/sandbox"

export default function SandboxDemo() {
  const sampleCode = `// Simple JavaScript calculator
const add = (a, b) => a + b
const result = add(5, 3)
console.log("5 + 3 =", result)
result`

  return (
    <div className="w-full max-w-3xl">
      <Sandbox code={sampleCode} language="javascript" editable />
    </div>
  )
}
