import { defineConfig } from 'tsup'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Directories/files that should NOT have 'use client' (server-compatible utilities)
const SERVER_SAFE_PATHS = [
  'util/',      // Utility functions like cn() should work on server
  'types/',     // Type definitions
  'tailwind/',  // Tailwind config
  'lib/',       // Library utilities
]

// Post-build: Add 'use client' directive to JS/MJS files that need it
function addUseClientDirective(dir: string, relativePath = '') {
  const files = readdirSync(dir)
  for (const file of files) {
    const filePath = join(dir, file)
    const currentRelativePath = relativePath ? `${relativePath}/${file}` : file
    const stat = statSync(filePath)

    if (stat.isDirectory()) {
      addUseClientDirective(filePath, currentRelativePath)
    } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
      // Skip files in server-safe directories
      const isServerSafe = SERVER_SAFE_PATHS.some(path => currentRelativePath.startsWith(path))
      if (isServerSafe) {
        continue
      }

      const content = readFileSync(filePath, 'utf-8')
      if (!content.startsWith('"use client"')) {
        writeFileSync(filePath, '"use client";\n' + content)
      }
    }
  }
}

export default defineConfig({
  entry: {
    // Main exports - standard primitives (excludes heavy deps like react-dropzone)
    'index': 'primitives/index-standard.ts',

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

    // Utilities
    'util/index': 'util/index-client.ts',
    'lib/utils': 'src/utils.ts',

    // Blocks components (core only, excludes sidebar/dashboard/calendar/auth for compatibility)
    'blocks/index': 'blocks/index-core.ts',

    // Core types
    'types/index': 'types/index.ts',

    // Tailwind configuration
    'tailwind/index': 'tailwind/index.ts',

    // NAMESPACED COMPONENTS
    // 3D components
    '3d/index': 'src/3d/index.ts',
    '3d/button': 'src/3d/button.tsx',
    '3d/card': 'src/3d/card.tsx',
    '3d/carousel': 'src/3d/carousel.tsx',
    '3d/grid': 'src/3d/grid.tsx',
    '3d/marquee': 'src/3d/marquee.tsx',
    '3d/pin': 'src/3d/pin.tsx',

    // Spline components (requires @splinetool/react-spline)
    'spline/index': 'src/spline/index.ts',
    'spline/media-stack': 'src/spline/media-stack.tsx',
    'spline/player': 'src/spline/player.tsx',

    // Charts components (requires recharts)
    'charts/index': 'src/charts/index.ts',

    // Kanban components (requires @dnd-kit/*)
    'kanban/index': 'src/kanban/index.ts',

    // Mermaid components (requires mermaid)
    'mermaid/index': 'src/mermaid/index.ts',

    // Extended calendar (requires react-day-picker, date-fns, chrono-node)
    'calendar-ext/index': 'src/calendar-ext/index.ts',

    // Animation components
    'animation/index': 'src/animation/index.ts',
    'animation/apple-cards-carousel': 'src/animation/apple-cards-carousel.tsx',
    'animation/apple-hello-effect': 'src/animation/apple-hello-effect.tsx',
    'animation/animated-background': 'src/animation/background.tsx',
    'animation/animated-beam': 'src/animation/beam.tsx',
    'animation/animated-cursor': 'src/animation/cursor.tsx',
    'animation/animated-icon': 'src/animation/icon.tsx',
    'animation/animated-list': 'src/animation/list.tsx',
    'animation/animated-number': 'src/animation/number.tsx',
    'animation/animated-testimonials': 'src/animation/testimonials.tsx',
    'animation/animated-tooltip': 'src/animation/tooltip.tsx',

    // Code components
    'code/index': 'src/code/index.ts',
    'code/block': 'src/code/block.tsx',
    'code/compare': 'src/code/compare.tsx',
    'code/diff': 'src/code/diff.tsx',
    'code/editor': 'src/code/editor.tsx',
    'code/explorer': 'src/code/explorer.tsx',
    'code/preview': 'src/code/preview.tsx',
    'code/snippet': 'src/code/snippet.tsx',
    'code/tabs': 'src/code/tabs.tsx',
    'code/terminal': 'src/code/terminal.tsx',

    // Pattern components
    'pattern/index': 'src/pattern/index.ts',
    'pattern/grid-pattern': 'src/pattern/grid.tsx',

    // Navigation components
    'navigation/index': 'src/navigation/index.ts',

    // Form components
    'form/index': 'src/form/index.ts',

    // Device components
    'device/index': 'src/device/index.ts',

    // Dock components
    'dock/index': 'src/dock/index.ts',
    'dock/basic': 'src/dock/basic.tsx',
    'dock/limelight-nav': 'src/dock/limelight-nav.tsx',
    'dock/macos': 'src/dock/macos.tsx',
    'dock/menu': 'src/dock/menu.tsx',
    'dock/message': 'src/dock/message.tsx',

    // Desktop components (macOS-style window management)
    'desktop/index': 'src/desktop/index.ts',
    'desktop/window': 'src/desktop/window.tsx',
    'desktop/spotlight': 'src/desktop/spotlight.tsx',
    'desktop/hooks': 'src/desktop/hooks.ts',

    // Project components
    'project/index': 'src/project/index.ts',
    'project/gantt': 'src/project/gantt.tsx',
    'project/kanban': 'src/project/kanban.tsx',
    'project/list': 'src/project/list.tsx',

    // UI components
    'ui/index': 'src/ui/index.ts',
    'ui/announcement': 'src/ui/announcement.tsx',
    'ui/avatar-group': 'src/ui/avatar-group.tsx',
    'ui/banner': 'src/ui/banner.tsx',
    'ui/cursor': 'src/ui/cursor.tsx',
    'ui/marquee': 'src/ui/marquee.tsx',
    'ui/pill': 'src/ui/pill.tsx',
    'ui/spinner': 'src/ui/spinner.tsx',
    'ui/tags': 'src/ui/tags.tsx',
    'ui/ticker': 'src/ui/ticker.tsx',

    // Finance components
    'finance/index': 'finance/index.ts',
    'finance/AdvancedChart': 'finance/components/AdvancedChart.tsx',
    'finance/CompanyProfile': 'finance/components/CompanyProfile.tsx',
    'finance/CryptoScreener': 'finance/components/CryptoScreener.tsx',
    'finance/Financials': 'finance/components/Financials.tsx',
    'finance/ForexScreener': 'finance/components/ForexScreener.tsx',
    'finance/MarketOverview': 'finance/components/MarketOverview.tsx',
    'finance/NewsTimeline': 'finance/components/NewsTimeline.tsx',
    'finance/OrderEntry': 'finance/components/OrderEntry.tsx',
    'finance/OrdersHistory': 'finance/components/OrdersHistory.tsx',
    'finance/PositionsList': 'finance/components/PositionsList.tsx',
    'finance/StockScreener': 'finance/components/StockScreener.tsx',
    'finance/SymbolInfo': 'finance/components/SymbolInfo.tsx',
    'finance/TechnicalAnalysis': 'finance/components/TechnicalAnalysis.tsx',
    'finance/TickerTape': 'finance/components/TickerTape.tsx',
    'finance/TradingPanel': 'finance/components/TradingPanel.tsx',
  },
  format: ['cjs', 'esm'],
  dts: false, // Disabled - will generate with tsc instead
  sourcemap: false,
  external: [
    // Everything is external except what we're building
    /^(?!\.)/,  // Any import that doesn't start with '.'
  ],
  noExternal: [
    // Only bundle local relative imports
    /^\./,
  ],
  splitting: false,
  clean: true,
  target: 'es2020',
  outDir: 'dist',
  treeshake: true,
  minify: true, // Safe: 'use client' banner added post-build in onSuccess
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.platform = 'neutral'
    options.keepNames = true
  },
  onSuccess() {
    // Add 'use client' directive to all output files
    addUseClientDirective('./dist')
    console.log('Added "use client" directive to all output files')
  },
})