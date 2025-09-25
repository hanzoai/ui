import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    // CORE - Ultra minimal, < 30KB target
    'index': 'primitives/index-core.ts',

    // Individual components - import as needed
    'accordion': 'primitives/accordion.tsx',
    'alert': 'primitives/alert.tsx',
    'alert-dialog': 'primitives/alert-dialog.tsx',
    'avatar': 'primitives/avatar.tsx',
    'badge': 'primitives/badge.tsx',
    'breadcrumb': 'primitives/breadcrumb.tsx',
    'checkbox': 'primitives/checkbox.tsx',
    'collapsible': 'primitives/collapsible.tsx',
    'context-menu': 'primitives/context-menu.tsx',
    'dialog': 'primitives/dialog.tsx',
    'dropdown-menu': 'primitives/dropdown-menu.tsx',
    'hover-card': 'primitives/hover-card.tsx',
    'navigation-menu': 'primitives/navigation-menu.tsx',
    'popover': 'primitives/popover.tsx',
    'progress': 'primitives/progress.tsx',
    'radio-group': 'primitives/radio-group.tsx',
    'scroll-area': 'primitives/scroll-area.tsx',
    'select': 'primitives/select.tsx',
    'separator': 'primitives/separator.tsx',
    'sheet': 'primitives/sheet.tsx',
    'skeleton': 'primitives/skeleton.tsx',
    'slider': 'primitives/slider.tsx',
    'switch': 'primitives/switch.tsx',
    'table': 'primitives/table.tsx',
    'tabs': 'primitives/tabs.tsx',
    'textarea': 'primitives/textarea.tsx',
    'toggle': 'primitives/toggle.tsx',
    'toggle-group': 'primitives/toggle-group.tsx',
    'tooltip': 'primitives/tooltip.tsx',
    
    // Optional components with heavy dependencies
    'calendar': 'primitives/calendar.tsx',
    'command': 'primitives/command.tsx',
    'carousel': 'primitives/carousel.tsx',
    'form': 'primitives/form.tsx',
    'drawer': 'primitives/drawer.tsx',
    'sonner': 'primitives/sonner.tsx',
    'input-otp': 'primitives/input-otp.tsx',
    'resizable': 'primitives/resizable.tsx',

    // Essential utilities
    'src/utils': 'src/utils.ts',
    'lib/utils': 'src/utils.ts',

    // Core types
    'types/index': 'types/index.ts',

    // Tailwind configuration
    'tailwind/index': 'tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // Skip for now to speed up builds
  sourcemap: false,
  external: [
    // Everything is external except what we're building
    /^(?!\.)/,  // Any import that doesn't start with '.'
  ],
  noExternal: [
    // Only bundle local relative imports
    /^\./,
  ],
  splitting: true,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: true, // Minify to reduce size
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'neutral'
    options.keepNames = true
  },
})