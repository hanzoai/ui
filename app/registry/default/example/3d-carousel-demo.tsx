import { Carousel3D } from "@/registry/default/ui/3d-carousel"

const demoItems = [
  {
    id: "1",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <span className="text-2xl font-bold">Item 1</span>
      </div>
    ),
  },
  {
    id: "2",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <span className="text-2xl font-bold">Item 2</span>
      </div>
    ),
  },
  {
    id: "3",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-500 to-pink-600 text-white">
        <span className="text-2xl font-bold">Item 3</span>
      </div>
    ),
  },
]

export default function ThreeDCarouselDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Carousel3D items={demoItems} />
    </div>
  )
}
