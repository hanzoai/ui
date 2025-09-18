# Hanzo UI - AI Assistant Context

## Project Overview

Hanzo UI is a comprehensive React component library built on top of hanzo/ui v4, featuring:
- 50+ primitive components with Hanzo branding
- Full TypeScript support with React 19
- Tailwind CSS 4.1 with OKLCH color system
- Model Context Protocol (MCP) server for AI assistance
- GitHub Pages deployment at ui.hanzo.ai

## Recent Updates (2025-09-13)

### Migration to hanzo/ui v4
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