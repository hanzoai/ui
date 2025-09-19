import { ScraperConfig } from '../types'

export const radixUIConfig: ScraperConfig = {
  name: 'radix-ui',
  displayName: 'Radix UI',
  description: 'Low-level UI primitives for building high-quality design systems',

  baseUrls: {
    docs: 'https://www.radix-ui.com',
    primitives: 'https://www.radix-ui.com/primitives/docs',
    themes: 'https://www.radix-ui.com/themes/docs',
    colors: 'https://www.radix-ui.com/colors'
  },

  componentPaths: [
    '/primitives/docs/components/*',
    '/themes/docs/components/*'
  ],

  selectors: {
    componentCode: '.CodeBlock pre',
    componentPreview: '[data-preview]',
    componentTitle: 'h1[data-radix-scroll-area-viewport] + div h1',
    componentDescription: '.Text.size-4',
    apiReference: '[data-heading="API Reference"] + div',
    props: 'table tbody tr',
    examples: '[data-heading="Examples"] + div',
    accessibility: '[data-heading="Accessibility"] + div',
    keyboardInteractions: '[data-heading="Keyboard Interactions"] + table'
  },

  categories: {
    'Form': ['checkbox', 'form', 'label', 'radio-group', 'select', 'slider', 'switch', 'toggle', 'toggle-group'],
    'Layout': ['aspect-ratio', 'box', 'container', 'flex', 'grid', 'section', 'separator'],
    'Overlay': ['alert-dialog', 'context-menu', 'dialog', 'dropdown-menu', 'hover-card', 'popover', 'tooltip'],
    'Navigation': ['menubar', 'navigation-menu', 'tabs', 'toolbar'],
    'Display': ['accordion', 'avatar', 'badge', 'card', 'collapsible', 'progress', 'scroll-area'],
    'Typography': ['blockquote', 'code', 'em', 'heading', 'kbd', 'link', 'quote', 'strong', 'text'],
    'Utilities': ['accessible-icon', 'portal', 'slot', 'visually-hidden']
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
    extractPrimitives: true,
    extractThemes: true,
    extractColors: true,
    parseAccessibility: true,
    extractKeyboardNav: true,
    extractDataAttributes: true,
    preserveAriaAttributes: true
  },

  transformers: {
    componentName: (name: string) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    fileName: (name: string) => `${name}.tsx`,
    importPath: (name: string) => `@radix-ui/react-${name}`,
    themesImportPath: (name: string) => `@radix-ui/themes`
  },

  metadata: {
    framework: 'React',
    styling: 'CSS-in-JS / Vanilla CSS',
    baseLibrary: 'Native',
    typescript: true,
    license: 'MIT',
    accessibility: 'WAI-ARIA compliant'
  }
}