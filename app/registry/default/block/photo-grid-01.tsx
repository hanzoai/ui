"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface Photo {
  id: string
  src: string
  alt: string
}

const photos: Photo[] = [
  {
    id: "1",
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop",
    alt: "Modern architecture",
  },
  {
    id: "2",
    src: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=800&fit=crop",
    alt: "Technology abstract",
  },
  {
    id: "3",
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=800&fit=crop",
    alt: "Digital workspace",
  },
  {
    id: "4",
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=800&fit=crop",
    alt: "Creative coding",
  },
]

export default function BlockPhotoGrid01() {
  return (
    <section className="container px-4 py-24 mx-auto">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {photos.map((photo) => (
          <div key={photo.id} className="aspect-square overflow-hidden rounded-lg sm:aspect-[3/2]">
            <img
              src={photo.src}
              alt={photo.alt}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
