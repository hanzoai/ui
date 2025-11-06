import { AnimatedText } from "@/registry/new-york/ui/animated-text"

export default function AnimatedTextDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800">
      <AnimatedText
        text="Beautiful Animated Text"
        animation="fade"
        className="text-5xl font-bold text-white"
      />
    </div>
  )
}
