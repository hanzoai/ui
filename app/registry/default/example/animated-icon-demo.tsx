import { AnimatedIcon } from "@hanzo/ui/animation/animated-icon"

export default function AnimatedIconDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <AnimatedIcon
        paths="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
        className="text-primary"
        style={{}}
        onAnimationComplete={() => {}}
        onClick={() => {}}
        progress={0.5}
        customVariants={{}}
      />
    </div>
  )
}
