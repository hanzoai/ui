import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/default/ui/avatar"

export function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/hanzo.png" alt="@hanzo" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
