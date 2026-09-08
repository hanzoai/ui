import { Comparison } from "@hanzo/ui"

/** Pricing plans — three columns, boolean and text rows, the middle one highlighted. */
export function Plans() {
  return (
    <Comparison
      columns={[
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
      ]}
    />
  )
}

/** Two-way — the minimum shape, one plan against another. */
export function TwoWay() {
  return (
    <Comparison
      columns={[
        {
          title: "Before",
          items: [
            { label: "Setup time", value: "2 weeks" },
            { label: "Automated tests", value: false },
          ],
        },
        {
          title: "After",
          highlighted: true,
          items: [
            { label: "Setup time", value: "1 day" },
            { label: "Automated tests", value: true },
          ],
        },
      ]}
    />
  )
}
