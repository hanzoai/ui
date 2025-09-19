"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shadcnUIConfig = void 0;
exports.shadcnUIConfig = {
    name: 'shadcn-ui',
    displayName: 'shadcn/ui',
    description: 'Beautifully designed components built with Radix UI and Tailwind CSS',
    baseUrls: {
        docs: 'https://ui.shadcn.com',
        github: 'https://github.com/shadcn-ui/ui',
        registry: 'https://ui.shadcn.com/registry'
    },
    componentPaths: [
        '/docs/components/*',
        '/examples/*'
    ],
    selectors: {
        componentCode: '[data-rehype-pretty-code-fragment]',
        componentPreview: '.preview',
        componentTitle: 'h1',
        componentDescription: '.lead',
        installCommand: 'pre:has-text("npx shadcn-ui")',
        dependencies: '.prose pre:has-text("npm install")',
        usage: 'h2:has-text("Usage") + div',
        props: 'h2:has-text("Props") + div table',
        examples: 'h2:has-text("Examples") ~ div'
    },
    categories: {
        'Form': ['form', 'input', 'textarea', 'select', 'checkbox', 'radio', 'switch', 'slider'],
        'Layout': ['accordion', 'aspect-ratio', 'card', 'collapsible', 'separator', 'sheet', 'tabs'],
        'Navigation': ['breadcrumb', 'dropdown-menu', 'menubar', 'navigation-menu', 'pagination'],
        'Data Display': ['avatar', 'badge', 'calendar', 'table', 'toast', 'tooltip'],
        'Feedback': ['alert', 'alert-dialog', 'dialog', 'progress', 'skeleton', 'sonner'],
        'Typography': ['typography', 'label', 'heading'],
        'Overlay': ['dialog', 'drawer', 'popover', 'sheet', 'tooltip']
    },
    authentication: {
        required: false
    },
    rateLimit: {
        maxRequestsPerSecond: 2,
        delayMs: 500,
        maxConcurrent: 3
    },
    specialRules: {
        extractRegistry: true,
        parseTypeScript: true,
        extractTailwindClasses: true,
        preserveImports: true,
        extractDependencies: true
    },
    transformers: {
        componentName: (name) => name.replace(/-/g, ''),
        fileName: (name) => `${name}.tsx`,
        importPath: (name) => `@/components/ui/${name}`
    },
    metadata: {
        framework: 'React',
        styling: 'Tailwind CSS',
        baseLibrary: 'Radix UI',
        typescript: true,
        license: 'MIT'
    }
};
