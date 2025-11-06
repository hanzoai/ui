import { ImageCrop } from "@/registry/default/ui/image-crop"

export default function ImageCropDemo() {
  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        <ImageCrop
          src="https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&h=600&fit=crop"
          aspect={16 / 9}
        />
      </div>
    </div>
  )
}
