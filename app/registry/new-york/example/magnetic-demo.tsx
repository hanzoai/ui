import { Magnetic } from "@/registry/new-york/ui/magnetic"

export default function MagneticDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center gap-8 p-8">
      <Magnetic strength={0.3}>
        <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Hover Me!
        </button>
      </Magnetic>
      <Magnetic strength={0.5}>
        <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white font-bold">
          Magnetic
        </div>
      </Magnetic>
    </div>
  )
}
