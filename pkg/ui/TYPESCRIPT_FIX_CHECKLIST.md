# TypeScript Fix Checklist - @hanzo/ui

**Status:** ❌ BUILD FAILING - 343 Errors
**Target:** ✅ 0 Errors, Production Ready
**Time Estimate:** 2.5 hours (critical) + 6 hours (full compliance)

---

## CRITICAL - Must Fix Now (2.5 hours)

### [ ] 1. Create Missing Primitives (2 hours)

**Sidebar Component (77 failing imports)**
```bash
# Create file
touch primitives/sidebar.tsx
```

Required exports:
- [ ] `Sidebar`
- [ ] `SidebarContent`
- [ ] `SidebarFooter`
- [ ] `SidebarGroup`
- [ ] `SidebarGroupAction`
- [ ] `SidebarGroupContent`
- [ ] `SidebarGroupLabel`
- [ ] `SidebarHeader`
- [ ] `SidebarInset`
- [ ] `SidebarInput`
- [ ] `SidebarMenu`
- [ ] `SidebarMenuAction`
- [ ] `SidebarMenuBadge`
- [ ] `SidebarMenuButton`
- [ ] `SidebarMenuItem`
- [ ] `SidebarMenuSub`
- [ ] `SidebarMenuSubButton`
- [ ] `SidebarMenuSubItem`
- [ ] `SidebarProvider`
- [ ] `SidebarRail`
- [ ] `SidebarSeparator`
- [ ] `SidebarTrigger`
- [ ] `useSidebar`

**Field Component (10 failing imports)**
```bash
# Create file
touch primitives/field.tsx
```

Required exports:
- [ ] `Field`
- [ ] `FieldDescription`
- [ ] `FieldGroup`
- [ ] `FieldLabel`

**Reference:** Copy from shadcn/ui source or stub implementations

---

### [ ] 2. Fix Calendar Imports (15 minutes)

**Problem:** Calendar exported as default, imported as named (35 files affected)

**Option A - Update Imports (Recommended):**
```bash
# Change all calendar block imports
find blocks/calendar -name "*.tsx" -exec sed -i '' \
  's/import { Calendar/import Calendar/g' {} \;

find blocks/calendar -name "*.tsx" -exec sed -i '' \
  's/import { CalendarDayButton/import CalendarDayButton/g' {} \;
```

**Option B - Update Export:**
```typescript
// primitives/calendar.tsx
// Add named export alongside default
export { Calendar }
export default Calendar
```

**Files to Fix:**
- [ ] `blocks/calendar/calendar-01.tsx` through `calendar-18.tsx` (18 files)
- [ ] Chart components importing Calendar (if any)

---

### [ ] 3. Install Missing Dependencies (5 minutes)

```bash
cd /Users/z/work/hanzo/ui/pkg/ui

pnpm add \
  framer-motion \
  filesize \
  sql.js \
  react-markdown \
  react-syntax-highlighter \
  remark-gfm \
  rehype-katex \
  mermaid \
  react-qrcode-logo \
  @splinetool/react-spline \
  react-dropzone
```

**Verify installation:**
```bash
pnpm list framer-motion filesize sql.js
```

---

### [ ] 4. Fix React Type Conflicts (10 minutes)

**Problem:** Duplicate @types/react causing JSX type errors

```bash
# Deduplicate React types
pnpm dedupe @types/react @types/react-dom
pnpm install

# Verify single version
pnpm list @types/react
# Should show only version 18.3.1
```

**If issue persists:**
```bash
# Remove and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

### [ ] 5. Verify Critical Fixes

```bash
# Run type check
npm run build:check

# Should show significantly fewer errors
# Target: < 100 errors remaining
```

---

## HIGH PRIORITY - Pre-Deployment (6 hours)

### [ ] 6. Fix Missing Type Exports (30 minutes)

**assets/hanzo-logo.tsx**
- [ ] Export `HanzoLogoProps` type

**primitives/drawer.tsx**
- [ ] Export `DrawerProps` type
- [ ] Remove `DrawerHandle` from index (doesn't exist)

**primitives/dialog.tsx**
- [ ] Export `DialogClose` component

**primitives/popover.tsx**
- [ ] Export `PopoverArrow` component
- [ ] Export `PopoverClose` component

**primitives/markdown-preview.tsx**
- [ ] Export `MarkdownPreview` component

---

### [ ] 7. Fix Button Variants (30 minutes)

**Problem:** "tertiary" variant used but not defined

**Files using invalid "tertiary" variant:**
- [ ] `primitives/copy-to-clipboard-icon.tsx:50`
- [ ] `primitives/input.tsx:110`
- [ ] `primitives/mermaid.tsx:141`
- [ ] `primitives/mermaid.tsx:156`
- [ ] `primitives/pagination.tsx:51`
- [ ] `primitives/qr-code.tsx:103`
- [ ] `primitives/search-input.tsx:54`

**Option A - Add variant:**
```typescript
// primitives/button.tsx
const buttonVariants = cva({
  variants: {
    variant: {
      // ... existing
      tertiary: "bg-transparent hover:bg-level-1 text-muted-1",
    }
  }
})
```

**Option B - Replace usage:**
```bash
# Replace "tertiary" with "ghost"
find primitives -name "*.tsx" -exec sed -i '' \
  's/variant="tertiary"/variant="ghost"/g' {} \;
```

**Invalid size props:**
- [ ] `primitives/chat/files-preview.tsx:177` - Change `size="xs"` to `size="sm"`
- [ ] `primitives/search-input.tsx:52` - Change `size="auto"` to `size="default"`

---

### [ ] 8. Add Type Annotations (1 hour)

**Files with implicit any:**

**primitives/chat/message.tsx**
```typescript
// Line 302 - Add types
messages.tools?.map((tool: ToolData, index: number) => {
```

**primitives/chat/message-list.tsx**
```typescript
// Line 266 - Add types
messages.map((message: Message, messageIndex: number) => {
```

**primitives/chat/sqlite-preview.tsx**
```typescript
// Lines 41, 44, 46 - Add types
rows.map((v: SQLValue) => {
tables.map((table: TableInfo) => {
```

**primitives/file-uploader.tsx**
```typescript
// Line 111 - Add types
onDrop={(acceptedFiles: File[]) => {
```

**Define missing types:**
```typescript
// Add to primitives/chat/types.ts
interface ToolData {
  name: string
  args: Record<string, unknown>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  tools?: ToolData[]
}

type SQLValue = string | number | null | boolean

interface TableInfo {
  name: string
  sql: string
}
```

---

### [ ] 9. Fix InputOTPSlot (30 minutes)

**Problem:** Slot components don't accept index prop (30 instances)

**Files to fix:**
- [ ] `blocks/auth/otp/otp-01/components/otp-form.tsx` (lines 35-40)
- [ ] `blocks/auth/otp/otp-02/components/otp-form.tsx` (lines 33-44)
- [ ] `blocks/auth/otp/otp-03/components/otp-form.tsx` (lines 37-42)
- [ ] `blocks/auth/otp/otp-04/components/otp-form.tsx` (lines 44-52)
- [ ] `blocks/auth/otp/otp-05/components/otp-form.tsx` (lines 49-57)

**Change from:**
```tsx
<InputOTPSlot index={0} />
<InputOTPSlot index={1} />
```

**To:**
```tsx
<InputOTPSlot />
<InputOTPSlot />
```

**Note:** Index is implicit from order in InputOTPGroup

---

### [ ] 10. Fix Duplicate Identifiers (15 minutes)

**primitives/index-selective.ts**
- [ ] Remove duplicate `ButtonProps` export (line 226)
- [ ] Remove duplicate `InputProps` export (line 227)

**primitives/index.ts**
- [ ] Fix duplicate `CalComEmbed` export (line 1)
```typescript
// Change from:
export { CalComEmbed, CalComEmbed } from './primitives/cal-embed'

// To:
export { CalComEmbed } from './primitives/cal-embed'
```

---

### [ ] 11. Fix LinkElement (15 minutes)

**primitives/next/link-element.tsx**

**Add rounded to type:**
```typescript
// Line ~30
interface LinkElementProps extends LinkDef {
  rounded?: boolean
  // ... other props
}
```

**Update VariantProps:**
```typescript
// Or add to buttonVariants config
const linkElementVariants = cva({
  variants: {
    // ... existing
    rounded: {
      true: "rounded-full",
      false: "rounded-md"
    }
  }
})
```

---

## MEDIUM - Quality Improvements (Optional)

### [ ] 12. Standardize Export Patterns (2 hours)

**Current inconsistencies:**
- Calendar: default export
- Button: named exports
- Dialog: mixed

**Recommendation:** Named exports everywhere

```typescript
// Convert all files to:
export const Component = ...
export type ComponentProps = ...
export { Component, ComponentProps }
```

---

### [ ] 13. Enable Strict TypeScript (1 hour)

**tsconfig.build.json updates:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Then fix any new errors revealed**

---

## Validation Steps

### [ ] After Each Phase

**1. Type Check**
```bash
npm run build:check
# Target: 0 errors
```

**2. Build**
```bash
npm run build
# Should complete successfully
```

**3. Verify Exports**
```bash
ls -lh dist/
# Check for .d.ts files
# Check for .mjs and .js files
```

**4. Test Imports**
```typescript
// test-imports.ts
import { Button, Calendar, Sidebar } from '@hanzo/ui/primitives'
import { Dashboard01 } from '@hanzo/ui/blocks'
// Should all resolve
```

**5. Size Check**
```bash
ls -lh dist/index.{js,mjs,d.ts}
# Verify reasonable bundle size
```

---

## Progress Tracking

### Phase 1: Critical Fixes
- [ ] Sidebar primitive created
- [ ] Field primitive created
- [ ] Calendar imports fixed
- [ ] Dependencies installed
- [ ] React types deduplicated
- **Status:** ⏳ In Progress / ✅ Complete

### Phase 2: Type Safety
- [ ] Type exports added
- [ ] Button variants fixed
- [ ] Type annotations added
- [ ] InputOTPSlot fixed
- [ ] Duplicates removed
- [ ] LinkElement fixed
- **Status:** ⏳ In Progress / ✅ Complete

### Phase 3: Quality (Optional)
- [ ] Export patterns standardized
- [ ] Strict mode enabled
- [ ] All warnings resolved
- **Status:** ⏳ In Progress / ✅ Complete

---

## Success Criteria

### ✅ Definition of Done

1. **Build Succeeds**
   ```bash
   npm run build:check  # 0 errors
   npm run build        # Success
   ```

2. **All Exports Work**
   - All primitives importable
   - All blocks importable
   - All components importable

3. **Type Safety**
   - No implicit any
   - No type assertions without guards
   - All props properly typed

4. **Production Ready**
   - Can publish to npm
   - Can use in other projects
   - No runtime errors from type issues

---

## Emergency Contacts

**If blocked on:**
- **Sidebar/Field implementation:** Check shadcn/ui source
- **Type conflicts:** Check @types/react version
- **Build issues:** Clear node_modules and reinstall
- **Import errors:** Verify export patterns

**Quick debug:**
```bash
# Clear everything
rm -rf node_modules dist pnpm-lock.yaml
pnpm install
npm run build:check
```

---

**Last Updated:** 2025-10-05
**Total Time Estimate:** 8.5 hours
**Critical Path:** 2.5 hours
