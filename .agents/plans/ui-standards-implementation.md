# Feature: UI Standards Implementation

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Implement the "Rugged Utility" UI standards defined in `.kiro/steering/ui-standards.md` to make OpenLivestock field-ready for farmers using phones in dusty conditions with dirty hands. This includes creating reusable components for touch-friendly action grids, batch context headers, health status indicators, and enhanced sync status display.

## User Story

As a farmer in the field
I want large touch targets and clear status indicators
So that I can quickly log data on my phone without frustration

## Problem Statement

Current UI has:

- Button touch targets at 40px (below 48px mobile standard)
- Quick actions grid with ~48px cells (below 64px field standard)
- No reusable BatchHeader component (inline, not sticky, no sync status)
- No HealthPulse component for at-a-glance batch status
- OfflineIndicator only shows offline state (no syncing/synced/pending count)

## Solution Statement

Create 5 new/enhanced components following ui-standards.md:

1. **Button `field` size** - 48px height for field screens
2. **ActionGrid** - Reusable 64px cell grid for high-frequency actions
3. **BatchHeader** - Sticky header with species, age, sync status
4. **HealthPulse** - Color-coded status card (green/amber/red)
5. **SyncStatus** - Enhanced indicator showing 4 states with pending count

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: UI components, batch detail page, dashboard
**Dependencies**: TanStack Query (for sync status), existing Badge/Button components

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/components/ui/button.tsx` (lines 1-80) - Current button variants, add `field` size here
- `app/components/ui/badge.tsx` (lines 1-60) - Has success/warning/destructive variants for HealthPulse
- `app/components/offline-indicator.tsx` (lines 1-32) - Current offline-only indicator to enhance
- `app/routes/_auth/dashboard/index.tsx` (lines 680-760) - Current inline quick actions to replace
- `app/routes/_auth/batches/$batchId/index.tsx` (lines 160-220) - Current inline batch header to replace
- `app/components/page-header.tsx` - Reference for header patterns (but BatchHeader is different)
- `app/components/layout/shell.tsx` (lines 49-60) - Sticky header pattern to follow
- `app/lib/query-client.ts` - QueryClient config for sync status
- `.kiro/steering/ui-standards.md` - Design specifications

### New Files to Create

- `app/components/ui/action-grid.tsx` - Reusable action grid component
- `app/components/batch-header.tsx` - Sticky batch context header
- `app/components/health-pulse.tsx` - Color-coded status card
- `app/components/sync-status.tsx` - Enhanced sync indicator (replaces offline-indicator)

### Relevant Documentation

- [WCAG 2.5.8 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
    - Minimum 24px, recommended 44-48px for mobile
- [TanStack Query Network Mode](https://tanstack.com/query/latest/docs/framework/react/guides/network-mode)
    - Pending/paused states for offline mutations
- [Google web.dev Touch Targets](https://web.dev/articles/accessible-tap-targets)
    - Recommends 48px minimum for touch

### Patterns to Follow

**Button Variant Pattern (from button.tsx):**

```typescript
// Add to size variants in buttonVariants cva
field: 'h-12 gap-2 px-5 text-sm', // 48px height
'icon-field': 'size-12', // 48px square
```

**Badge Variant Pattern (from badge.tsx):**

```typescript
// Already has success/warning/destructive - use for HealthPulse
variant: {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}
```

**Sticky Header Pattern (from shell.tsx):**

```typescript
<div className="sticky top-0 z-30 ... bg-background/95 backdrop-blur-md">
```

**Online Status Hook Pattern (from offline-indicator.tsx):**

```typescript
function useOnlineStatus() {
    const isOnline = useSyncExternalStore(
        (callback) => {
            window.addEventListener('online', callback)
            window.addEventListener('offline', callback)
            return () => {
                /* cleanup */
            }
        },
        () => navigator.onLine,
        () => true,
    )
    return isOnline
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Button Field Size

Add `field` size variant to Button component for 48px touch targets.

**Tasks:**

- Add `field` and `icon-field` size variants to button.tsx
- Non-breaking change - existing code unaffected

### Phase 2: Core Components

Create the 4 new UI components.

**Tasks:**

- Create ActionGrid component with configurable actions
- Create BatchHeader component with sticky positioning
- Create HealthPulse component with status variants
- Create SyncStatus component with 4 states

### Phase 3: Integration

Replace inline implementations with new components.

**Tasks:**

- Replace dashboard quick actions with ActionGrid
- Replace batch detail header with BatchHeader
- Add HealthPulse to batch detail page
- Replace OfflineIndicator with SyncStatus in shell

### Phase 4: Testing & Validation

Verify all components work correctly.

**Tasks:**

- Visual verification of touch target sizes
- Test sync status states
- Verify mobile responsiveness
- Run full test suite

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/components/ui/button.tsx`

- **IMPLEMENT**: Add `field` size (h-12 = 48px) and `icon-field` size (size-12 = 48px)
- **PATTERN**: Follow existing size variant pattern at line 30-40
- **IMPORTS**: None needed
- **GOTCHA**: Keep existing sizes unchanged for backward compatibility

**Code to add in `size` variants:**

```typescript
field: 'h-12 gap-2 px-5 text-sm has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
'icon-field': 'size-12',
```

- **VALIDATE**: `bun run check`

---

### Task 2: CREATE `app/components/ui/action-grid.tsx`

- **IMPLEMENT**: Reusable grid component with 64px minimum cells
- **PATTERN**: Mirror dashboard quick actions structure (lines 688-760)
- **IMPORTS**: `lucide-react` icons, `cn` from utils, `useTranslation`

**Component interface:**

```typescript
interface ActionGridAction {
    icon: LucideIcon
    label: string
    onClick?: () => void
    href?: string
    disabled?: boolean
    variant?: 'default' | 'success' | 'warning' | 'destructive'
}

interface ActionGridProps {
    actions: ActionGridAction[]
    columns?: 2 | 3 | 4 | 6
    className?: string
}
```

**Key implementation details:**

- Grid cells: `min-h-[64px] min-w-[64px]`
- Responsive: `grid-cols-3 sm:grid-cols-4 md:grid-cols-6`
- Support both `onClick` and `href` (Link component)
- Icon size: `h-6 w-6`
- Label: `text-xs font-medium`

- **VALIDATE**: `bun run check`

---

### Task 3: CREATE `app/components/batch-header.tsx`

- **IMPLEMENT**: Sticky header showing batch context with sync status
- **PATTERN**: Combine shell.tsx sticky pattern + batch detail header structure
- **IMPORTS**: `Badge`, `SyncStatus`, livestock icons from lucide-react, `useTranslation`

**Component interface:**

```typescript
interface BatchHeaderProps {
    batch: {
        id: string
        batchName: string | null
        species: string
        livestockType: string
        status: 'active' | 'depleted' | 'sold'
        currentQuantity: number
        initialQuantity: number
        acquisitionDate: Date
    }
    farmName?: string
    onBack?: () => void
    actions?: React.ReactNode
}
```

**Key implementation details:**

- Sticky: `sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b`
- Show: Species icon, batch name, age (weeks/days), status badge, sync status
- Subtitle: `{currentQuantity}/{initialQuantity} • {farmName}`
- Back button on left, actions on right

- **VALIDATE**: `bun run check`

---

### Task 4: CREATE `app/components/health-pulse.tsx`

- **IMPLEMENT**: Color-coded status card showing batch health at a glance
- **PATTERN**: Use Badge variants for colors, Card for container
- **IMPORTS**: `Card`, `Badge`, `cn`, icons from lucide-react

**Component interface:**

```typescript
type HealthStatus = 'healthy' | 'attention' | 'critical'

interface HealthPulseProps {
    status: HealthStatus
    title?: string
    metrics?: {
        label: string
        value: string | number
        unit?: string
    }[]
    message?: string
    className?: string
}
```

**Status mapping:**

- `healthy` (green): All metrics within targets
- `attention` (amber): One metric needs attention
- `critical` (red): Immediate action required

**Key implementation details:**

- Card with colored left border: `border-l-4 border-l-success/warning/destructive`
- Status icon: CheckCircle (green), AlertTriangle (amber), XCircle (red)
- Metrics row: `{label}: {value}{unit}` separated by bullets
- Optional message below metrics

- **VALIDATE**: `bun run check`

---

### Task 5: CREATE `app/components/sync-status.tsx`

- **IMPLEMENT**: Enhanced indicator showing 4 sync states with pending count
- **PATTERN**: Extend offline-indicator.tsx with TanStack Query integration
- **IMPORTS**: `useSyncExternalStore`, `useQueryClient`, `useMutationState` from @tanstack/react-query

**Component interface:**

```typescript
type SyncState = 'synced' | 'syncing' | 'pending' | 'offline'

interface SyncStatusProps {
    className?: string
    showLabel?: boolean
    size?: 'sm' | 'default'
}
```

**State logic:**

```typescript
// Determine state
const isOnline = useOnlineStatus()
const queryClient = useQueryClient()
const pendingMutations = useMutationState({
    filters: { status: 'pending' },
})
const pendingCount = pendingMutations.length

let state: SyncState
if (!isOnline) state = 'offline'
else if (pendingCount > 0) state = 'pending'
else state = 'synced'
// Note: 'syncing' state requires tracking active mutations
```

**Visual states:**

- `synced`: Green dot `●` + "Synced"
- `syncing`: Animated dot `◐` + "Syncing..."
- `pending`: Gray dot `○` + "Offline (3)"
- `offline`: Red dot `⚠` + "Offline"

- **VALIDATE**: `bun run check`

---

### Task 6: UPDATE `app/routes/_auth/dashboard/index.tsx`

- **IMPLEMENT**: Replace inline quick actions with ActionGrid component
- **PATTERN**: Import ActionGrid, configure actions array
- **IMPORTS**: `ActionGrid` from `~/components/ui/action-grid`

**Replace lines 688-760 with:**

```typescript
import { ActionGrid } from '~/components/ui/action-grid'

// In component:
const quickActions = [
  { icon: Users, label: t('common:batches'), onClick: () => setBatchDialogOpen(true), disabled: !selectedFarmId },
  { icon: Wheat, label: t('common:feed'), onClick: () => setFeedDialogOpen(true), disabled: !selectedFarmId },
  { icon: Receipt, label: t('common:expenses'), onClick: () => setExpenseDialogOpen(true), disabled: !selectedFarmId },
  { icon: ShoppingCart, label: t('newSale'), onClick: () => setSaleDialogOpen(true), disabled: !selectedFarmId },
  { icon: AlertTriangle, label: t('common:mortality'), onClick: () => setMortalityDialogOpen(true), disabled: !selectedFarmId },
  { icon: TrendingUp, label: t('common:reports'), href: '/reports' },
]

// In JSX:
<ActionGrid actions={quickActions} />
```

- **VALIDATE**: `bun run check && bun run build`

---

### Task 7: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

- **IMPLEMENT**: Replace inline header with BatchHeader, add HealthPulse
- **PATTERN**: Import components, pass batch data
- **IMPORTS**: `BatchHeader`, `HealthPulse` from components

**Replace header section (lines 160-220) with:**

```typescript
import { BatchHeader } from '~/components/batch-header'
import { HealthPulse } from '~/components/health-pulse'

// Determine health status
const healthStatus = mortality.rate > 10 ? 'critical'
  : mortality.rate > 5 ? 'attention'
  : 'healthy'

// In JSX:
<BatchHeader
  batch={batch}
  onBack={() => navigate({ to: '/batches' })}
  actions={
    <>
      <Button variant="outline" size="sm"><Edit /> Edit</Button>
      <Button variant="destructive" size="sm"><Trash2 /> Delete</Button>
    </>
  }
/>

<HealthPulse
  status={healthStatus}
  metrics={[
    { label: 'Mortality', value: mortality.rate.toFixed(1), unit: '%' },
    { label: 'FCR', value: feed.fcr?.toFixed(2) || '--' },
    { label: 'Weight', value: formatWeight(details.currentWeight || 0) },
  ]}
/>
```

- **VALIDATE**: `bun run check && bun run build`

---

### Task 8: UPDATE `app/components/layout/shell.tsx`

- **IMPLEMENT**: Replace OfflineIndicator import with SyncStatus in mobile header
- **PATTERN**: Add SyncStatus to mobile header bar
- **IMPORTS**: `SyncStatus` from `~/components/sync-status`

**Add to mobile header (around line 55):**

```typescript
import { SyncStatus } from '~/components/sync-status'

// In mobile header div:
<div className="sticky top-0 z-30 flex h-16 items-center gap-3 ...">
  <Button variant="ghost" ...>
    <Menu />
  </Button>
  <Link to="/">
    <Logo />
  </Link>
  <div className="ml-auto">
    <SyncStatus size="sm" />
  </div>
</div>
```

- **VALIDATE**: `bun run check && bun run build`

---

### Task 9: DELETE `app/components/offline-indicator.tsx`

- **IMPLEMENT**: Remove old component, update imports in \_\_root.tsx
- **PATTERN**: Search for imports and remove
- **GOTCHA**: Check \_\_root.tsx for OfflineIndicator usage

**Steps:**

1. Remove `<OfflineIndicator />` from `app/routes/__root.tsx`
2. Delete `app/components/offline-indicator.tsx`

- **VALIDATE**: `bun run check && bun run build`

---

## TESTING STRATEGY

### Visual Verification

1. **Touch targets**: Use browser dev tools to measure button heights
    - `field` size buttons should be 48px
    - ActionGrid cells should be 64px minimum

2. **Sync status states**: Test by:
    - Disconnecting network → should show "Offline"
    - Reconnecting → should show "Synced"
    - Making mutation while offline → should show pending count

3. **Mobile responsiveness**: Test at 375px width (iPhone SE)

### Unit Tests

No new unit tests required - these are presentational components.

### Integration Tests

Verify existing tests still pass:

```bash
bun run test --run
```

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit || exit 1
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
bun run test --run || exit 1
```

### Level 3: Build Verification

```bash
bun run build || exit 1
```

### Complete Validation

```bash
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] Button `field` size is 48px (h-12)
- [ ] ActionGrid cells are minimum 64px
- [ ] BatchHeader is sticky and shows sync status
- [ ] HealthPulse shows correct color for status
- [ ] SyncStatus shows 4 states correctly
- [ ] Dashboard uses ActionGrid component
- [ ] Batch detail uses BatchHeader and HealthPulse
- [ ] Shell uses SyncStatus instead of OfflineIndicator
- [ ] All validation commands pass
- [ ] No regressions in existing tests
- [ ] Mobile responsive at 375px width

---

## COMPLETION CHECKLIST

- [ ] Task 1: Button field size added
- [ ] Task 2: ActionGrid component created
- [ ] Task 3: BatchHeader component created
- [ ] Task 4: HealthPulse component created
- [ ] Task 5: SyncStatus component created
- [ ] Task 6: Dashboard updated with ActionGrid
- [ ] Task 7: Batch detail updated with BatchHeader + HealthPulse
- [ ] Task 8: Shell updated with SyncStatus
- [ ] Task 9: Old OfflineIndicator removed
- [ ] All validation commands pass
- [ ] Visual verification complete

---

## NOTES

### Design Decisions

1. **Button `field` size is opt-in**: Existing code uses `default` (40px). Only field-use screens should explicitly use `field` size. This is non-breaking.

2. **ActionGrid is flexible**: Supports both `onClick` handlers and `href` links. Columns are configurable but default to responsive 3/4/6.

3. **BatchHeader is separate from PageHeader**: PageHeader is for page titles. BatchHeader is for batch context that persists while scrolling.

4. **SyncStatus replaces OfflineIndicator**: The new component is a superset - it shows offline state plus syncing/synced/pending states.

5. **HealthPulse thresholds are configurable**: The component receives a `status` prop - the parent determines what constitutes healthy/attention/critical based on business logic.

### Future Enhancements

- Add ActionGrid to batch detail page (Feed, Death, Sale, Weigh, Vax, Water)
- Add HealthPulse to batch list cards
- Add SyncStatus to desktop sidebar
- Consider adding haptic feedback for touch actions (if PWA supports)
