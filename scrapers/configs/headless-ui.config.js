"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.headlessUIConfig = void 0;
exports.headlessUIConfig = {
    name: 'headless-ui',
    displayName: 'Headless UI',
    description: 'Unstyled, accessible UI components for React & Vue',
    baseUrls: {
        docs: 'https://headlessui.com',
        github: 'https://github.com/tailwindlabs/headlessui'
    },
    componentPaths: [
        '/react/*',
        '/vue/*'
    ],
    selectors: {
        componentCode: 'pre code',
        componentPreview: '.component-preview',
        componentTitle: 'h1',
        componentDescription: '.prose > p:first-of-type',
        apiReference: 'h2:contains("Component API") + div',
        props: 'h3:contains("Props") + div table',
        slots: 'h3:contains("Slots") + div',
        examples: '.example-container',
        renderProp: 'h3:contains("Render prop") + div'
    },
    categories: {
        'Overlays': ['dialog', 'popover', 'modal'],
        'Menus': ['menu', 'dropdown'],
        'Selection': ['listbox', 'combobox', 'radio-group', 'switch', 'toggle'],
        'Disclosure': ['disclosure', 'accordion'],
        'Navigation': ['tabs'],
        'Transitions': ['transition']
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
        extractReactVersion: true,
        extractVueVersion: true,
        extractRenderProps: true,
        extractSlots: true,
        preserveTypeScript: true,
        extractTransitions: true,
        extractA11yFeatures: true
    },
    transformers: {
        componentName: (name) => name.split('-').map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(''),
        fileName: (name, framework) => `${name}.${framework === 'vue' ? 'vue' : 'tsx'}`,
        importPath: (name, framework) => `@headlessui/${framework}`,
        convertToFramework: (code, framework) => code
    },
    metadata: {
        framework: 'React/Vue',
        styling: 'Bring your own',
        baseLibrary: 'Native',
        typescript: true,
        license: 'MIT',
        accessibility: 'Fully accessible',
        maintainedBy: 'Tailwind Labs'
    }
};
