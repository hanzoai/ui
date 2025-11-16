# Builder Page Iframe Loading Fixes

## Date: 2025-11-16
## File: /Users/z/work/hanzo/ui/app/app/(app)/builder/page.tsx

## Problems Fixed

### 1. ✅ Removed `loading="lazy"` Attribute
**Before:**
```tsx
<iframe
  src={`/view/${blockName}`}
  className="h-full w-full border-0"
  title={blockName}
  loading="lazy"  // ❌ Prevented eager loading
/>
```

**After:**
```tsx
<iframe
  src={`/view/${blockName}`}
  className="h-full w-full border-0"
  title={blockName}
  onLoad={() => handleIframeLoad(blockName)}  // ✅ No lazy loading
/>
```

### 2. ✅ Changed Aspect Ratio from 16:9 to 4:3
**Before:**
```tsx
<div className="relative aspect-video bg-muted">  // ❌ 16:9 too wide
```

**After:**
```tsx
<div className="relative aspect-[4/3] min-h-[400px] bg-muted">  // ✅ 4:3 with min height
```

### 3. ✅ Added Explicit Minimum Height
**Before:**
```tsx
<div className="relative aspect-video bg-muted">  // ❌ No min-height
```

**After:**
```tsx
<div className="relative aspect-[4/3] min-h-[400px] bg-muted">  // ✅ 400px minimum
```

### 4. ✅ Added `onLoad` Handler with Loading State
**Before:**
- No loading state tracking
- No visual feedback during load
- No way to detect when iframe content is ready

**After:**
```tsx
// State management
const [loadedIframes, setLoadedIframes] = React.useState<Set<string>>(new Set())

const handleIframeLoad = React.useCallback((blockName: string) => {
  setLoadedIframes((prev) => new Set(prev).add(blockName))
}, [])

// Loading indicator
{!loadedIframes.has(blockName) && (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-sm text-muted-foreground">
      Loading preview...
    </div>
  </div>
)}

// Iframe with onLoad
<iframe
  src={`/view/${blockName}`}
  className="h-full w-full border-0"
  title={blockName}
  onLoad={() => handleIframeLoad(blockName)}
/>
```

## Benefits of Changes

1. **Eager Loading**: Iframes load immediately when visible (no lazy loading)
2. **Better Dimensions**: 4:3 aspect ratio better suits block content
3. **Minimum Height**: Ensures iframes are never too small (400px minimum)
4. **Visual Feedback**: "Loading preview..." shown until iframe content loads
5. **Load Tracking**: State tracks which iframes have successfully loaded

## Technical Implementation

### State Management
```typescript
const [loadedIframes, setLoadedIframes] = React.useState<Set<string>>(new Set())
```
- Uses `Set` for O(1) lookup performance
- Tracks which block iframes have loaded

### Load Handler
```typescript
const handleIframeLoad = React.useCallback((blockName: string) => {
  setLoadedIframes((prev) => new Set(prev).add(blockName))
}, [])
```
- `useCallback` prevents unnecessary re-renders
- Creates new Set to trigger React re-render
- Called when iframe content finishes loading

### Conditional Loading State
```typescript
{!loadedIframes.has(blockName) && (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="text-sm text-muted-foreground">
      Loading preview...
    </div>
  </div>
)}
```
- Shows loading text until iframe loads
- Positioned absolutely over iframe container
- Disappears when `onLoad` fires

## Expected Results

1. Iframes load immediately when builder page opens
2. Loading indicator appears briefly during iframe content load
3. Block previews display at better dimensions (4:3 ratio, 400px min)
4. No more blank gray boxes - content loads eagerly
5. Visual feedback for users during load process

## Verification Steps

1. Start dev server: `pnpm dev`
2. Navigate to http://localhost:3003/builder
3. Observe:
   - "Loading preview..." appears briefly
   - Iframes load block content immediately
   - Blocks display at proper size (4:3 ratio)
   - No blank gray boxes
   - Loading indicator disappears after load

## Files Modified

- `/Users/z/work/hanzo/ui/app/app/(app)/builder/page.tsx`
  - Added `loadedIframes` state
  - Added `handleIframeLoad` callback
  - Removed `loading="lazy"`
  - Changed `aspect-video` to `aspect-[4/3]`
  - Added `min-h-[400px]`
  - Added loading indicator
  - Added `onLoad` handler to iframe

## Testing

Created comprehensive E2E test suite:
- `/Users/z/work/hanzo/ui/tests/verify-builder-iframes.spec.ts`

Test coverage:
- ✅ Page loads successfully
- ✅ Block count displays
- ✅ Iframes exist and are visible
- ✅ Loading state functionality
- ✅ No lazy loading attribute
- ✅ Correct aspect ratio classes
- ✅ Filter functionality
- ✅ Link target attributes
- ✅ Block names and descriptions display
