import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/examples/base/ui/avatar"

<<<<<<<< HEAD:deprecated/www/registry/default/internal/sink/components/avatar-demo.tsx
export function AvatarDemo() {
========
export function AvatarWithBadge() {
>>>>>>>> shadcn/main:apps/v4/examples/base/avatar-badge.tsx
  return (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
      <AvatarBadge className="bg-green-600 dark:bg-green-800" />
    </Avatar>
  )
}
