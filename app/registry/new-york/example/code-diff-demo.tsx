import { CodeDiff } from "@/registry/new-york/ui/code-diff"

const oldCode = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`

const newCode = `function calculateTotal(items) {
  return items.reduce((total, item) => total + item.price, 0);
}`

export default function CodeDiffDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <CodeDiff
          oldCode={oldCode}
          newCode={newCode}
          language="javascript"
          filename="utils.js"
        />
      </div>
    </div>
  )
}
