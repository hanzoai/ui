import { AdvancedNavigationBar } from "@/registry/new-york/ui/advanced-navigation-bar"

const navItems = [
  {
    title: "Products",
    href: "/products",
    description: "Browse our product catalog",
    children: [
      {
        title: "All Products",
        href: "/products/all",
      },
      {
        title: "New Arrivals",
        href: "/products/new",
      },
      {
        title: "Best Sellers",
        href: "/products/best",
      },
    ],
  },
  {
    title: "Solutions",
    href: "/solutions",
    description: "Find the right solution for your needs",
  },
  {
    title: "Pricing",
    href: "/pricing",
  },
  {
    title: "About",
    href: "/about",
  },
]

export default function AdvancedNavigationBarDemo() {
  return (
    <div className="w-full">
      <AdvancedNavigationBar
        items={navItems}
        logo={<span className="font-bold text-xl">Logo</span>}
      />
    </div>
  )
}
