<<<<<<< HEAD
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import appCss from '../styles.css?url'
=======
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"

import appCss from "../styles.css?url"
>>>>>>> shadcn/main

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
<<<<<<< HEAD
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'TanStack Start Starter',
=======
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
>>>>>>> shadcn/main
      },
    ],
    links: [
      {
<<<<<<< HEAD
        rel: 'stylesheet',
=======
        rel: "stylesheet",
>>>>>>> shadcn/main
        href: appCss,
      },
    ],
  }),
<<<<<<< HEAD

=======
>>>>>>> shadcn/main
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
<<<<<<< HEAD
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
=======
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
>>>>>>> shadcn/main
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
