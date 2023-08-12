import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/luxdefi.png" alt="@luxdefi" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
