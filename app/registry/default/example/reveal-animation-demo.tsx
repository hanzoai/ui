import { RevealAnimation } from "@/registry/default/ui/reveal-animation"

export default function RevealAnimationDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="space-y-8 text-center">
        <RevealAnimation>
          <h1 className="text-5xl font-bold">Reveal on Scroll</h1>
        </RevealAnimation>
        <RevealAnimation delay={0.2}>
          <p className="text-xl text-muted-foreground">
            Elements fade in smoothly as they enter the viewport
          </p>
        </RevealAnimation>
        <RevealAnimation delay={0.4}>
          <div className="inline-flex gap-4">
            <div className="h-20 w-20 bg-primary rounded-lg" />
            <div className="h-20 w-20 bg-secondary rounded-lg" />
            <div className="h-20 w-20 bg-accent rounded-lg" />
          </div>
        </RevealAnimation>
      </div>
    </div>
  )
}
