import { AnimatedNumber } from "@/registry/default/ui/animated-number"

export default function AnimatedNumberDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-4 text-sm text-muted-foreground">Revenue</div>
        <AnimatedNumber
          value={123456}
          from={0}
          prefix="$"
          className="text-5xl font-bold"
          duration={2000}
        />
      </div>
    </div>
  )
}
