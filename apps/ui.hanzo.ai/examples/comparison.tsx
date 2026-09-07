import { Comparison, type ComparisonColumn } from "@hanzo/ui"

const plans: ComparisonColumn[] = [
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

/** Pricing table — three plans side by side, the middle one highlighted. */
export function Default() {
  return <Comparison columns={plans} />
}

/** Two plans — the grid tracks follow the column count, not a fixed layout. */
export function TwoColumns() {
  return <Comparison columns={plans.slice(0, 2)} />
}

/** Feature list — every row a boolean, read as a checklist rather than a price. */
export function FeatureChecklist() {
  const columns: ComparisonColumn[] = [
    {
      title: "Basic",
      items: [
        { label: "API access", value: true },
        { label: "SSO", value: false },
        { label: "Audit log", value: false },
      ],
    },
    {
      title: "Team",
      highlighted: true,
      items: [
        { label: "API access", value: true },
        { label: "SSO", value: true },
        { label: "Audit log", value: false },
      ],
    },
  ]
  return <Comparison columns={columns} />
}
