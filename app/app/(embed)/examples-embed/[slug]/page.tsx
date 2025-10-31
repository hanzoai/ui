import { notFound } from "next/navigation"
import Image from "next/image"

import { Mail } from "@/app/(app)/examples/mail/components/mail"
import { accounts, mails } from "@/app/(app)/examples/mail/data"

const examples = {
  dashboard: () => import("@/app/(app)/examples/dashboard/page"),
  mail: () => null, // Special case handled below
  tasks: () => import("@/app/(app)/examples/tasks/page"),
  playground: () => import("@/app/(app)/examples/playground/page"),
  forms: () => import("@/app/(app)/examples/forms/page"),
  music: () => import("@/app/(app)/examples/music/page"),
  authentication: () => import("@/app/(app)/examples/authentication/page"),
  cards: () => import("@/app/(app)/examples/cards/page"),
}

export async function generateStaticParams() {
  return Object.keys(examples).map((slug) => ({
    slug,
  }))
}

export default async function EmbeddedExamplePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!(slug in examples)) {
    notFound()
  }

  // Special case for mail - render directly
  if (slug === "mail") {
    return (
      <>
        <div className="md:hidden">
          <Image
            src="/examples/mail-dark.png"
            width={1280}
            height={727}
            alt="Mail"
            className="hidden dark:block"
          />
          <Image
            src="/examples/mail-light.png"
            width={1280}
            height={727}
            alt="Mail"
            className="block dark:hidden"
          />
        </div>
        <div className="hidden flex-col md:flex">
          <Mail
            accounts={accounts}
            mails={mails}
            defaultLayout={undefined}
            defaultCollapsed={undefined}
            navCollapsedSize={4}
          />
        </div>
      </>
    )
  }

  // Dynamically import and render the example
  const ExampleModule = await examples[slug as keyof typeof examples]()
  if (!ExampleModule || typeof ExampleModule !== "object" || !("default" in ExampleModule)) {
    notFound()
  }

  const ExampleComponent = ExampleModule.default as React.ComponentType
  return <ExampleComponent />
}
