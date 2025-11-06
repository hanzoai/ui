import { AnimatedTestimonials } from "@/registry/default/ui/animated-testimonials"

const testimonials = [
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

export default function AnimatedTestimonialsDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AnimatedTestimonials
        testimonials={testimonials}
        autoPlay
        duration={5000}
      />
    </div>
  )
}
