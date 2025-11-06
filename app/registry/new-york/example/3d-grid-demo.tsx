import { Grid3D } from "@/registry/new-york/ui/3d-grid"

const demoItems = [
  {
    id: "1",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <span className="text-xl font-bold">Item 1</span>
      </div>
    ),
  },
  {
    id: "2",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <span className="text-xl font-bold">Item 2</span>
      </div>
    ),
    elevation: 20,
  },
  {
    id: "3",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-pink-500 to-pink-600 text-white">
        <span className="text-xl font-bold">Item 3</span>
      </div>
    ),
  },
  {
    id: "4",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <span className="text-xl font-bold">Item 4</span>
      </div>
    ),
    span: { x: 2, y: 1 },
  },
  {
    id: "5",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-500 to-green-600 text-white">
        <span className="text-xl font-bold">Item 5</span>
      </div>
    ),
  },
  {
    id: "6",
    content: (
      <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-500 to-cyan-600 text-white">
        <span className="text-xl font-bold">Item 6</span>
      </div>
    ),
    elevation: 30,
  },
]

export default function ThreeDGridDemo() {
  return (
    <div className="flex min-h-[600px] items-center justify-center p-8">
      <Grid3D items={demoItems} columns={4} rows={2} />
    </div>
  )
}
