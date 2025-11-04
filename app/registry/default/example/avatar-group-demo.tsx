import { AvatarGroup } from "@/registry/default/ui/avatar-group"

export default function AvatarGroupDemo() {
  const avatars = [
    {
      src: "https://i.pravatar.cc/150?img=1",
      alt: "John Doe",
      fallback: "JD",
    },
    {
      src: "https://i.pravatar.cc/150?img=2",
      alt: "Jane Smith",
      fallback: "JS",
    },
    {
      src: "https://i.pravatar.cc/150?img=3",
      alt: "Bob Johnson",
      fallback: "BJ",
    },
    {
      src: "https://i.pravatar.cc/150?img=4",
      alt: "Alice Williams",
      fallback: "AW",
    },
    {
      src: "https://i.pravatar.cc/150?img=5",
      alt: "Charlie Brown",
      fallback: "CB",
    },
  ]

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center">
      <AvatarGroup items={avatars} />
    </div>
  )
}
