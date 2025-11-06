import { Ticker } from "@/registry/default/ui/ticker"

export default function TickerDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <Ticker className="w-full max-w-4xl">
        <span className="mx-4">🚀 Breaking News</span>
        <span className="mx-4">•</span>
        <span className="mx-4">Latest Updates</span>
        <span className="mx-4">•</span>
        <span className="mx-4">Live Feed</span>
        <span className="mx-4">•</span>
        <span className="mx-4">Real-time Ticker</span>
      </Ticker>
    </div>
  )
}
