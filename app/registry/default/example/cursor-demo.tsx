import { Cursor } from "@/registry/default/ui/cursor"

export default function CursorDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center bg-slate-900">
      <Cursor cursorText="✨" cursorSize={24}>
        <div className="text-center p-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Custom Cursor Demo
          </h2>
          <p className="text-slate-300">
            Move your mouse over this area to see the custom cursor effect
          </p>
        </div>
      </Cursor>
    </div>
  )
}
