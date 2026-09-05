import { useState } from "react"
import { Paragraph, Text, XStack, YStack } from "@hanzo/gui"
import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardMedia,
  CardTitle,
} from "@hanzo/ui"

const COVER =
  "https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80"

/** Default — a header with a title and description, a body, and a footer holding the actions: the shape most cards take. */
export function Default() {
  return (
    <Card maxW={360}>
      <CardHeader>
        <CardTitle>Storage</CardTitle>
        <CardDescription>Usage across every bucket this month.</CardDescription>
      </CardHeader>
      <CardContent>412 GB of 1 TB used.</CardContent>
      <CardFooter gap="$2" justify="flex-end">
        <Button variant="outline">Manage</Button>
        <Button variant="primary">Upgrade</Button>
      </CardFooter>
    </Card>
  )
}

/** With action — CardAction sits last in the header, flush with its right edge, for a control that acts on the whole card rather than on one row of it. */
export function WithAction() {
  return (
    <Card maxW={360}>
      <CardHeader>
        <CardTitle>Team members</CardTitle>
        <CardDescription>
          People with access to the acme workspace.
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm">
            Invite
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <YStack gap="$1">
          <Text>Mara Okafor</Text>
          <Text>Jules Bernard</Text>
          <Text>Priya Natarajan</Text>
        </YStack>
      </CardContent>
    </Card>
  )
}

/** With media — CardMedia runs edge to edge above the header and holds its ratio before the image loads, so nothing below it moves when the bytes arrive. */
export function WithMedia() {
  return (
    <Card maxW={320}>
      <CardMedia ratio={16 / 10}>
        <img src={COVER} alt="Open notebook and a pen on a wooden desk" />
      </CardMedia>
      <CardHeader>
        <CardTitle>Field notebook</CardTitle>
        <CardDescription>Dot grid, 192 pages, A5.</CardDescription>
      </CardHeader>
      <CardContent>$18</CardContent>
      <CardFooter>
        <Button variant="primary" width="100%">
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Product — itemScope and itemType on the card and itemProp on the pieces make one schema.org Product, which is what a search engine and a merchant feed read the name, image and price from. */
export function Product() {
  return (
    <Card maxW={320} itemScope itemType="https://schema.org/Product">
      <CardMedia>
        <img
          src={COVER}
          alt="Open notebook and a pen on a wooden desk"
          itemProp="image"
        />
      </CardMedia>
      <CardHeader>
        <CardTitle>
          <span itemProp="name">Field notebook</span>
        </CardTitle>
        <CardDescription>Dot grid, 192 pages, A5.</CardDescription>
      </CardHeader>
      <CardContent>
        <span itemProp="offers" itemScope itemType="https://schema.org/Offer">
          <span itemProp="price" content="18">
            $18
          </span>
        </span>
      </CardContent>
      <CardFooter>
        <Button variant="primary" width="100%">
          Add to cart
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Interactive — the whole card is the control: focusable, activated by click, Enter or Space, lit on hover, so a choice among cards needs no button inside each. */
export function Interactive() {
  const regions = [
    { id: "fra", city: "Frankfurt", latency: "12 ms" },
    { id: "sfo", city: "San Francisco", latency: "48 ms" },
    { id: "sin", city: "Singapore", latency: "91 ms" },
  ]
  const [region, setRegion] = useState("fra")
  return (
    <YStack gap="$3">
      <XStack flexWrap="wrap" gap="$3">
        {regions.map((r) => (
          <Card
            key={r.id}
            interactive
            width={200}
            aria-pressed={region === r.id}
            borderColor={region === r.id ? "$ink" : "$borderColor"}
            onPress={() => setRegion(r.id)}
          >
            <CardHeader>
              <CardTitle>{r.city}</CardTitle>
              <CardDescription>{r.latency} from you</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </XStack>
      <Paragraph color="$quiet">
        Deploying to {regions.find((r) => r.id === region)?.city}.
      </Paragraph>
    </YStack>
  )
}

/** Namespace — every part hung off Card as Card.Media, Card.Header, Card.Title, Card.Meta, Card.Action, Card.Body and Card.Footer, the same components as the named exports, for code that reads better with one import. */
export function Namespace() {
  return (
    <Card maxW={360}>
      <Card.Media ratio={21 / 9}>
        <img src={COVER} alt="Open notebook and a pen on a wooden desk" />
      </Card.Media>
      <Card.Header>
        <Card.Title>Weekly digest</Card.Title>
        <Card.Meta>Sent every Monday at 09:00.</Card.Meta>
        <Card.Action>
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </Card.Action>
      </Card.Header>
      <Card.Body>The next issue covers 47 merged pull requests.</Card.Body>
      <Card.Footer gap="$2">
        <Button variant="outline" size="sm">
          Preview
        </Button>
        <Button variant="ghost" size="sm">
          Unsubscribe
        </Button>
      </Card.Footer>
    </Card>
  )
}
