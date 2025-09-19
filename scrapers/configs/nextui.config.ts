import { ScraperConfig } from '../types'

export const nextUIConfig: ScraperConfig = {
  name: 'nextui',
  displayName: 'NextUI',
  description: 'Beautiful, fast, and modern React UI library built on top of Tailwind CSS',

  baseUrls: {
    docs: 'https://nextui.org',
    components: 'https://nextui.org/docs/components/*',
    customization: 'https://nextui.org/docs/customization/*'
  },

  componentPaths: [
    '/docs/components/*',
    '/docs/guide/*',
    '/docs/customization/*'
  ],

  selectors: {
    componentCode: 'pre code',
    componentPreview: '[data-component-preview]',
    componentTitle: 'h1',
    componentDescription: '.component-description',
    props: 'h2:contains("Props") + div table',
    slots: 'h2:contains("Slots") + div',
    events: 'h2:contains("Events") + div',
    examples: '.example-container',
    variants: 'h2:contains("Variants") + div',
    accessibility: 'h2:contains("Accessibility") + div'
  },

  categories: {
    'Layout': ['container', 'grid', 'spacer'],
    'Display': ['avatar', 'badge', 'card', 'chip', 'code', 'divider', 'image', 'kbd', 'link', 'skeleton', 'snippet', 'table', 'user'],
    'Forms': ['autocomplete', 'button', 'checkbox', 'date-input', 'date-picker', 'input', 'radio', 'select', 'slider', 'switch', 'textarea', 'time-input'],
    'Navigation': ['breadcrumbs', 'listbox', 'navbar', 'pagination', 'tabs'],
    'Feedback': ['circular-progress', 'progress', 'spinner'],
    'Overlays': ['dropdown', 'modal', 'popover', 'tooltip'],
    'Utilities': ['accordion', 'scroll-shadow']
  },

  authentication: {
    required: false
  },

  rateLimit: {
    maxRequestsPerSecond: 3,
    delayMs: 333,
    maxConcurrent: 4
  },

  specialRules: {
    extractVariants: true,
    extractColors: true,
    extractSizes: true,
    extractRadius: true,
    extractShadows: true,
    extractAnimations: true,
    extractSlots: true,
    extractTailwindClasses: true,
    preserveFramerMotion: true
  },

  transformers: {
    componentName: (name: string) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    fileName: (name: string) => `${name}.tsx`,
    importPath: (name: string) => `@nextui-org/react`,
    individualImport: (name: string) => `@nextui-org/${name}`
  },

  metadata: {
    framework: 'React',
    styling: 'Tailwind CSS',
    baseLibrary: 'NextUI',
    typescript: true,
    license: 'MIT',
    version: '2.x',
    darkMode: 'Built-in dark mode',
    animation: 'Framer Motion',
    a11y: 'WAI-ARIA compliant',
    ssr: 'SSR/SSG compatible'
  }
}