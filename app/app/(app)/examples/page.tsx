import Image from "next/image"
import Link from "next/link"

const examples = [
  {
    name: "Mail",
    href: "/examples/mail",
    image: "/r/styles/new-york-v4/mail-light.png",
    imageDark: "/r/styles/new-york-v4/mail-dark.png",
    description: "A mail app with a sidebar and inbox.",
  },
  {
    name: "Dashboard",
    href: "/examples/dashboard",
    image: "/r/styles/new-york-v4/dashboard-01-light.png",
    imageDark: "/r/styles/new-york-v4/dashboard-01-dark.png",
    description: "A dashboard with navigation, stats, and charts.",
  },
  {
    name: "Cards",
    href: "/examples/cards",
    image: "/r/styles/new-york-v4/cards-light.png",
    imageDark: "/r/styles/new-york-v4/cards-dark.png",
    description: "A collection of card examples with different layouts.",
  },
  {
    name: "Tasks",
    href: "/examples/tasks",
    image: "/r/styles/new-york-v4/tasks-light.png",
    imageDark: "/r/styles/new-york-v4/tasks-dark.png",
    description: "A task management app with a sidebar and task list.",
  },
  {
    name: "Playground",
    href: "/examples/playground",
    image: "/r/styles/new-york-v4/playground-light.png",
    imageDark: "/r/styles/new-york-v4/playground-dark.png",
    description: "A playground for testing components and layouts.",
  },
  {
    name: "Forms",
    href: "/examples/forms",
    image: "/r/styles/new-york-v4/forms-light.png",
    imageDark: "/r/styles/new-york-v4/forms-dark.png",
    description: "Different form examples with various layouts.",
  },
  {
    name: "Music",
    href: "/examples/music",
    image: "/r/styles/new-york-v4/music-light.png",
    imageDark: "/r/styles/new-york-v4/music-dark.png",
    description: "A music app with playlists and player controls.",
  },
  {
    name: "Authentication",
    href: "/examples/authentication",
    image: "/r/styles/new-york-v4/authentication-light.png",
    imageDark: "/r/styles/new-york-v4/authentication-dark.png",
    description: "Authentication pages with different layouts.",
  },
]

export default function ExamplesPage() {
  return (
    <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
      {examples.map((example) => (
        <Link
          key={example.name}
          href={example.href}
          className="group relative overflow-hidden rounded-lg border bg-background transition-colors hover:bg-muted/50"
        >
          <div className="aspect-video overflow-hidden">
            <Image
              src={example.image}
              alt={example.name}
              width={800}
              height={450}
              className="block object-cover transition-transform group-hover:scale-105 dark:hidden"
            />
            <Image
              src={example.imageDark}
              alt={example.name}
              width={800}
              height={450}
              className="hidden object-cover transition-transform group-hover:scale-105 dark:block"
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{example.name}</h3>
            <p className="text-sm text-muted-foreground">
              {example.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
