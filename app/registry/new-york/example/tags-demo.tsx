import { Tags } from "@/registry/new-york/ui/tags"

export default function TagsDemo() {
  const exampleTags = [
    { id: "1", label: "React" },
    { id: "2", label: "TypeScript" },
    { id: "3", label: "Next.js" },
    { id: "4", label: "Tailwind CSS" },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <Tags tags={exampleTags} />
    </div>
  )
}
