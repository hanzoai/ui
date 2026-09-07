import { YStack } from "@hanzo/gui"
import { AnimatedTestimonials, type Testimonial } from "@hanzo/ui"

const quotes: Testimonial[] = [
  {
    id: "1",
    content:
      "This product has completely transformed how our team collaborates. The interface is intuitive and the features are exactly what we needed.",
    author: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
  },
  {
    id: "2",
    content:
      "Outstanding support and seamless integration. We've seen a 40% increase in productivity since implementing this solution.",
    author: "Michael Rodriguez",
    role: "CTO",
    company: "StartupXYZ",
  },
  {
    id: "3",
    content:
      "The best investment we've made this year. Highly recommend to any team looking to streamline their workflow.",
    author: "Emily Watson",
    role: "Engineering Lead",
    company: "DevStudio",
  },
]

/** Default — three quotes take turns every 5 seconds, each fading up into place, or jump to one by its dot. */
export function Default() {
  return (
    <YStack maxW={480} width="100%">
      <AnimatedTestimonials testimonials={quotes} />
    </YStack>
  )
}

/** Paused — `autoPlay={false}` holds on the first quote until a dot is clicked. */
export function Paused() {
  return (
    <YStack maxW={480} width="100%">
      <AnimatedTestimonials testimonials={quotes} autoPlay={false} />
    </YStack>
  )
}

/** Fast — a short `duration` advances every 1.5 seconds, for a busy marketing strip. */
export function Fast() {
  return (
    <YStack maxW={480} width="100%">
      <AnimatedTestimonials testimonials={quotes} duration={1500} />
    </YStack>
  )
}

/** No role — an author with neither role nor company skips the meta line entirely. */
export function AuthorOnly() {
  const anonymous: Testimonial[] = [
    { id: "1", content: "Just works, out of the box.", author: "J. Rivera" },
  ]
  return (
    <YStack maxW={480} width="100%">
      <AnimatedTestimonials testimonials={anonymous} autoPlay={false} />
    </YStack>
  )
}
