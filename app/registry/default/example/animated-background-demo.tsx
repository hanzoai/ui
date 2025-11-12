import { AnimatedBackground } from "@hanzo/ui/animation/animated-background"

export default function AnimatedBackgroundDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AnimatedBackground
        className="rounded-lg"
        style={{ width: "100%", maxWidth: "600px" }}
      >
        <div className="relative z-10 p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Animated Background</h2>
          <p className="text-lg opacity-90">
            Beautiful gradient animations for your UI
          </p>
        </div>
      </AnimatedBackground>
    </div>
  )
}
