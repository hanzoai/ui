import { PixelImage } from "@/registry/default/ui/pixel-image"

export default function PixelImageDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8 bg-slate-900">
      <PixelImage
        src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&h=400&fit=crop"
        alt="Pixelated image effect"
        pixelSize={8}
        className="rounded-lg"
      />
    </div>
  )
}
