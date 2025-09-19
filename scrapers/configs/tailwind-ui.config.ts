import { ScraperConfig } from '../types'

export const tailwindUIConfig: ScraperConfig = {
  name: 'tailwind-ui',
  displayName: 'Tailwind UI',
  description: 'Beautiful UI components by the creators of Tailwind CSS',

  baseUrls: {
    docs: 'https://tailwindui.com',
    components: 'https://tailwindui.com/components',
    templates: 'https://tailwindui.com/templates'
  },

  componentPaths: [
    '/components/marketing/*',
    '/components/application-ui/*',
    '/components/ecommerce/*'
  ],

  selectors: {
    componentCode: '[data-component]',
    componentPreview: '.component-preview',
    componentTitle: 'h1, h2.component-name',
    componentDescription: '.component-description',
    codeSnippet: 'pre code',
    variants: '[data-variant]',
    responsivePreview: '[data-responsive]',
    darkModeToggle: '[data-dark-mode]'
  },

  categories: {
    'Marketing': ['heroes', 'features', 'cta-sections', 'pricing', 'headers', 'testimonials'],
    'Application UI': ['forms', 'lists', 'modals', 'navigation', 'page-examples', 'stats'],
    'E-commerce': ['products', 'shopping-carts', 'checkout', 'stores', 'categories'],
    'Page Sections': ['headers', 'footers', 'newsletter', 'blog', 'contact'],
    'Elements': ['buttons', 'inputs', 'toggles', 'avatars', 'badges', 'dropdowns']
  },

  authentication: {
    required: true,
    type: 'license',
    envVars: ['TAILWIND_UI_LICENSE_KEY'],
    headers: {
      'Authorization': 'Bearer ${TAILWIND_UI_LICENSE_KEY}'
    }
  },

  rateLimit: {
    maxRequestsPerSecond: 1,
    delayMs: 1000,
    maxConcurrent: 2,
    respectRobotsTxt: true
  },

  specialRules: {
    requiresAuth: true,
    extractVariants: true,
    extractResponsive: true,
    extractDarkMode: true,
    preserveComments: false,
    extractAnimations: true
  },

  transformers: {
    componentName: (name: string) => name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''),
    fileName: (name: string) => `${name}.jsx`,
    importPath: (name: string) => `@/components/tailwind-ui/${name}`
  },

  metadata: {
    framework: 'React/Vue/HTML',
    styling: 'Tailwind CSS',
    baseLibrary: 'Native',
    typescript: false,
    license: 'Commercial',
    requiresPurchase: true
  }
}