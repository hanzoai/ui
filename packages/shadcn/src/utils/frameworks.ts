<<<<<<< HEAD
=======
import { SHADCN_URL } from "@/src/registry/constants"

>>>>>>> shadcn/main
export const FRAMEWORKS = {
  "next-app": {
    name: "next-app",
    label: "Next.js",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/next",
=======
      installation: `${SHADCN_URL}/docs/installation/next`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/nextjs",
    },
  },
  "next-pages": {
    name: "next-pages",
    label: "Next.js",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/next",
=======
      installation: `${SHADCN_URL}/docs/installation/next`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/nextjs",
    },
  },
  remix: {
    name: "remix",
    label: "Remix",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/remix",
=======
      installation: `${SHADCN_URL}/docs/installation/remix`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/remix",
    },
  },
  "react-router": {
    name: "react-router",
    label: "React Router",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/react-router",
=======
      installation: `${SHADCN_URL}/docs/installation/react-router`,
>>>>>>> shadcn/main
      tailwind:
        "https://tailwindcss.com/docs/installation/framework-guides/react-router",
    },
  },
  vite: {
    name: "vite",
    label: "Vite",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/vite",
=======
      installation: `${SHADCN_URL}/docs/installation/vite`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/vite",
    },
  },
  astro: {
    name: "astro",
    label: "Astro",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/astro",
=======
      installation: `${SHADCN_URL}/docs/installation/astro`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/astro",
    },
  },
  laravel: {
    name: "laravel",
    label: "Laravel",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/laravel",
=======
      installation: `${SHADCN_URL}/docs/installation/laravel`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/laravel",
    },
  },
  "tanstack-start": {
    name: "tanstack-start",
    label: "TanStack Start",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/tanstack",
=======
      installation: `${SHADCN_URL}/docs/installation/tanstack`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/installation/using-postcss",
    },
  },
  gatsby: {
    name: "gatsby",
    label: "Gatsby",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/gatsby",
=======
      installation: `${SHADCN_URL}/docs/installation/gatsby`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/guides/gatsby",
    },
  },
  expo: {
    name: "expo",
    label: "Expo",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/expo",
=======
      installation: `${SHADCN_URL}/docs/installation/expo`,
>>>>>>> shadcn/main
      tailwind: "https://www.nativewind.dev/docs/getting-started/installation",
    },
  },
  manual: {
    name: "manual",
    label: "Manual",
    links: {
<<<<<<< HEAD
      installation: "https://ui.shadcn.com/docs/installation/manual",
=======
      installation: `${SHADCN_URL}/docs/installation/manual`,
>>>>>>> shadcn/main
      tailwind: "https://tailwindcss.com/docs/installation",
    },
  },
} as const

export type Framework = (typeof FRAMEWORKS)[keyof typeof FRAMEWORKS]
