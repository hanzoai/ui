import { XStack } from "@hanzo/gui"
import { Avatar, AvatarFallback, AvatarImage } from "@hanzo/ui"

/** Default — a picture with initials behind it; the initials show until the picture loads and stay if it never does. */
export function Default() {
  return (
    <Avatar>
      <AvatarImage src="https://github.com/hanzoai.png" alt="Hanzo" />
      <AvatarFallback>HZ</AvatarFallback>
    </Avatar>
  )
}

/** Fallback — initials alone when there is no picture or the link is dead; `delayMs` holds them back so a fast image does not flash them first. */
export function Fallback() {
  return (
    <XStack gap="$3" items="center">
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage
          src="https://github.com/hanzoai/no-such-avatar.png"
          alt="Mira Chen"
        />
        <AvatarFallback>MC</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/luxfi.png" alt="Lux" />
        <AvatarFallback delayMs={600}>LX</AvatarFallback>
      </Avatar>
    </XStack>
  )
}

/** Sizes — `size` is a number of pixels or a size token; 32 is the default. */
export function Sizes() {
  return (
    <XStack gap="$3" items="center">
      <Avatar size={24}>
        <AvatarImage src="https://github.com/zooai.png" alt="Zoo" />
        <AvatarFallback>ZO</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://github.com/zooai.png" alt="Zoo" />
        <AvatarFallback>ZO</AvatarFallback>
      </Avatar>
      <Avatar size={48}>
        <AvatarImage src="https://github.com/zooai.png" alt="Zoo" />
        <AvatarFallback>ZO</AvatarFallback>
      </Avatar>
      <Avatar size="$6">
        <AvatarImage src="https://github.com/zooai.png" alt="Zoo" />
        <AvatarFallback>ZO</AvatarFallback>
      </Avatar>
    </XStack>
  )
}

/** Square — `circular={false}` with a radius of your own suits a workspace or organization mark; `bordered` draws the theme edge around it. */
export function Square() {
  return (
    <XStack gap="$3" items="center">
      <Avatar circular={false} rounded="$3">
        <AvatarImage src="https://github.com/luxfi.png" alt="Lux" />
        <AvatarFallback>LX</AvatarFallback>
      </Avatar>
      <Avatar circular={false} rounded="$3" bordered>
        <AvatarFallback>LX</AvatarFallback>
      </Avatar>
    </XStack>
  )
}

/** Group — a team stacked with negative margins; a border in the page color keeps each face separate from the next, and the last one is a count. */
export function Group() {
  return (
    <XStack items="center">
      <Avatar borderWidth={2} borderColor="$background">
        <AvatarImage src="https://github.com/hanzoai.png" alt="Hanzo" />
        <AvatarFallback>HZ</AvatarFallback>
      </Avatar>
      <Avatar ml={-8} borderWidth={2} borderColor="$background">
        <AvatarImage src="https://github.com/luxfi.png" alt="Lux" />
        <AvatarFallback>LX</AvatarFallback>
      </Avatar>
      <Avatar ml={-8} borderWidth={2} borderColor="$background">
        <AvatarImage src="https://github.com/zooai.png" alt="Zoo" />
        <AvatarFallback>ZO</AvatarFallback>
      </Avatar>
      <Avatar ml={-8} borderWidth={2} borderColor="$background">
        <AvatarFallback>+4</AvatarFallback>
      </Avatar>
    </XStack>
  )
}
