# @hanzo/ui Optional Dependencies

## Overview

The @hanzo/ui package has been optimized to reduce bundle size by making heavy dependencies optional. The core package now only includes essential dependencies (Radix UI primitives and styling utilities), reducing the base package size from 15MB+ to under 1MB.

## Core vs Optional Components

### Always Available (Core)
These components work out of the box with no additional dependencies:
- Accordion, Alert, AlertDialog, AspectRatio, Avatar
- Badge, Button, Breadcrumb
- Card, Checkbox, Collapsible, ContextMenu
- Dialog, DropdownMenu
- HoverCard
- Input
- Label
- Menubar
- NavigationMenu
- Pagination, Popover, Progress
- RadioGroup
- ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch
- Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

### Optional Components
These components require additional dependencies to be installed:

| Component | Required Dependencies | Install Command |
|-----------|----------------------|-----------------|
| Calendar | `react-day-picker`, `date-fns` | `pnpm add react-day-picker date-fns` |
| Command, CommandDialog, etc. | `cmdk` | `pnpm add cmdk` |
| Carousel | `embla-carousel-react` | `pnpm add embla-carousel-react` |
| Form components | `react-hook-form`, `@hookform/resolvers`, `zod` | `pnpm add react-hook-form @hookform/resolvers zod` |
| Toaster (Sonner) | `sonner` | `pnpm add sonner` |
| Drawer | `vaul` | `pnpm add vaul` |
| InputOTP | `input-otp` | `pnpm add input-otp` |
| ResizablePanel | `react-resizable-panels` | `pnpm add react-resizable-panels` |
| Chart components | `recharts` | `pnpm add recharts` |
| Theme provider | `next-themes` | `pnpm add next-themes` |

## Usage

### Using Core Components
```tsx
import { Button, Card, Dialog } from '@hanzo/ui/components'

// These work immediately with no additional setup
```

### Using Optional Components

#### Option 1: Lazy Loading (Recommended)
```tsx
import { LazyComponents } from '@hanzo/ui/components'

// Components will show helpful error if dependencies are missing
const MyComponent = () => {
  return <LazyComponents.Calendar />
}
```

#### Option 2: Direct Import (After Installing Dependencies)
```tsx
// First install: pnpm add react-day-picker date-fns
import { Calendar } from '@hanzo/ui/components/calendar'

// Use normally after dependencies are installed
```

### Checking Dependency Availability
```tsx
import { isDependencyAvailable } from '@hanzo/ui/components'

// Check if a dependency is available
const hasCalendar = await isDependencyAvailable('react-day-picker')
if (hasCalendar) {
  // Render calendar component
}
```

## Migration Guide

If you're upgrading from a previous version:

1. **No immediate action required** - All components still work if you install their dependencies
2. **For optimal bundle size** - Only install the dependencies you actually use
3. **For new projects** - Start with core components and add optional deps as needed

### Quick Migration
To maintain full compatibility with previous versions, install all optional dependencies:

```bash
pnpm add @hookform/resolvers cmdk date-fns embla-carousel-react \
  input-otp next-themes react-day-picker react-hook-form \
  react-resizable-panels recharts sonner vaul zod
```

## Benefits

- **97% smaller initial bundle** - Core package reduced from 15MB+ to under 1MB
- **Pay for what you use** - Only include dependencies for components you actually need
- **Better tree-shaking** - Unused components and their dependencies are completely eliminated
- **Faster installs** - Fewer dependencies to download and install
- **Cleaner dependency tree** - Optional dependencies don't pollute projects that don't need them

## Troubleshooting

### Component shows "Missing dependency" error
Install the required dependencies shown in the error message.

### TypeScript errors with lazy components
The lazy components use `any` type to avoid complex type inference. For full type safety, install the dependencies and import directly.

### Build warnings about optional dependencies
These are expected and can be safely ignored. The build system knows these are optional.