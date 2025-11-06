import { MotionHighlight } from "@/registry/new-york/ui/motion-highlight"

export default function MotionHighlightDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="space-y-6 max-w-2xl">
        <MotionHighlight>
          <h2 className="text-3xl font-bold">Interactive Highlight Effect</h2>
        </MotionHighlight>
        <MotionHighlight>
          <p className="text-lg">
            Hover over this text to see the smooth highlight animation following
            your cursor.
          </p>
        </MotionHighlight>
      </div>
    </div>
  )
}
