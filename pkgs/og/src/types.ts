export interface OgConfig {
  // Content
  title: string            // big headline (can contain \n for line break)
  subtitle?: string        // smaller text below title
  badge?: string           // top-left label chip (e.g. "Pricing", "Research")
  pills?: string[]         // bottom row of chips (model names, tiers, tags)
  stat?: { value: string; label: string }  // big number (e.g. "390+" / "AI Models")
  codeSnippet?: string     // raw code string for developer pages

  // Brand
  domain?: string          // shown as "domain.com" in top bar (default "hanzo.ai")
  siteName?: string        // shown in header alongside domain
  accentColor?: string     // default "#EF4444"
  bgColor?: string         // default "#0a0a0a"
  svgIcon?: string         // raw SVG string for the brand mark

  // Layout variant
  layout?: 'page'      // default: headline + subtitle + pills
         | 'model'     // model card: name + provider + context + modality badges
         | 'code'      // terminal: dark code block + headline
         | 'stat'      // big stat: number + label + supporting text
         | 'split'     // left: headline, right: visual/pills grid
         | 'minimal'   // just title + domain, clean

  // Model-specific (for layout='model')
  modelId?: string
  provider?: string
  contextWindow?: string   // formatted e.g. "200K"
  modalities?: string[]    // e.g. ["text", "vision", "code"]

  // Image dimensions
  width?: number    // default 1200
  height?: number   // default 630
}
