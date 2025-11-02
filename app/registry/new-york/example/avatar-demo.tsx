import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/hanzoai.png" alt="@hanzoai" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
