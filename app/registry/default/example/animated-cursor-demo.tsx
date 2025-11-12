import { AnimatedCursor } from "@hanzo/ui/animation/animated-cursor"

export default function AnimatedCursorDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AnimatedCursor className="pointer-events-none" />
      <div className="text-center text-muted-foreground">
        <p>Move your mouse to see the animated cursor</p>
        <p className="text-sm mt-2">
          Hover over interactive elements to see effects
        </p>
      </div>
    </div>
  )
}
