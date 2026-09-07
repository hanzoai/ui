import { SizableText, YStack } from "@hanzo/gui"
import { AppleCardsCarousel, gradientPresets, type CarouselCard } from "@hanzo/ui"

const featured: CarouselCard[] = [
  {
    id: "1",
    title: "Innovation",
    subtitle: "Think Different",
    description:
      "Pushing the boundaries of what's possible with cutting-edge technology.",
    gradient: gradientPresets.sunset,
  },
  {
    id: "2",
    title: "Design",
    subtitle: "Form Meets Function",
    description:
      "Beautiful, intuitive interfaces that delight users at every interaction.",
    gradient: gradientPresets.ocean,
  },
  {
    id: "3",
    title: "Performance",
    subtitle: "Speed & Efficiency",
    description:
      "Optimized for the best possible user experience across all devices.",
    gradient: gradientPresets.galaxy,
  },
]

/** Default — three gradient cards, auto-playing every five seconds with arrows and dots. */
export function Default() {
  return (
    <AppleCardsCarousel
      cards={featured}
      autoPlay
      autoPlayInterval={5000}
      showArrows
      showDots
    />
  )
}

/** With images — each card's photo slides against the drag for depth; a wider offset and flatter scale fan the stack out. */
export function WithImages() {
  const cards: CarouselCard[] = [
    {
      id: "1",
      title: "Mountain Vista",
      subtitle: "Explore Nature",
      description: "Discover breathtaking mountain landscapes",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    },
    {
      id: "2",
      title: "Ocean Waves",
      subtitle: "Feel the Freedom",
      description: "Experience the calming rhythm of the sea",
      image: "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&q=80",
    },
  ]
  return (
    <AppleCardsCarousel
      cards={cards}
      parallaxOffset={100}
      stackOffset={20}
      stackScale={0.9}
    />
  )
}

/** Custom content — a card's `content` replaces its title, subtitle and description entirely. */
export function CustomContent() {
  const cards: CarouselCard[] = [
    {
      id: "1",
      title: "Custom",
      gradient: gradientPresets.aurora,
      content: (
        <YStack items="center" justify="center" height="100%" gap="$3">
          <SizableText size="$12" fontWeight="700" color="white">
            Custom
          </SizableText>
          <SizableText size="$6" color="rgba(255,255,255,0.8)">
            Any content renders here
          </SizableText>
        </YStack>
      ),
    },
    { id: "2", title: "Second Card", gradient: gradientPresets.peach },
    { id: "3", title: "Third Card", gradient: gradientPresets.forest },
  ]
  return <AppleCardsCarousel cards={cards} />
}

/** Minimal — arrows and dots and auto-play all off, leaving a plain draggable stack. */
export function Minimal() {
  const cards: CarouselCard[] = [
    { id: "1", title: "First Card", gradient: gradientPresets.lavender },
    { id: "2", title: "Second Card", gradient: gradientPresets.fire },
    { id: "3", title: "Third Card", gradient: gradientPresets.ocean },
  ]
  return (
    <AppleCardsCarousel
      cards={cards}
      showArrows={false}
      showDots={false}
      autoPlay={false}
    />
  )
}
