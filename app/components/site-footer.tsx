import { siteConfig } from "@/config/site"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container">
        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-8 py-8 md:grid-cols-4">
          <div>
            <h3 className="mb-3 text-sm font-semibold">Getting Started</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/docs"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Introduction
                </a>
              </li>
              <li>
                <a
                  href="/docs/installation"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Installation
                </a>
              </li>
              <li>
                <a
                  href="/docs/cli"
                  className="text-muted-foreground hover:text-foreground"
                >
                  CLI
                </a>
              </li>
              <li>
                <a
                  href="/docs/components"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Components
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Frameworks</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/docs/frameworks"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Overview
                </a>
              </li>
              <li>
                <a
                  href="/docs/frameworks/react"
                  className="text-muted-foreground hover:text-foreground"
                >
                  React
                </a>
              </li>
              <li>
                <a
                  href="/docs/frameworks/vue"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Vue
                </a>
              </li>
              <li>
                <a
                  href="/docs/frameworks/svelte"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Svelte
                </a>
              </li>
              <li>
                <a
                  href="/docs/frameworks/react-native"
                  className="text-muted-foreground hover:text-foreground"
                >
                  React Native
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/docs/packages"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Packages
                </a>
              </li>
              <li>
                <a
                  href="/docs/testing"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Testing
                </a>
              </li>
              <li>
                <a
                  href="/docs/white-label"
                  className="text-muted-foreground hover:text-foreground"
                >
                  White-Label
                </a>
              </li>
              <li>
                <a
                  href="/blocks"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Blocks
                </a>
              </li>
              <li>
                <a
                  href="/docs/guides/page-builder"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Page Builder
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Community</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={siteConfig.links.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.links.discord}
                  target="_blank"
                  rel="noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="/docs/changelog"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Changelog
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t py-6 md:h-16 md:flex-row md:py-0">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              @hanzoai
            </a>
            . The source code is available on{" "}
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a
              href="/docs"
              className="hover:text-foreground"
            >
              Documentation
            </a>
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className="hover:text-foreground"
            >
              Contribute
            </a>
            <a
              href="/docs/changelog"
              className="hover:text-foreground"
            >
              v{siteConfig.version || "5.0.0"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
