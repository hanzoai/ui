import { AnimatedTooltip } from "@/registry/default/ui/animated-tooltip"
import { Button } from "@/registry/default/ui/button"

export default function AnimatedTooltipDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8 gap-8">
      <AnimatedTooltip content="This is a helpful tooltip">
        <Button>Hover me</Button>
      </AnimatedTooltip>
      <AnimatedTooltip content="Tooltips can contain longer descriptions and helpful information">
        <Button variant="outline">More info</Button>
      </AnimatedTooltip>
    </div>
  )
}
