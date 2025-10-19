import Link from "next/link"

const examples = [
  {
    name: "Mail",
    href: "/examples/mail",
    image: "/examples/mail-light.png",
    imageDark: "/examples/mail-dark.png",
    description: "A mail app with a sidebar and inbox.",
  },
  {
    name: "Dashboard",
    href: "/examples/dashboard",
    image: "/examples/dashboard-light.png",
    imageDark: "/examples/dashboard-dark.png",
    description: "A dashboard with navigation, stats, and charts.",
  },
  {
    name: "Cards",
    href: "/examples/cards",
    image: "/examples/cards-light.png",
    imageDark: "/examples/cards-dark.png",
    description: "A collection of card examples with different layouts.",
  },
  {
    name: "Tasks",
    href: "/examples/tasks",
    image: "/examples/tasks-light.png",
    imageDark: "/examples/tasks-dark.png",
    description: "A task management app with a sidebar and task list.",
  },
  {
    name: "Playground",
    href: "/examples/playground",
    image: "/examples/playground-light.png",
    imageDark: "/examples/playground-dark.png",
    description: "A playground for testing components and layouts.",
  },
  {
    name: "Forms",
    href: "/examples/forms",
    image: "/examples/forms-light.png",
    imageDark: "/examples/forms-dark.png",
    description: "Different form examples with various layouts.",
  },
  {
    name: "Music",
    href: "/examples/music",
    image: "/examples/music-light.png",
    imageDark: "/examples/music-dark.png",
    description: "A music app with playlists and player controls.",
  },
  {
    name: "Authentication",
    href: "/examples/authentication",
    image: "/examples/authentication-light.png",
    imageDark: "/examples/authentication-dark.png",
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
            <img
              src={example.image}
              alt={example.name}
              className="block h-full w-full object-cover transition-transform group-hover:scale-105 dark:hidden"
            />
            <img
              src={example.imageDark}
              alt={example.name}
              className="hidden h-full w-full object-cover transition-transform group-hover:scale-105 dark:block"
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
