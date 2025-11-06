import { AppleCardsCarousel } from "@/registry/new-york/ui/apple-cards-carousel"

const cards = [
  {
    id: "1",
    title: "Innovation",
    subtitle: "Pushing Boundaries",
    description: "Discover cutting-edge solutions that transform your workflow",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "2",
    title: "Performance",
    subtitle: "Lightning Fast",
    description: "Experience blazing speed with optimized components",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "3",
    title: "Design",
    subtitle: "Beautiful UI",
    description: "Crafted with attention to detail and modern aesthetics",
    gradient: "from-orange-500 to-red-500",
  },
]

export default function AppleCardsCarouselDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="w-full max-w-6xl">
        <AppleCardsCarousel cards={cards} autoPlay showArrows showDots />
      </div>
    </div>
  )
}
