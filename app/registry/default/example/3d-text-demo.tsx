import { Text3D } from "@/registry/default/ui/3d-text"

export default function ThreeDTextDemo() {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800">
      <Text3D variant="metallic" size="5xl" animate rotateOnHover>
        3D Text
      </Text3D>
    </div>
  )
}
