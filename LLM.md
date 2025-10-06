# Shadcn/UI Mega-Crawl Analysis Report

**Date**: 2025-10-05  
**Analyzed Directory**: ~/work/shadcn/shadcn-complete-library  
**Target Directory**: /Users/z/work/hanzo/ui/app/registry/default/ui/

## Executive Summary

After analyzing the shadcn-complete-library mega-crawl, I found **69,467 total TypeScript/TSX files** including **14,004 component files** in the hanzo-components directory. The Hanzo UI library currently has **63 stub components** showing "Component coming soon" that can be replaced with production-ready implementations from the shadcn library.

## Key Findings

### 1. Available Resources

#### Shadcn Complete Library Structure
- **Total TSX Files**: 69,467
- **Hanzo-branded Components**: 14,004 files in `/hanzo-components/components/`
- **Code Samples**: Thousands of component variations in `/code-samples/`
- **Blocks**: Complex composed layouts in `/code-samples/blocks/` and `/hanzo-components/blocks/`
- **Documentation**: Comprehensive recommendations in `HANZO_UI_RECOMMENDATIONS.md`

#### Component Categories Found
1. **Core UI Components** (50+ types):
   - accordion, alert, alert-dialog, avatar, badge, breadcrumb
   - button, calendar, card, carousel, checkbox, collapsible
   - combobox, command, context-menu, data-table, date-picker
   - dialog, drawer, dropdown-menu, form, hover-card
   - input, input-otp, label, menubar, navigation-menu
   - pagination, popover, progress, radio-group, resizable
   - scroll-area, select, separator, sheet, sidebar
   - skeleton, slider, sonner, switch, table
   - tabs, textarea, toast, toggle, toggle-group, tooltip

2. **Advanced Components** (30+ specialized):
   - 3D components (button, card, carousel, grid, marquee, model-viewer)
   - AI components (assistant, chat, code, playground, tools, vision, voice)
   - Navigation bars (15+ variations)
   - Data visualization (charts, graphs)
   - Rich editors (minimal-tiptap, code-editor)
   - Media components (image-crop, image-zoom, video-player)

3. **Blocks & Patterns**:
   - Dashboard layouts
   - Authentication forms
   - E-commerce interfaces
   - Admin panels
   - Landing pages

### 2. Hanzo UI Current State

#### Stub Components Needing Implementation (63 total)

**Navigation Components** (15 stubs):
- underline-navigation-bar
- two-tier-navigation-bar
- team-switcher-navigation-bar
- status-dashboard-navigation-bar
- simple-navigation-bar
- search-and-toggle-navigation-bar
- icon-navigation-bar
- e-commerce-navigation-bar
- dashboard-navigation-bar
- context-switcher-navigation-bar
- communication-navigation-bar
- collaboration-navigation-bar
- centered-logo-navigation-bar
- breadcrumb-navigation-bar
- breadcrumb-and-filters-navigation-bar
- advanced-navigation-bar
- app-switcher-navigation-bar
- ai-model-selector-navigation-bar

**UI Components** (45 stubs):
- status
- qr-code
- comparison
- relative-time
- mini-calendar
- pixel-image
- motion-highlight
- magnetic
- tags
- pill
- avatar-group
- marquee
- dialog-stack
- cursor
- banner
- image-zoom
- image-crop
- minimal-tiptap
- editor
- dropzone
- combobox
- color-picker
- choicebox
- ticker
- credit-card
- message-dock
- menu-dock
- limelight-nav
- safari
- iphone-15-pro

#### Already Implemented (examples):
- ✅ accordion - Full Radix UI implementation
- ✅ calendar - Complete with react-day-picker
- ✅ 3d-button - Advanced 3D button with tilt, glow, presets (347 lines)
- ✅ button - Standard button with variants
- ✅ Many other core components

### 3. Migration Strategy

#### Priority 1: Essential Missing Components

**1. Combobox** (Currently stub)
- Source: `/hanzo-components/components/` (search for combobox patterns)
- Features needed: Search, filtering, keyboard navigation
- Dependencies: cmdk, @radix-ui/react-popover

**2. Color Picker** (Currently stub)
- Multiple implementations available in code-samples
- Features: RGB, HSL, HEX support, alpha channel
- Dependencies: react-colorful or custom implementation

**3. Dropzone** (Currently stub)
- File upload with drag-and-drop
- Features: Multiple files, preview, validation
- Dependencies: react-dropzone

**4. Rich Text Editors** (2 stubs)
- minimal-tiptap: Lightweight editor
- editor: Full-featured editor
- Dependencies: @tiptap/react, @tiptap/starter-kit

**5. Image Components** (2 stubs)
- image-crop: Cropping functionality
- image-zoom: Zoom/pan functionality
- Dependencies: react-image-crop, react-medium-image-zoom

#### Priority 2: Navigation Components (15 stubs)

All navigation bar variants can be implemented from blocks:
- Source: `/hanzo-components/blocks/blocks-component-*.tsx`
- Pattern: Extract from sidebar/navigation blocks
- Features: Responsive, dropdown menus, search integration

#### Priority 3: Specialized Components

**Data Visualization**:
- Advanced charts already have 90+ data point examples
- Multiple recharts configurations available

**3D/Animation**:
- animated-* components
- cursor, magnetic effects
- motion-highlight

**Mobile Components**:
- safari (iOS Safari frame)
- iphone-15-pro (Device mockup)

### 4. File Path Mappings

#### Source to Target Mapping

**For Combobox**:
```
Source: ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks/blocks-component-1758189296560-76.tsx
Target: /Users/z/work/hanzo/ui/app/registry/default/ui/combobox.tsx
Note: Extract combobox pattern, adapt imports
```

**For Data Tables**:
```
Source: ~/work/shadcn/shadcn-complete-library/code-samples/components/components-1758190154697-1.tsx
Target: /Users/z/work/hanzo/ui/app/registry/default/ui/data-table.tsx
Features: TanStack Table v8, CRUD, filtering, sorting
```

**For Calendar Variants**:
```
Source: ~/work/shadcn/shadcn-complete-library/code-samples/blocks/blocks-1758189296573-124.tsx
Target: /Users/z/work/hanzo/ui/app/registry/default/ui/mini-calendar.tsx
Features: Mobile drawer, responsive sizing, date range
```

**For Navigation Bars**:
```
Source: ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks/blocks-component-1758189280785-*.tsx
Target: /Users/z/work/hanzo/ui/app/registry/default/ui/navigation/*.tsx
Pattern: Multiple sidebar variations with navigation
```

### 5. Required Dependencies Analysis

#### Already in Package.json (Confirmed)
```json
{
  "@radix-ui/react-*": "latest",
  "react-day-picker": "^8.0.0",
  "date-fns": "^2.0.0",
  "lucide-react": "latest"
}
```

#### Need to Add
```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.0.0",
    "embla-carousel-react": "^8.0.0",
    "recharts": "^2.5.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "@hookform/resolvers": "^3.0.0",
    "vaul": "^0.9.0",
    "sonner": "^1.0.0",
    "cmdk": "^0.2.0",
    "input-otp": "latest",
    "@tiptap/react": "^2.0.0",
    "@tiptap/starter-kit": "^2.0.0",
    "react-dropzone": "^14.0.0",
    "react-colorful": "^5.6.1",
    "react-image-crop": "^11.0.0"
  }
}
```

### 6. Implementation Checklist

#### Immediate Actions

1. **Analyze Top Priority Components**:
   - [ ] combobox - Extract from blocks-component-1758189296560-76.tsx
   - [ ] color-picker - Find best implementation in code-samples
   - [ ] dropzone - File upload component
   - [ ] minimal-tiptap - Rich text editor

2. **Navigation Components** (Batch process):
   - [ ] Extract navigation patterns from blocks
   - [ ] Create consistent API across all variants
   - [ ] Implement responsive behavior
   - [ ] Add keyboard navigation

3. **Utility Components**:
   - [ ] status - Status indicators
   - [ ] tags - Tag input/display
   - [ ] pill - Pill badges
   - [ ] avatar-group - Stacked avatars

4. **Advanced Features**:
   - [ ] dialog-stack - Multiple dialogs
   - [ ] marquee - Scrolling text
   - [ ] ticker - Stock ticker style
   - [ ] cursor - Custom cursor effects

#### Component Migration Process

For each stub component:

1. **Research** (5-10 min):
   - Find relevant implementations in shadcn-complete-library
   - Check hanzo-components for @hanzo/ui versions
   - Review code-samples for variations
   - Read HANZO_UI_RECOMMENDATIONS.md for insights

2. **Extract** (15-30 min):
   - Copy best implementation
   - Adapt imports to match Hanzo UI structure
   - Ensure "use client" directive if needed
   - Update import paths (@/lib/utils → @/lib/utils)

3. **Enhance** (10-20 min):
   - Add TypeScript types
   - Implement accessibility features
   - Add keyboard navigation
   - Include dark mode support

4. **Test** (10-15 min):
   - Create example in registry
   - Test responsive behavior
   - Verify accessibility
   - Check performance

5. **Document** (5-10 min):
   - Add JSDoc comments
   - Update registry configuration
   - Create usage examples

**Estimated Time per Component**: 45-85 minutes  
**Total for 63 stubs**: ~40-90 hours

### 7. Recommendations

#### Immediate Priorities

1. **Start with High-Value Components**:
   - combobox (widely used)
   - dropzone (file uploads)
   - color-picker (design tools)
   - Rich editors (content creation)

2. **Batch Process Navigation**:
   - All 15+ navigation variants follow similar patterns
   - Create base navigation component
   - Extend for each variant
   - ~8-12 hours for all navigation components

3. **Leverage Existing Patterns**:
   - The 3d-button shows the quality standard (347 lines, full-featured)
   - Follow same pattern: variants, presets, TypeScript, accessibility
   - Maintain consistency across all components

#### Quality Standards

Each component should have:
- ✅ Full TypeScript definitions
- ✅ ARIA attributes for accessibility
- ✅ Keyboard navigation support
- ✅ Dark mode compatibility
- ✅ Responsive design
- ✅ forwardRef for ref forwarding
- ✅ Compound component pattern where appropriate
- ✅ Variant system using cva
- ✅ Preset configurations
- ✅ Loading states where applicable

#### Architecture Alignment

Follow existing Hanzo UI patterns:
```typescript
// Component structure
"use client"
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const componentVariants = cva(/* base styles */, {
  variants: {/* variant definitions */},
  defaultVariants: {/* defaults */}
})

const Component = React.forwardRef<HTMLElement, Props>(
  ({ className, variant, ...props }, ref) => {
    return <element className={cn(componentVariants({ variant }), className)} {...props} />
  }
)
Component.displayName = "Component"

export { Component, componentVariants, type ComponentProps }
```

### 8. Next Steps

#### Week 1-2: Core Components
1. Implement combobox, dropzone, color-picker
2. Add minimal-tiptap and editor
3. Complete image-crop and image-zoom
4. Test and document

#### Week 3-4: Navigation & Layout
1. Create base navigation component
2. Implement all navigation variants
3. Add safari and iphone-15-pro mockups
4. Create comprehensive navigation documentation

#### Week 5-6: Specialized Components
1. Implement animation components (marquee, cursor, magnetic)
2. Add utility components (status, tags, pill, ticker)
3. Create dialog-stack and message-dock
4. Complete all remaining stubs

#### Week 7: Polish & Documentation
1. Comprehensive testing
2. Performance optimization
3. Documentation site updates
4. Create migration guide from stubs

## Conclusion

The shadcn-complete-library provides an **exceptional resource** with 14,000+ hanzo-branded component files ready to integrate. The current 63 stub components can be systematically replaced with production-ready implementations, following the high-quality pattern established by existing components like the 3d-button.

**Key Success Factors**:
1. Systematic approach to component migration
2. Maintain consistency with existing architecture
3. Prioritize high-value components first
4. Batch similar components (navigation)
5. Comprehensive testing and documentation

**Estimated Completion Time**: 6-8 weeks for all 63 components with proper testing and documentation.

**Immediate Action**: Start with combobox, dropzone, and color-picker to establish workflow and validate the migration process.

---

## Appendix: Detailed File Mappings

### Stub Components with Source Files

#### High Priority Components

| Component | Status | Source File | Lines | Features |
|-----------|--------|-------------|-------|----------|
| combobox | STUB | blocks-component-1758189296560-76.tsx | TBD | Search, filter, keyboard nav |
| color-picker | STUB | Find in code-samples | TBD | RGB, HSL, HEX, alpha |
| dropzone | STUB | Find in code-samples | TBD | Drag-drop, multi-file, preview |
| minimal-tiptap | STUB | Find in code-samples | TBD | Lightweight rich text |
| editor | STUB | Find in code-samples | TBD | Full-featured editor |
| image-crop | STUB | Find in code-samples | TBD | Cropping tool |
| image-zoom | STUB | Find in code-samples | TBD | Zoom/pan |

#### Navigation Components

| Component | Status | Source Pattern | Estimated Lines |
|-----------|--------|----------------|-----------------|
| advanced-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| ai-model-selector-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| app-switcher-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| breadcrumb-and-filters-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| breadcrumb-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| centered-logo-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| collaboration-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| communication-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| context-switcher-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| dashboard-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| e-commerce-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| icon-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| search-and-toggle-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| simple-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| status-dashboard-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| team-switcher-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| two-tier-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |
| underline-navigation-bar | STUB | blocks-1758189280785-*.tsx | 100-200 |

#### Utility Components

| Component | Status | Source Location | Features |
|-----------|--------|-----------------|----------|
| status | STUB | Find in code-samples | Status badges/indicators |
| tags | STUB | Find in code-samples | Tag input, display |
| pill | STUB | Find in code-samples | Pill-style badges |
| avatar-group | STUB | Find in code-samples | Stacked avatars |
| marquee | STUB | Find in code-samples | Scrolling text |
| ticker | STUB | Find in code-samples | Stock ticker |
| banner | STUB | Find in code-samples | Announcement banner |

#### Specialized Components

| Component | Status | Source Location | Features |
|-----------|--------|-----------------|----------|
| dialog-stack | STUB | Find in code-samples | Multiple dialogs |
| cursor | STUB | Find in code-samples | Custom cursor |
| magnetic | STUB | Find in code-samples | Magnetic effect |
| motion-highlight | STUB | Find in code-samples | Motion highlight |
| pixel-image | STUB | Find in code-samples | Pixelated images |
| qr-code | STUB | Find in code-samples | QR code generator |
| comparison | STUB | Find in code-samples | Before/after compare |
| relative-time | STUB | Find in code-samples | Relative time display |
| mini-calendar | STUB | blocks-1758189296573-124.tsx | Mobile calendar |
| credit-card | STUB | Find in code-samples | Credit card input |
| message-dock | STUB | Find in code-samples | Message dock |
| menu-dock | STUB | Find in code-samples | Menu dock |
| limelight-nav | STUB | Find in code-samples | Spotlight nav |
| safari | STUB | Find in code-samples | Safari mockup |
| iphone-15-pro | STUB | Find in code-samples | iPhone mockup |
| choicebox | STUB | Find in code-samples | Choice selection |

### Already Implemented Components (Examples)

| Component | Status | Lines | Key Features |
|-----------|--------|-------|--------------|
| 3d-button | ✅ DONE | 347 | Tilt, glow, 8 variants, presets |
| accordion | ✅ DONE | 58 | Radix UI, animations |
| calendar | ✅ DONE | 67 | react-day-picker, responsive |
| button | ✅ DONE | ~100 | Multiple variants |
| card | ✅ DONE | ~80 | Compound component |

### Search Commands for Finding Components

```bash
# Find combobox implementations
find ~/work/shadcn/shadcn-complete-library -name "*.tsx" -exec grep -l "combobox\|Combobox" {} \; | head -20

# Find color picker implementations
find ~/work/shadcn/shadcn-complete-library -name "*.tsx" -exec grep -l "color.*picker\|ColorPicker" {} \; | head -20

# Find dropzone implementations
find ~/work/shadcn/shadcn-complete-library -name "*.tsx" -exec grep -l "dropzone\|Dropzone\|file.*upload" {} \; | head -20

# Find tiptap/editor implementations
find ~/work/shadcn/shadcn-complete-library -name "*.tsx" -exec grep -l "tiptap\|TipTap\|Editor" {} \; | head -20

# Find navigation patterns
find ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks -name "blocks-component-1758189280785-*.tsx"

# Find specific component by name
find ~/work/shadcn/shadcn-complete-library -name "*.tsx" -exec grep -l "ComponentName" {} \;
```

### Dependencies Audit

#### Currently Installed (from package.json)
```json
{
  "@radix-ui/react-accordion": "^1.2.2",
  "@radix-ui/react-alert-dialog": "^1.1.4",
  "@radix-ui/react-avatar": "^1.1.2",
  "@radix-ui/react-checkbox": "^1.1.3",
  "@radix-ui/react-collapsible": "^1.1.2",
  "@radix-ui/react-dialog": "^1.1.4",
  "@radix-ui/react-dropdown-menu": "^2.1.4",
  "@radix-ui/react-hover-card": "^1.1.4",
  "@radix-ui/react-label": "^2.1.1",
  "@radix-ui/react-menubar": "^1.1.4",
  "@radix-ui/react-navigation-menu": "^1.2.3",
  "@radix-ui/react-popover": "^1.1.4",
  "@radix-ui/react-progress": "^1.1.1",
  "@radix-ui/react-radio-group": "^1.2.2",
  "@radix-ui/react-scroll-area": "^1.2.2",
  "@radix-ui/react-select": "^2.1.4",
  "@radix-ui/react-separator": "^1.1.1",
  "@radix-ui/react-slider": "^1.2.2",
  "@radix-ui/react-switch": "^1.1.2",
  "@radix-ui/react-tabs": "^1.1.2",
  "@radix-ui/react-toast": "^1.2.4",
  "@radix-ui/react-toggle": "^1.1.1",
  "@radix-ui/react-toggle-group": "^1.1.1",
  "@radix-ui/react-tooltip": "^1.1.6",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^2.30.0",
  "lucide-react": "latest",
  "react-day-picker": "^8.10.1",
  "tailwind-merge": "^2.5.5",
  "tailwindcss-animate": "^1.0.7"
}
```

#### Missing Dependencies (Need to Add)
```json
{
  "@tanstack/react-table": "^8.20.5",
  "embla-carousel-react": "^8.5.2",
  "recharts": "^2.15.0",
  "react-hook-form": "^7.54.2",
  "zod": "^3.24.1",
  "@hookform/resolvers": "^3.9.1",
  "vaul": "^0.9.9",
  "sonner": "^1.7.2",
  "cmdk": "^0.2.1",
  "input-otp": "^1.4.1",
  "@tiptap/react": "^2.10.5",
  "@tiptap/starter-kit": "^2.10.5",
  "@tiptap/extension-placeholder": "^2.10.5",
  "react-dropzone": "^14.3.5",
  "react-colorful": "^5.6.1",
  "react-image-crop": "^11.0.7",
  "react-medium-image-zoom": "^5.2.14",
  "qrcode.react": "^4.1.0",
  "framer-motion": "^11.15.0"
}
```

### Installation Command

```bash
cd /Users/z/work/hanzo/ui

# Install all missing dependencies
pnpm add @tanstack/react-table embla-carousel-react recharts \
  react-hook-form zod @hookform/resolvers vaul sonner cmdk \
  input-otp @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-placeholder react-dropzone react-colorful \
  react-image-crop react-medium-image-zoom qrcode.react \
  framer-motion
```

---

## Quick Start Guide

### To Begin Component Migration

1. **Set up environment**:
   ```bash
   cd /Users/z/work/hanzo/ui
   pnpm install
   ```

2. **Install missing dependencies**:
   ```bash
   pnpm add @tanstack/react-table embla-carousel-react recharts react-hook-form zod @hookform/resolvers vaul sonner cmdk input-otp @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder react-dropzone react-colorful react-image-crop react-medium-image-zoom qrcode.react framer-motion
   ```

3. **Start with combobox** (most requested):
   ```bash
   # Find combobox implementation
   grep -r "combobox" ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks/ -l | head -5
   
   # Copy and adapt to:
   # /Users/z/work/hanzo/ui/app/registry/default/ui/combobox.tsx
   ```

4. **Test the component**:
   ```bash
   cd /Users/z/work/hanzo/ui
   pnpm www:dev  # Port 3333
   # Or
   pnpm v4:dev   # Port 4000
   ```

5. **Repeat for each component** following the checklist above.

---

## TailwindUI Component Analysis Update
**Date**: 2025-10-05

### Additional Resources Analyzed

#### TailwindUI Directories
1. **/Users/z/work/shadcn/tailwindui-components**
   - Limited: 7 TSX files (hanzo-blocks only)
   - Mostly HTML templates
   - Not primary source

2. **/Users/z/work/shadcn/tailwindui-comprehensive**
   - Empty directories (application, marketing, ecommerce)
   - Only README exists
   - Not useful for migration

3. **/Users/z/work/shadcn/tailwindui-extracted**
   - 22 TSX template files
   - Located in: `/hanzo-ui/templates/templates-html-*.tsx`
   - Full page templates, not individual components

**Verdict**: TailwindUI directories do NOT contain the device mockup, color picker, or other advanced components we need. Focus on npm packages instead.

### External Component Libraries (NPM)

#### Device Mockups
**Package**: `react-device-mockup` v1.0.0
- **Repository**: https://github.com/jung-youngmin/react-device-mockup
- **Use Case**: iPhone and Safari browser frames
- **Status**: Active package (2024)
- **Installation**: `pnpm add react-device-mockup`

**Alternative Approach**: Build custom mockups using CSS
- iPhone 15 Pro frame with CSS borders and rounded corners
- Safari browser chrome with toolbar
- Responsive scaling

#### Color Picker
**Package**: `@rc-component/color-picker` v3.0.2
- **Maintained by**: ant-design team
- **Features**: RGB, HSL, HEX, alpha channel
- **Status**: Actively maintained (2025)
- **Installation**: `pnpm add @rc-component/color-picker`

**Alternative**: `react-colorful` v5.6.1
- Lightweight (2.5kb gzipped)
- No dependencies
- All color formats

#### Dropzone
**Package**: `react-dropzone` v14.3.8
- **Standard**: Industry standard file upload
- **Features**: Drag-drop, multiple files, validation
- **Installation**: Already in recommendations

#### Image Crop/Zoom
**Package**: `react-image-crop` v11.0.10
- **Maintained**: Active development (2025)
- **Features**: Responsive, aspect ratio, pixel/percent coords
- **Installation**: Already in recommendations

**Package**: `react-medium-image-zoom` v5.2.14
- **Features**: Click-to-zoom, pan, responsive
- **Installation**: Already in recommendations

### Recommended NPM Packages for Stub Components

#### Priority 1: Essential Missing Features

| Component | NPM Package | Version | Size | Status |
|-----------|-------------|---------|------|--------|
| iphone-15-pro | react-device-mockup | 1.0.0 | Small | Ready |
| safari | react-device-mockup | 1.0.0 | Small | Ready |
| color-picker | @rc-component/color-picker | 3.0.2 | Medium | Ready |
| dropzone | react-dropzone | 14.3.8 | Small | Ready |
| image-crop | react-image-crop | 11.0.7 | Medium | Ready |
| image-zoom | react-medium-image-zoom | 5.2.14 | Small | Ready |

#### Priority 2: Navigation Components

All 15+ navigation bars should be extracted from shadcn-complete-library blocks, NOT from TailwindUI (which has no usable components).

**Source Pattern**:
```bash
~/work/shadcn/shadcn-complete-library/hanzo-components/blocks/blocks-component-*.tsx
```

Look for:
- Sidebar layouts with navigation
- Header components with menus
- Breadcrumb implementations
- Search integration patterns

#### Priority 3: Utility & Specialized Components

| Component | Approach | Source |
|-----------|----------|--------|
| qr-code | Use `qrcode.react` v4.1.0 | NPM package |
| marquee | Custom implementation | shadcn-complete-library |
| ticker | Custom implementation | shadcn-complete-library |
| cursor | Custom implementation | shadcn-complete-library |
| magnetic | Custom implementation | shadcn-complete-library |
| status | Custom badges | Build from scratch |
| tags | Tag input | Build from scratch |
| pill | Badge variant | Build from scratch |
| avatar-group | Stack avatars | Build from scratch |

### Implementation Strategy Update

#### Phase 1: NPM-Based Components (Week 1)
1. Install device mockup package
2. Create `iphone-15-pro.tsx` wrapper
3. Create `safari.tsx` wrapper
4. Install and wrap color picker
5. Integrate dropzone, image-crop, image-zoom

**Time Estimate**: 1-2 days (using existing packages)

#### Phase 2: Navigation Extraction (Week 2)
1. Map all 15+ navigation patterns from blocks
2. Extract base navigation component
3. Create variants for each type
4. Test responsive behavior

**Time Estimate**: 3-5 days

#### Phase 3: Custom Components (Week 3-4)
1. Build utility components (status, tags, pill)
2. Extract animation components (marquee, ticker, cursor)
3. Implement specialized components
4. Create documentation

**Time Estimate**: 1-2 weeks

### Updated Dependencies List

```json
{
  "dependencies": {
    // Core (already installed)
    "@radix-ui/react-*": "latest",
    "react-day-picker": "^8.10.1",
    "date-fns": "^2.30.0",
    "lucide-react": "latest",

    // Already recommended
    "@tanstack/react-table": "^8.20.5",
    "embla-carousel-react": "^8.5.2",
    "recharts": "^2.15.0",
    "react-hook-form": "^7.54.2",
    "zod": "^3.24.1",
    "@hookform/resolvers": "^3.9.1",
    "vaul": "^0.9.9",
    "sonner": "^1.7.2",
    "cmdk": "^0.2.1",
    "input-otp": "^1.4.1",
    "@tiptap/react": "^2.10.5",
    "@tiptap/starter-kit": "^2.10.5",
    "@tiptap/extension-placeholder": "^2.10.5",
    "react-dropzone": "^14.3.8",
    "react-colorful": "^5.6.1",
    "react-image-crop": "^11.0.7",
    "react-medium-image-zoom": "^5.2.14",
    "qrcode.react": "^4.1.0",
    "framer-motion": "^11.15.0",

    // NEW: Device mockups
    "react-device-mockup": "^1.0.0",

    // NEW: Enhanced color picker (optional, choose one)
    "@rc-component/color-picker": "^3.0.2"
  }
}
```

### Quick Win Strategy

#### Week 1: NPM Package Integration
**Day 1-2**: Device Mockups
```bash
pnpm add react-device-mockup

# Create wrappers:
# - iphone-15-pro.tsx (wrapper around DeviceMockup)
# - safari.tsx (browser chrome wrapper)
```

**Day 3**: Color Picker
```bash
pnpm add @rc-component/color-picker
# Or: pnpm add react-colorful

# Create: color-picker.tsx
```

**Day 4**: File Upload & Image Tools
```bash
# Already in recommendations, just implement wrappers
# - dropzone.tsx
# - image-crop.tsx
# - image-zoom.tsx
```

**Day 5**: Testing & Documentation
- Test all new components
- Create examples
- Update registry

**Result**: 6 stub components completed in 5 days using NPM packages!

### Key Findings Summary

✅ **Good News**:
1. **Device mockups available** via `react-device-mockup` package
2. **Color picker available** via `@rc-component/color-picker` or `react-colorful`
3. **All form components available** via standard React packages
4. **Navigation components exist** in shadcn-complete-library blocks

❌ **What's NOT Useful**:
1. TailwindUI directories are mostly empty or HTML-only
2. No pre-built device mockups in TailwindUI
3. Limited TypeScript/React components in TailwindUI extraction

📊 **Revised Approach**:
1. **Use NPM packages** for complex components (mockups, pickers, upload)
2. **Extract from shadcn-complete-library** for navigation and layouts
3. **Build custom** for simple utilities (status, tags, pills)

### File Path Reference

#### Components That Can Use NPM Packages
```
/Users/z/work/hanzo/ui/app/registry/default/ui/iphone-15-pro.tsx
  → Wrapper for react-device-mockup (iPhone variant)

/Users/z/work/hanzo/ui/app/registry/default/ui/safari.tsx
  → Wrapper for react-device-mockup (Browser variant)

/Users/z/work/hanzo/ui/app/registry/default/ui/color-picker.tsx
  → Wrapper for @rc-component/color-picker

/Users/z/work/hanzo/ui/app/registry/default/ui/dropzone.tsx
  → Wrapper for react-dropzone

/Users/z/work/hanzo/ui/app/registry/default/ui/image-crop.tsx
  → Wrapper for react-image-crop

/Users/z/work/hanzo/ui/app/registry/default/ui/image-zoom.tsx
  → Wrapper for react-medium-image-zoom

/Users/z/work/hanzo/ui/app/registry/default/ui/qr-code.tsx
  → Wrapper for qrcode.react
```

#### Navigation Components (Extract from shadcn-complete-library)
```
Source: ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks/

Search commands:
find ~/work/shadcn/shadcn-complete-library/hanzo-components/blocks \
  -name "*.tsx" -exec grep -l "navigation\|navbar\|header" {} \; | head -20

Then extract to:
/Users/z/work/hanzo/ui/app/registry/default/ui/navigation/*.tsx
```

### Next Immediate Actions

1. **Install NPM packages**:
```bash
cd /Users/z/work/hanzo/ui
pnpm add react-device-mockup @rc-component/color-picker
```

2. **Create device mockup components** (2 hours):
- iphone-15-pro.tsx
- safari.tsx

3. **Create color picker** (1 hour):
- color-picker.tsx

4. **Create file upload components** (3 hours):
- dropzone.tsx
- image-crop.tsx
- image-zoom.tsx

5. **Extract navigation components** (1-2 days):
- Find best examples in shadcn-complete-library
- Create base navigation component
- Implement all 15+ variants

**Total Time for Quick Wins**: 1 week to complete 20+ stub components!

