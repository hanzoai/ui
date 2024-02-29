import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/new-york/ui/avatar"

export default function AvatarDemo() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/hanzo.png" alt="@hanzo" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  )
}
