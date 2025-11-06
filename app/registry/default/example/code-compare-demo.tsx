import { CodeCompare } from "@/registry/default/ui/code-compare"

const files = [
  {
    id: "1",
    filename: "utils.ts",
    content: `export function calculateTotal(items: Item[]) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}`,
    language: "typescript",
    label: "Before (v1.0)",
    version: "1.0.0",
  },
  {
    id: "2",
    filename: "utils.ts",
    content: `export function calculateTotal(items: Item[]) {
  return items.reduce((total, item) => 
    total + (item.price * item.quantity), 0
  );
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}`,
    language: "typescript",
    label: "After (v2.0)",
    version: "2.0.0",
  },
]

export default function CodeCompareDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <CodeCompare
          files={files}
          defaultView="side-by-side"
          showLineNumbers
          showCopyButton
          syncScroll
        />
      </div>
    </div>
  )
}
