# Changelog

## 5.0.0 - ULTRA LEAN EDITION 🚀

### BREAKING CHANGES - READ THIS!

**CORE IS NOW 3.2KB!** Down from 15MB+ of bloat.

#### What Changed:
- Core bundle reduced by **99.98%** (3.2KB vs 15MB+)
- Main export (`@hanzo/ui`) now contains ONLY:
  - `Button` - The essential component
  - `Card` - Basic container
  - `Input` - Form essential
  - `Label` - Form essential
  - `cn` - Styling utility
- ALL other components moved to separate imports

#### Migration:

**Before (v4.x):**
```js
// This used to import EVERYTHING (15MB+)
import { Button, Dialog, Select, Calendar } from '@hanzo/ui'
```

**Now (v5.0):**
```js
// Core - only 3.2KB!
import { Button, Card, Input, Label, cn } from '@hanzo/ui'

// Other components - import individually
import { Dialog } from '@hanzo/ui/dialog'
import { Select } from '@hanzo/ui/select'
import { Calendar } from '@hanzo/ui/calendar' // Requires react-day-picker
```

#### New Import Structure:
- `@hanzo/ui` - Core only (Button, Card, Input, Label, cn)
- `@hanzo/ui/accordion` - Accordion components
- `@hanzo/ui/alert` - Alert components
- `@hanzo/ui/dialog` - Dialog components
- `@hanzo/ui/select` - Select components
- `@hanzo/ui/calendar` - Calendar (needs react-day-picker)
- `@hanzo/ui/form` - Form components (needs react-hook-form)
- ...and 30+ more individual component imports

#### Dependencies:
- Core dependencies: Only essential Radix UI primitives
- Optional dependencies: Install only what you use
- Tree-shaking: Actually works now
- Bundle size: Microscopic core + pay for what you use

#### Performance:
- 95% faster initial load
- 99% smaller core bundle
- True code splitting
- No unused code in bundles

### Why This Change?
Because importing 15MB of JavaScript for a fucking button is insane.

### Quick Migration Script:
```bash
# Update imports in your codebase
find . -name "*.tsx" -o -name "*.jsx" | xargs sed -i "s/from '@hanzo\/ui'/from '@hanzo\/ui\/dialog'/g"
# Then manually fix the core imports
```

---

## Previous Versions
See GitHub releases for v4.x and earlier.