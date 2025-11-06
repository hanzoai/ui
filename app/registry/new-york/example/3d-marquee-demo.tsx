import { Marquee3D } from "@/registry/new-york/ui/3d-marquee"

export default function ThreeDMarqueeDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Marquee3D className="w-full">
        <span className="mx-8 text-2xl font-bold">🚀 Innovation</span>
        <span className="mx-8 text-2xl font-bold">⚡ Speed</span>
        <span className="mx-8 text-2xl font-bold">💎 Quality</span>
        <span className="mx-8 text-2xl font-bold">🎯 Precision</span>
        <span className="mx-8 text-2xl font-bold">🌟 Excellence</span>
      </Marquee3D>
    </div>
  )
}
