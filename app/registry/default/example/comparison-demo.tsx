import { Comparison } from "@/registry/default/ui/comparison"

export default function ComparisonDemo() {
  const columns = [
    {
      title: "Free",
      items: [
        { label: "Users", value: "5" },
        { label: "Storage", value: "10GB" },
        { label: "Support", value: false },
        { label: "Custom domain", value: false },
      ],
    },
    {
      title: "Pro",
      highlighted: true,
      items: [
        { label: "Users", value: "25" },
        { label: "Storage", value: "100GB" },
        { label: "Support", value: true },
        { label: "Custom domain", value: true },
      ],
    },
    {
      title: "Enterprise",
      items: [
        { label: "Users", value: "Unlimited" },
        { label: "Storage", value: "1TB" },
        { label: "Support", value: true },
        { label: "Custom domain", value: true },
      ],
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <Comparison columns={columns} />
    </div>
  )
}
