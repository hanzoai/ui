# Hanzo UI Component Library - AI Assistant Context

## Project Overview

Hanzo UI is a comprehensive React component library built on shadcn/ui, featuring 86+ components including AI, 3D, animation, and code components:
- 50+ primitive components with Hanzo branding
- Full TypeScript support with React 19
- Tailwind CSS 4.1 with OKLCH color system
- Model Context Protocol (MCP) server for AI assistance
- GitHub Pages deployment at ui.hanzo.ai

## Recent Updates (2025-09-18)

### Android Icon Component Implementation
Created simple Android logo/icon component for shadcn/ui library:

**Features Implemented:**
- React forwardRef pattern with TypeScript support
- SVG-based Android robot logo with characteristic design
- Customizable size variants (sm, default, lg, xl)
- Color customization with currentColor default
- Compatible with shadcn/ui component library patterns
- Uses class-variance-authority for size variants
- Clean SVG paths for Android robot body, head, antennae, arms, and eyes

**Technical Details:**
- Uses `cn` utility from "@/lib/utils" for className merging
- Proper TypeScript interfaces extending React.SVGAttributes
- Size variants: h-4 w-4 (sm), h-6 w-6 (default), h-8 w-8 (lg), h-12 w-12 (xl)
- Eye color logic: white eyes for colored icons, black for default
- SVG viewBox: "0 0 24 24" for consistent scaling
- Follows shadcn/ui naming and export conventions

**Files Created:**
- `/app/registry/default/ui/android.tsx` (95 lines)

**Validation:**
- TypeScript compilation successful
- Component structure validation passed
- Visual test confirmed proper rendering across sizes and colors

### AI Vision Component Implementation
Created comprehensive AI-powered image analysis component:

**Features Implemented:**
- Multi-input support: file upload, camera capture, URL input
- Real-time image analysis with visual overlays using Canvas API
- Object detection with bounding boxes and confidence scores
- OCR text extraction with positioning
- Scene description and image tagging
- Color palette analysis
- Face detection with emotion analysis
- Sentiment analysis capabilities
- Export functionality (JSON/PDF)
- Configurable capabilities and thresholds

**Technical Details:**
- Canvas-based overlay system for visual annotations
- TypeScript interfaces for all analysis results
- Responsive design following shadcn/ui patterns
- Drag-and-drop file handling with validation
- Mock analysis function (ready for API integration)
- Comprehensive documentation with examples

**Files Created:**
- `/app/registry/default/ui/ai-vision.tsx` (1,099 lines)
- `/app/content/docs/components/ai-vision.mdx` (459 lines)
- `/demo/ai-vision-demo.tsx` (demo component)

### Previous Updates (2025-09-13)

#### Migration to hanzo/ui v4
Successfully synced with latest hanzo/ui v4 including:
- Next.js 15.3.1 with Turbopack
- React 19.1.0 with server components
- Fumadocs MDX for documentation (replaced Contentlayer)
- Motion package (replaced framer-motion)
- Fixed MDX component passing issues
- Fixed React Hook Form compatibility

### MCP Server Enhancement
Created comprehensive MCP (Model Context Protocol) server for AI assistants:

**Available Tools:**
- `list_components` - Browse all components
- `get_component` - Get component details
- `get_component_source` - Access source code
- `get_component_demo` - Generate demos
- `add_component` - Installation instructions
- `list_blocks` - UI blocks/patterns
- `search_registry` - Search components
- `get_installation_guide` - Setup guide

**Resources:**
- `hanzo://components/list` - Component catalog
- `hanzo://blocks/list` - UI patterns
- `hanzo://installation/guide` - Installation guide
- `hanzo://theming/guide` - Theming docs

**Prompts:**
- `component_usage` - Generate examples
- `build_page` - Build complete pages
- `component_composition` - Create custom components
- `accessibility_review` - Review accessibility
- `theme_customization` - Generate themes

## Recent Updates (2025-09-18)

### Playwright Web Crawler Framework
Created a comprehensive, production-ready web crawler for extracting UI component documentation:

**Core Features:**
- Universal component extraction for any UI library
- Dynamic content support (SPAs)
- Authentication support (Basic, OAuth, Token, Cookie)
- Smart rate limiting and respectful crawling
- Resume capability with checkpoints
- Error screenshots for debugging

**Data Extraction Capabilities:**
- Component names and descriptions
- Code examples with language detection
- Props/API documentation tables
- Installation instructions and dependencies
- Live demo/sandbox links
- Component categorization

**Output Formats:**
- Structured JSON for programmatic use
- Markdown documentation for humans
- Extensible for custom formats

**Files Created:**
- `/scrapers/playwright-crawler.ts` - Main crawler implementation
- `/scrapers/example-usage.ts` - Usage examples for various libraries
- `/scrapers/playwright-crawler.test.ts` - Comprehensive test suite
- `/scrapers/demo.mjs` - Simple working demo
- `/scrapers/README.md` - Complete documentation

**Usage:**
```bash
npm run crawl:shadcn   # Crawl shadcn/ui
npm run crawl:mui      # Crawl Material-UI
npm run crawl:antd     # Crawl Ant Design
npm run crawl:test     # Run tests
```

The crawler can extract from any UI library website with configurable selectors, authentication, and custom extractors. Includes progressive crawling, parallel processing, and comprehensive error handling.

### Migration from hanzo/ui v3 to v4
- **Next.js 15.3.1**: Upgraded from Next.js 14 to 15 with Turbopack support
- **React 19.1.0**: Updated to latest React version with server components
- **Tailwind CSS 4.1**: Migrated from v3 to v4 with new CSS custom properties and OKLCH colors
- **Fumadocs**: Replaced Contentlayer with Fumadocs for MDX documentation
- **Motion**: Added framer-motion replacement (motion v12) for animations
- **Dependencies**: Updated all Radix UI components to latest v1.1+ versions

### Key Changes
1. **Build System**: Switched from Contentlayer to Fumadocs MDX
2. **Styling**: Implemented Tailwind CSS 4 with OKLCH color system preserving Hanzo purple branding
3. **Theming**: Enhanced theme variants with custom purple accent colors
4. **Performance**: Added Turbopack for faster development builds
5. **MDX Components**: Fixed component passing to ensure all MDX components are available during compilation

## Project Structure

```
/Users/z/work/hanzo/ui/
├── app/                    # Main documentation site (Next.js)
│   ├── app/               # App router pages
│   ├── components/        # Site components
│   ├── content/          # MDX documentation
│   ├── registry/         # Component registry
│   └── public/           # Static assets
├── pkg/ui/               # NPM package (@hanzo/ui)
│   ├── primitives/       # 50+ UI components
│   ├── blocks/          # Complex UI patterns
│   ├── mcp/            # MCP server implementation
│   │   ├── index.ts    # Basic MCP server
│   │   ├── enhanced-server.ts # Full-featured server
│   │   └── README.md   # MCP documentation
│   ├── bin/            # CLI commands
│   │   ├── cli.js     # Main CLI
│   │   ├── mcp.js     # MCP command
│   │   └── registry-mcp.js # Legacy MCP
│   └── registry/       # Component registry system
└── .github/workflows/  # CI/CD pipelines
    └── deploy-pages.yml # GitHub Pages deployment
```

## Key Commands

### Development
```bash
# Start docs site
cd app && npm run dev  # Runs on port 3003

# Build production
npm run build

# Run MCP server
npx @hanzo/ui mcp              # For AI clients
npx @hanzo/ui mcp --http       # HTTP mode for testing
```

### Component Management
```bash
# Initialize project
npx @hanzo/ui@latest init

# Add components
npx @hanzo/ui@latest add button
npx @hanzo/ui@latest add card dialog

# List components
npx @hanzo/ui@latest list
```

### MCP Integration

**IMPORTANT**: The UI MCP tools are now integrated into the main `@hanzo/mcp` package. Use the unified MCP server with the `--enable-ui` flag to access UI component tools.

**Claude Desktop** (`.mcp.json`):
```json
{
  "mcpServers": {
    "hanzo": {
      "command": "npx",
      "args": ["@hanzo/mcp", "serve", "--enable-ui"]
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "hanzo": {
      "command": "npx",
      "args": ["@hanzo/mcp", "serve", "--enable-ui"]
    }
  }
}
```

This provides 30 total tools (19 core + 11 UI) for comprehensive development support.

## App Structure and Routing (`/app/`)

### Next.js App Router Structure
```
app/app/
├── (app)/              # Main application routes
│   ├── blocks/         # Block components showcase
│   ├── docs/           # Documentation with [[...slug]] dynamic routing
│   ├── examples/       # Component examples
│   │   ├── authentication/
│   │   ├── cards/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   ├── mail/
│   │   ├── music/
│   │   ├── playground/
│   │   └── tasks/
│   ├── sink/           # Component testing area
│   └── themes/         # Theme showcase
├── (blocks)/           # Block-specific routes
└── layout.tsx          # Root layout
```

### Key App Features
- **Multi-theme support**: Both default and new-york styles
- **Component registry system**: Similar to hanzo/ui CLI
- **Interactive examples**: Music, mail, dashboard apps
- **Documentation site**: MDX-based with contentlayer
- **Theme switching**: Built-in dark/light mode

### Site Configuration
- **Brand**: "hanzo/ui" 
- **URL**: https://ui.hanzo.ai
- **Twitter**: @hanzo
- **GitHub**: hanzo-ui/ui

## Package Structure (`/pkg/`)

### 1. Core UI Package (`/pkg/ui/`)
**Version**: 4.5.3  
**Purpose**: Main UI component library with enhanced hanzo/ui components

#### Key Directories:
- **`/primitives/`**: 52 core UI components (enhanced hanzo/ui)
- **`/blocks/`**: Higher-level component compositions
- **`/tailwind/`**: Custom Tailwind configuration and plugins
- **`/style/`**: CSS files including Hanzo-specific styling
- **`/types/`**: TypeScript type definitions
- **`/util/`**: Utility functions
- **`/registry/`**: Component registry for CLI
- **`/mcp/`**: Model Context Protocol integration

#### Unique Features:
- **Custom variant system**: Extended button variants (primary, secondary, outline, ghost, link, linkFG, linkMuted, destructive)
- **Enhanced sizing**: xs, sm, square, default, lg, icon sizes
- **Rounded variants**: full, sm, md, lg, xl, none
- **Hanzo design tokens**: Custom color system and spacing
- **MCP support**: AI assistant integration
- **CLI tools**: Component installation system

### 2. Authentication Package (`/pkg/auth/`)
**Version**: 2.5.4  
**Purpose**: Firebase-based authentication system

#### Dependencies:
- Firebase Admin SDK
- MobX for state management
- React Hook Form integration
- Zod validation

#### Components:
- Authentication forms
- User management components
- Firebase integration utilities
- Server-side authentication helpers

### 3. Commerce Package (`/pkg/commerce/`)
**Version**: 7.3.7  
**Purpose**: E-commerce framework

#### Key Features:
- **Payment processing**: Square integration
- **Blockchain support**: Ethers.js integration
- **State management**: MobX-based cart and order management
- **Form handling**: React Hook Form with Zod validation

#### Dependencies:
- Square Web Payments SDK
- Ethers.js for Web3 functionality
- MobX for reactive state management

## Component Organization and Customizations

### Registry System
The component registry mirrors hanzo/ui but with Hanzo enhancements:
- **Styles**: `default` and `new-york` variants
- **Categories**: UI components, blocks, examples
- **CLI integration**: `@hanzo/ui` and `hanzo-ui` commands

### Hanzo-Specific Enhancements

#### 1. Enhanced Button Component
**Standard hanzo/ui**:
```tsx
variants: {
  variant: { default, destructive, outline, secondary, ghost, link },
  size: { default, sm, lg, icon }
}
```

**Hanzo Enhancement**:
```tsx
variants: {
  variant: { primary, secondary, outline, destructive, ghost, link, linkFG, linkMuted },
  size: { link, xs, sm, square, default, lg, icon },
  rounded: { full, sm, md, lg, xl, none }
}
```

#### 2. Custom Design System
- **Color variables**: `--hz-ui-*` prefix for Hanzo colors
- **Enhanced typography**: Custom font stacks and spacing
- **Theme variants**: Light and dark with Hanzo branding

#### 3. Advanced Tailwind Configuration
- **Custom plugins**: Typography plugin with Hanzo styling
- **Extended spacing**: Custom spacing scale
- **Font family integration**: Geist fonts
- **Container queries support**: `@tailwindcss/container-queries`

## Styling Architecture

### CSS Structure
```
/app/styles/
├── globals.css         # Hanzo-compatible base styles
└── mdx.css            # MDX documentation styling

/pkg/ui/style/
├── hanzo-common.css    # Base Hanzo styles
├── hanzo-default-colors.css  # Hanzo color system
├── drawer.css         # Drawer-specific styles
└── globals.css        # Global utilities
```

### Color System
**Light Theme**:
- Primary: Black (`hsl(0 0% 0%)`)
- Secondary: Purple variants (`hsl(266, 79%, X%)`)
- Background levels: 0-5 scale from white to gray

**Dark Theme**:
- Inverted color scheme with purple accents
- Background levels: 0-3 scale from black to gray

## Documentation State

### Current Documentation
- **README.md**: Basic overview and differences from hanzo/ui
- **LLM.md**: Build and registry information
- **CONTRIBUTING.md**: Contribution guidelines
- **Component docs**: Generated through contentlayer

### Documentation Gaps
- Missing detailed API documentation for Hanzo-specific features
- Limited examples for auth and commerce packages
- No migration guide from hanzo/ui to Hanzo UI

## Key Differences from Standard hanzo/ui

### 1. Enhanced Component Variants
- More button variants (linkFG, linkMuted, primary vs default)
- Custom rounded variants for all applicable components
- Extended size system with xs and square options

### 2. Design System Integration
- Custom CSS variables with `--hz-ui-` prefix
- Hanzo-specific color palette with purple accents
- Enhanced typography with Geist font integration

### 3. Package Architecture
- Modular packages (ui, auth, commerce) vs single package
- pnpm workspace setup vs npm
- MCP integration for AI assistant support

### 4. Branding Elements
- Hanzo AI company branding throughout
- Custom social links (@hanzoai)
- Purple accent color scheme
- Enhanced button styling with Hanzo design language

### 5. Additional Features
- **Firebase authentication** integration
- **Commerce functionality** with Square and Web3 support
- **MCP server** for AI assistant interaction
- **Advanced theming** with CSS-in-JS support

## Recent Fixes

1. **MDX Component Import**: Fixed import path from `@/components/mdx-components` to `@/mdx-components`
2. **React Hook Form**: Added "use client" directive for React 19 compatibility
3. **Framer Motion**: Updated imports to use `motion/react` package
4. **Changelog**: Fixed `class` to `className` attributes
5. **MCP Server**: Created fallback JavaScript implementation for when TypeScript compilation unavailable

## Deployment

Site deploys to GitHub Pages on push to main:
- URL: https://ui.hanzo.ai
- Static export with Next.js
- Automated via GitHub Actions

## AI Assistant Guidelines

When working with this codebase:

1. **Use MCP Server**: The MCP server provides comprehensive access to components
2. **Preserve Branding**: Maintain Hanzo branding and color schemes
3. **Follow Patterns**: Use existing component patterns and conventions
4. **Test Changes**: Always verify with `npm run dev` and `npm run build`
5. **Update Registry**: Ensure registry.json reflects component changes
6. **Document Updates**: Update this LLM.md with significant changes

## Known Issues

1. TypeScript build has some type errors (doesn't affect functionality)
2. HTTP mode for MCP requires additional dependencies
3. Some peer dependency warnings (can be ignored)

## Next Steps

- [ ] Fix TypeScript build errors
- [ ] Add more blocks and patterns
- [ ] Enhance MCP with component preview generation
- [ ] Add component playground
- [ ] Improve documentation search

## Contact

- Repository: github.com/hanzoai/ui
- Documentation: ui.hanzo.ai
- Package: @hanzo/ui on NPM

---

# Hanzo UI Architecture Review & Implementation Plan

## Executive Summary

Comprehensive architectural review of Hanzo UI component library reveals a solid foundation with 62 implemented components but significant gaps in extended registry coverage. Current implementation demonstrates good TypeScript practices and modern React patterns, but requires systematic completion of missing components and architectural improvements.

## 1. Current State Analysis

### Implemented Components (62 total)
#### ✅ Core UI Components
- **Base Components**: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, checkbox, collapsible, command, context-menu, dialog, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip

#### ✅ Extended Components (Partial)
- **3D Effects**: 3d-card ✓
- **AI Components**: ai-playground ✓, ai-chat ✓, ai-agents ✓, ai-voice ✓
- **Animation**: animated-cursor ✓
- **Code**: code-block ✓, code-editor ✓, terminal ✓
- **Project Management**: kanban ✓
- **Navigation**: dock ✓
- **Media**: music-player ✓
- **Background**: particles-background ✓, grid-pattern ✓

### Missing Implementations (Critical Priority)

#### 🔴 Navigation Components (19 total - ALL MISSING)
- simple-navigation-bar
- advanced-navigation-bar
- underline-navigation-bar
- e-commerce-navigation-bar
- dashboard-navigation-bar
- icon-navigation-bar
- breadcrumb-navigation-bar
- two-tier-navigation-bar
- communication-navigation-bar
- centered-logo-navigation-bar
- context-switcher-navigation-bar
- team-switcher-navigation-bar
- ai-model-selector-navigation-bar
- search-and-toggle-navigation-bar
- breadcrumb-and-filters-navigation-bar
- app-switcher-navigation-bar
- collaboration-navigation-bar
- status-dashboard-navigation-bar

#### 🟠 Animation Components (High Priority)
- 3d-marquee
- 3d-pin
- animated-beam
- animated-testimonials
- animated-tooltip
- apple-cards-carousel
- apple-hello-effect
- glimpse
- interactive-grid-pattern
- magnetic
- motion-highlight
- pin-list
- stars-scrolling-wheel

#### 🟡 Form Components (Medium Priority)
- choicebox
- color-picker
- combobox
- dropzone
- editor (rich text)
- minimal-tiptap
- image-crop
- image-zoom
- tags

#### 🟢 Additional Components (Lower Priority)
- Device Mockups: android, iphone-15-pro, safari
- Financial: credit-card, ticker
- Utilities: qr-code, comparison, kbd, status, video-player
- UI Elements: announcement, banner, pill, avatar-group

## 2. Code Quality Assessment

### Strengths
1. **TypeScript Usage**: Proper type definitions with interfaces and type exports
2. **Component Structure**: Clean separation of concerns with forwardRef patterns
3. **Accessibility**: Using Radix UI primitives for a11y compliance
4. **State Management**: Appropriate use of React hooks and context
5. **Styling**: Consistent use of cn() utility with Tailwind classes

### Areas for Improvement
1. **Missing Error Boundaries**: No error handling in complex components
2. **Performance**: Limited use of memo/useMemo/useCallback optimizations
3. **Testing**: No visible test files for most components
4. **Documentation**: Inline documentation sparse, no JSDoc comments
5. **Accessibility**: Missing ARIA labels in some interactive components

## 3. Architectural Recommendations

### Design Principles
```typescript
// 1. Minimal Surface Area - Single responsibility
interface ComponentProps {
  // Required props only
  value: string
  onChange: (value: string) => void
  // Optional with sensible defaults
  variant?: "default" | "outline"
  size?: "sm" | "md" | "lg"
}

// 2. Composition over Configuration
<Card>
  <CardHeader />
  <CardContent />
  <CardFooter />
</Card>

// 3. Type Safety First
type StrictProps<T> = {
  [K in keyof T]-?: T[K]
}
```

### Component Pattern Template
```typescript
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ComponentNameProps extends React.HTMLAttributes<HTMLDivElement> {
  // Minimal required props
}

const ComponentName = React.forwardRef<HTMLDivElement, ComponentNameProps>(
  ({ className, ...props }, ref) => {
    // Single state responsibility
    // Memoized computations
    // Error boundaries where needed

    return (
      <div
        ref={ref}
        className={cn("base-classes", className)}
        {...props}
      />
    )
  }
)
ComponentName.displayName = "ComponentName"

export { ComponentName, type ComponentNameProps }
```

### Shared Utilities Needed
```typescript
// /app/lib/hooks/index.ts
export { useDebounce } from "./use-debounce"
export { useThrottle } from "./use-throttle"
export { useIntersectionObserver } from "./use-intersection-observer"
export { useMediaQuery } from "./use-media-query"
export { useMounted } from "./use-mounted"
export { useClickOutside } from "./use-click-outside"

// /app/lib/animations/index.ts
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 } }
export const slideUp = { initial: { y: 20 }, animate: { y: 0 } }
export const scaleIn = { initial: { scale: 0.9 }, animate: { scale: 1 } }
```

## 4. Implementation Priority Plan

### Phase 1: Critical Navigation (Week 1)
1. **Base Navigation Template**: Create reusable navigation primitives
2. **Simple Variants**: simple, underline, icon navigation bars
3. **Complex Variants**: dashboard, e-commerce, two-tier navigation
4. **AI-Specific**: ai-model-selector, context-switcher navigation

### Phase 2: Core Animations (Week 2)
1. **3D Components**: 3d-marquee, 3d-pin
2. **Apple Effects**: apple-cards-carousel, apple-hello-effect
3. **Interactive**: animated-beam, magnetic, motion-highlight
4. **Background**: interactive-grid-pattern

### Phase 3: Form Enhancements (Week 3)
1. **Input Components**: choicebox, color-picker, combobox
2. **File Handling**: dropzone, image-crop, image-zoom
3. **Rich Text**: editor, minimal-tiptap
4. **Utility**: tags, relative-time

### Phase 4: Polish & Optimization (Week 4)
1. **Device Mockups**: android, iphone-15-pro, safari
2. **Utilities**: qr-code, comparison, video-player
3. **Performance**: Add memoization, lazy loading
4. **Testing**: Unit tests for critical components

## 5. Quality Checklist

### Per-Component Requirements
- [ ] TypeScript interfaces properly exported
- [ ] forwardRef implementation for DOM access
- [ ] Proper displayName for debugging
- [ ] cn() utility for className merging
- [ ] Responsive design (mobile-first)
- [ ] Dark mode support via Tailwind
- [ ] ARIA attributes for accessibility
- [ ] Error boundary where appropriate
- [ ] Performance optimizations (memo, useMemo)
- [ ] Example usage in /example directory
- [ ] Unit test coverage >80%

### Code Standards
```typescript
// ✅ GOOD: Explicit, type-safe, minimal
interface ButtonProps {
  variant: "primary" | "secondary"
  onClick: () => void
  children: React.ReactNode
}

// ❌ BAD: Too flexible, any-typed
interface ButtonProps {
  [key: string]: any
  onClick?: Function
}
```

## 6. Performance Optimizations

### Required Patterns
1. **Lazy Loading**: Use React.lazy for heavy components
2. **Code Splitting**: Separate bundles for extended components
3. **Virtual Scrolling**: For lists >100 items
4. **Debouncing**: Search, filter operations
5. **Memoization**: Expensive computations and child components

### Implementation
```typescript
// Memoized component
const ExpensiveComponent = React.memo(({ data }) => {
  const processedData = React.useMemo(
    () => expensiveOperation(data),
    [data]
  )
  return <div>{processedData}</div>
})

// Virtualized list
import { Virtuoso } from "react-virtuoso"
<Virtuoso
  data={items}
  itemContent={(index) => <Item item={items[index]} />}
/>
```

## 7. Testing Strategy

### Test Coverage Requirements
- Unit tests: Component logic, props validation
- Integration tests: Component composition
- Accessibility tests: ARIA compliance
- Visual regression: Screenshot comparison
- Performance tests: Render time metrics

### Test Template
```typescript
import { render, screen } from "@testing-library/react"
import { ComponentName } from "./component-name"

describe("ComponentName", () => {
  it("renders with required props", () => {
    render(<ComponentName />)
    expect(screen.getByRole("...")).toBeInTheDocument()
  })

  it("handles user interaction", () => {
    // Test user events
  })

  it("meets accessibility standards", () => {
    // Test ARIA attributes
  })
})
```

## 8. Documentation Requirements

### Component Documentation
```typescript
/**
 * ComponentName - Brief description
 *
 * @example
 * ```tsx
 * <ComponentName
 *   value="example"
 *   onChange={(val) => console.log(val)}
 * />
 * ```
 *
 * @param props - Component properties
 * @param props.value - Current value
 * @param props.onChange - Change handler
 */
```

## 9. Bot Agent Implementation Instructions

### Task Assignment
1. **Navigation Bot**: Focus on all navigation components
2. **Animation Bot**: Handle framer-motion components
3. **Form Bot**: Implement form and input components
4. **Utility Bot**: Build utility and helper components

### Implementation Order
1. Read this document completely
2. Check existing implementations for patterns
3. Create component following template
4. Add examples in /example directory
5. Test thoroughly before marking complete
6. Update registry files

### Quality Gates
- No component merged without TypeScript types
- No animation without performance optimization
- No form without validation and accessibility
- No utility without comprehensive examples

## 10. Success Metrics

### Completion Targets
- Week 1: 100% navigation components
- Week 2: 80% animation components
- Week 3: 100% form components
- Week 4: 100% remaining components

### Quality Metrics
- TypeScript coverage: 100%
- Test coverage: >80%
- Accessibility score: 100%
- Bundle size increase: <20%
- Performance: <100ms render time

## Next Steps for Bot Agents

1. **Immediate Actions**:
   - Review this document
   - Set up development environment
   - Start with navigation components
   - Follow the component template

2. **Communication Protocol**:
   - Update LLM.md with progress
   - Flag blockers immediately
   - Request reviews for complex components
   - Document any deviations from patterns

3. **Quality Assurance**:
   - Self-review against checklist
   - Peer review by another bot
   - Human review for critical components
   - Performance testing before merge

---

*Document Version: 1.0*
*Last Updated: Current Session*
*Author: CTO Architecture Review*