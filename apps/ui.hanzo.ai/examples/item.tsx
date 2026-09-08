import { XStack, YStack } from "@hanzo/gui"
import {
  Badge,
  Button,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@hanzo/ui"

/** Default — media, a title and description, and an action, in one row. */
export function Default() {
  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <Badge variant="secondary">i</Badge>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>New message from Sarah</ItemTitle>
        <ItemDescription>Sarah sent you a message about the design review.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="outline">
          Reply
        </Button>
      </ItemActions>
    </Item>
  )
}

/** Variants — default, outline and muted read as three levels of emphasis. */
export function Variants() {
  return (
    <YStack gap="$3">
      <Item variant="default">
        <ItemContent>
          <ItemTitle>Default</ItemTitle>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline</ItemTitle>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted</ItemTitle>
        </ItemContent>
      </Item>
    </YStack>
  )
}

/** Group — a list of items sharing one rhythm, divided by a separator. */
export function Group() {
  return (
    <ItemGroup>
      <Item size="sm" variant="outline">
        <ItemContent>
          <ItemTitle>Invoice #1024</ItemTitle>
          <ItemDescription>Paid on March 3</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant="secondary">Paid</Badge>
        </ItemActions>
      </Item>
      <ItemSeparator />
      <Item size="sm" variant="outline">
        <ItemContent>
          <ItemTitle>Invoice #1025</ItemTitle>
          <ItemDescription>Due March 18</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant="outline">Due</Badge>
        </ItemActions>
      </Item>
    </ItemGroup>
  )
}

/** As a link — `asChild` puts the row's hover and focus styling on the anchor. */
export function AsChild() {
  return (
    <XStack maxW={420}>
      <Item asChild variant="outline">
        <a href="/dashboard">
          <ItemContent>
            <ItemTitle>Dashboard</ItemTitle>
            <ItemDescription>Overview of your account and activity.</ItemDescription>
          </ItemContent>
        </a>
      </Item>
    </XStack>
  )
}
