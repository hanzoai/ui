import { createMDX } from "fumadocs-mdx/next"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile packages that might have issues with pnpm symlinks
  transpilePackages: ["chrono-node", "@hanzo/ui"],

  // Enable static export for GitHub Pages deployment (but not for E2E tests)
  output: process.env.GITHUB_ACTIONS && !process.env.E2E_TEST ? "export" : undefined,

  // Use trailing slashes for GitHub Pages compatibility
  trailingSlash: true,

  // Base path for GitHub Pages (when deployed to github.io subdirectory)
  basePath: process.env.GITHUB_PAGES ? "/react-sdk" : "",

  // Asset prefix for proper loading on custom domain
  assetPrefix: process.env.NEXT_PUBLIC_APP_URL || "",

  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  redirects() {
    return [
      {
        source: "/components",
        destination: "/docs/components/accordion",
        permanent: true,
      },
      {
        source: "/docs/components",
        destination: "/docs/components/accordion",
        permanent: true,
      },
      {
        source: "/docs/primitives/:path*",
        destination: "/docs/components/:path*",
        permanent: true,
      },
      {
        source: "/figma",
        destination: "/docs/figma",
        permanent: true,
      },
      {
        source: "/docs/forms",
        destination: "/docs/components/form",
        permanent: false,
      },
      {
        source: "/docs/forms/react-hook-form",
        destination: "/docs/components/form",
        permanent: false,
      },
      {
        source: "/sidebar",
        destination: "/docs/components/sidebar",
        permanent: true,
      },
      {
        source: "/react-19",
        destination: "/docs/react-19",
        permanent: true,
      },
      {
        source: "/view/styles/:style/:name",
        destination: "/view/:name",
        permanent: true,
      },
      {
        source: "/docs/:path*.mdx",
        destination: "/docs/:path*.md",
        permanent: true,
      },
      {
        source: "/mcp",
        destination: "/docs/mcp",
        permanent: false,
      },
    ]
  },
  rewrites() {
    return [
      {
        source: "/docs/:path*.md",
        destination: "/llm/:path*",
      },
    ]
  },
}

const withMDX = createMDX({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      // Keep background color from theme
      keepBackground: false,
    },
  },
})

export default withMDX(nextConfig)