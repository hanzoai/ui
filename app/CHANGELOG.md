# Changelog

All notable changes to the Hanzo UI project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-11-04

### Added

#### Page Builder
- **Visual Page Builder** (`/builder`) - Drag-and-drop interface for assembling pages from blocks
  - Filterable block library with 1/4 scale previews
  - Drag-to-reorder blocks in canvas
  - Viewport controls (Desktop/Tablet/Mobile) for responsive preview
  - Export to React TSX code
  - Copy code to clipboard
  - Download as .tsx file
  - Deploy with Hanzo integration
  - Real-time block rendering with dynamic imports
  - Error handling and loading states for blocks

#### Syntax Highlighting
- **Shiki Integration** - Build-time syntax highlighting via Fumadocs
  - GitHub Light/Dark themes for automatic light/dark mode support
  - Multi-color syntax highlighting for all code blocks
  - Copy-to-clipboard button on code blocks
  - Line numbers and line highlighting support
  - File name labels via meta strings
  - Zero client-side JavaScript (all highlighting is static HTML)

#### New Blocks
- **Newsletter Blocks** (5 variants)
  - `newsletter-01` - Simple newsletter signup
  - `newsletter-02` - Newsletter with description
  - `newsletter-03` - Newsletter with image
  - `newsletter-04` - Newsletter with testimonial
  - `newsletter-05` - Full-width newsletter section
- **Blog Cards** - Modern blog post card layout
- **Photo Grid** - Responsive photo gallery grid
- **Showcase Blocks**
  - `showcase-marketing-01` - Marketing website showcase
  - `showcase-ecommerce-01` - E-commerce site showcase
  - `showcase-app-ui-01` - App UI showcase

#### New AI Components
- **AI Voice Settings** - Voice configuration interface for AI assistants
  - Voice model selection
  - Speed, pitch, and volume controls
  - Preview functionality
  - Settings persistence

#### New Documentation
- **AI Components Documentation**
  - AI Actions guide
  - AI Agents guide
  - AI Assistant guide
  - AI Code editor guide
  - AI Models selector guide
  - AI Vision guide
  - AI Voice Settings guide
  - AI Voice guide
- **Blocks Documentation**
  - Newsletter blocks guide with all variants

### Fixed

- **Block Display Component** - Fixed registry access pattern for proper block rendering
  - Now uses `getBlock()` function with style parameter
  - Proper fallback to `BlockWrapper` for blocks
  - Correct handling of component vs block types
- **Stub Components** - Fixed three blocks with missing `@hanzo/ui/billing` dependency
  - `invoice-manager-01` - Added placeholder with installation instructions
  - `payment-settings-01` - Added placeholder with installation instructions
  - `subscription-portal-01` - Added placeholder with installation instructions
- **Dynamic Block Loading** - Replaced iframe-based previews with direct component rendering
  - Eliminates 404 errors in block previews
  - Better error handling and loading states
  - Proper scaling with transform CSS

### Changed

- **Page Builder Layout**
  - Reduced sidebar width from w-80 to w-64 for more canvas space
  - Removed right sidebar to maximize preview area
  - Changed block preview scale from 1/2 to 1/4 in sidebar
  - Removed gaps between stacked blocks using border-b pattern
  - Added viewport width controls for responsive testing

### Technical Improvements

- **MDX Configuration** - Enhanced with Shiki rehype plugin options
- **MDX Components** - Integrated Fumadocs CodeBlock wrapper for code blocks
- **Build Process** - Improved registry build with proper error handling
- **Type Safety** - Updated component props to use React.ComponentPropsWithoutRef

## [0.1.0] - 2025-10-05

### Initial Release

- Base component library with 150+ components
- Two theme variants (default, new-york)
- 24+ viewport-sized blocks
- Documentation site with MDX support
- CLI for component installation
- External registry support
- Responsive design system
- Dark mode support

---

[0.2.0]: https://github.com/hanzoai/ui/releases/tag/v0.2.0
[0.1.0]: https://github.com/hanzoai/ui/releases/tag/v0.1.0
