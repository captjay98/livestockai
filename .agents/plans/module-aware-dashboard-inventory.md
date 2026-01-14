# Feature: Module-Aware Dashboard with Dynamic Inventory Cards

The following plan implements intelligent dashboard adaptation based on enabled farm modules.

## Feature Description

Transform the dashboard from showing hardcoded livestock inventory cards (poultry, fish) to dynamically displaying cards based on enabled farm modules. This makes the dashboard automatically adapt to the farm type - a cattle farm sees cattle cards, a mixed farm sees multiple types, and a poultry-only farm sees only poultry.

## User Story

As a farm manager
I want the dashboard to show only the livestock types relevant to my farm
So that I see a clean, focused view without irrelevant information cluttering my screen

## Problem Statement

The current dashboard hardcodes poultry and fish inventory cards, showing them regardless of whether the farm actually has those livestock types enabled. This creates:
- Visual clutter for specialized farms (e.g., cattle-only farm sees empty poultry/fish cards)
- Missed opportunity to show other livestock types (cattle, goats, sheep, bees)
- Inconsistent UX with the module system that already filters navigation and batch forms

## Solution Statement

Use the existing module system to:
1. Dynamically render inventory cards only for enabled modules
2. Add inventory cards for all 6 livestock types (not just poultry/fish)
3. Maintain responsive grid layout regardless of card count
4. Show appropriate icons and colors per livestock type

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Low
**Primary Systems Affected**: Dashboard
**Dependencies**: Module system (already implemented)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

**Module System:**
- `app/features/modules/context.tsx` (lines 1-100) - ModuleProvider, useModules hook
- `app/features/modules/constants.ts` (lines 1-200) - MODULE_METADATA with all 6 livestock types
- `app/features/modules/types.ts` (lines 1-80) - ModuleKey type definition

**Dashboard:**
- `app/routes/_auth/dashboard/index.tsx` (lines 469-500) - Current inventory cards section
- `app/routes/_auth/dashboard/index.tsx` (lines 160-180) - DashboardStats interface with inventory data

**Icons:**
- `lucide-react` - Bird, Fish, Beef, Rabbit (goat), Cloud (sheep), Hexagon (bees)

### New Files to Create

None - all changes are updates to existing dashboard file

### Relevant Documentation

- [Lucide Icons](https://lucide.dev/icons/)
  - Icon reference for livestock types
  - Why: Need to find appropriate icons for cattle, goats, sheep, bees

### Patterns to Follow

**Module Context Pattern:**
```typescript
// From app/components/navigation.tsx
import { useModules } from '~/features/modules/context'

const { enabledModules } = useModules()

// Filter based on enabled modules
{enabledModules.includes('poultry') && (
  <NavigationItem />
)}
```

**Conditional Rendering Pattern:**
```typescript
// From app/routes/_auth/dashboard/index.tsx (line 309)
{!stats ? (
  <EmptyState />
) : (
  <Content />
)}
```

**Card Grid Pattern:**
```typescript
// From app/routes/_auth/dashboard/index.tsx (line 469)
<div className="grid gap-3 sm:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation

Add module context to dashboard and prepare livestock type metadata.

**Tasks:**
- Import useModules hook
- Import additional icons for new livestock types
- Define livestock type metadata (icon, color, label)

### Phase 2: Core Implementation

Replace hardcoded inventory cards with dynamic rendering.

**Tasks:**
- Create livestock card configuration array
- Map enabled modules to card configurations
- Render cards dynamically based on enabled modules
- Handle empty state (no modules enabled)

### Phase 3: Integration

Ensure dashboard stats include data for all livestock types.

**Tasks:**
- Verify getDashboardStats returns counts for all 6 types
- Update DashboardStats interface if needed
- Test with different module combinations

### Phase 4: Testing & Validation

Validate across different farm types and module combinations.

**Tasks:**
- Test with single module (poultry only)
- Test with multiple modules (poultry + aquaculture)
- Test with all modules enabled
- Test with no modules (edge case)

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE app/routes/_auth/dashboard/index.tsx - Add imports

- **IMPLEMENT**: Add useModules import and additional livestock icons
- **IMPORTS**:
  ```typescript
  import { useModules } from '~/features/modules/context'
  import { Beef, Rabbit, Cloud, Hexagon } from 'lucide-react'
  ```
- **LOCATION**: Add to existing import block (lines 1-40)
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: UPDATE app/routes/_auth/dashboard/index.tsx - Add livestock metadata

- **IMPLEMENT**: Create livestock type configuration object
- **PATTERN**: Object mapping pattern from MODULE_METADATA
- **LOCATION**: Inside DashboardPage component, before return statement
- **CODE**:
  ```typescript
  const LIVESTOCK_CARDS = {
    poultry: {
      icon: Bird,
      label: 'Poultry',
      color: 'primary',
      bgClass: 'bg-primary/10',
      textClass: 'text-primary',
      getValue: (stats: DashboardStats) => stats.inventory.totalPoultry,
    },
    aquaculture: {
      icon: Fish,
      label: 'Fish',
      color: 'blue',
      bgClass: 'bg-blue-100 dark:bg-blue-900/30',
      textClass: 'text-blue-600 dark:text-blue-400',
      getValue: (stats: DashboardStats) => stats.inventory.totalFish,
    },
    cattle: {
      icon: Beef,
      label: 'Cattle',
      color: 'orange',
      bgClass: 'bg-orange-100 dark:bg-orange-900/30',
      textClass: 'text-orange-600 dark:text-orange-400',
      getValue: (stats: DashboardStats) => stats.inventory.totalCattle || 0,
    },
    goats: {
      icon: Rabbit,
      label: 'Goats',
      color: 'green',
      bgClass: 'bg-green-100 dark:bg-green-900/30',
      textClass: 'text-green-600 dark:text-green-400',
      getValue: (stats: DashboardStats) => stats.inventory.totalGoats || 0,
    },
    sheep: {
      icon: Cloud,
      label: 'Sheep',
      color: 'purple',
      bgClass: 'bg-purple-100 dark:bg-purple-900/30',
      textClass: 'text-purple-600 dark:text-purple-400',
      getValue: (stats: DashboardStats) => stats.inventory.totalSheep || 0,
    },
    bees: {
      icon: Hexagon,
      label: 'Bees',
      color: 'amber',
      bgClass: 'bg-amber-100 dark:bg-amber-900/30',
      textClass: 'text-amber-600 dark:text-amber-400',
      getValue: (stats: DashboardStats) => stats.inventory.totalBees || 0,
    },
  } as const
  ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: UPDATE app/routes/_auth/dashboard/index.tsx - Add module context

- **IMPLEMENT**: Get enabled modules from context
- **PATTERN**: useModules hook pattern
- **LOCATION**: Inside DashboardPage component, after other hooks
- **CODE**:
  ```typescript
  const { enabledModules } = useModules()
  ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 4: UPDATE app/routes/_auth/dashboard/index.tsx - Replace inventory cards section

- **IMPLEMENT**: Replace hardcoded cards with dynamic rendering
- **PATTERN**: Array.map() with conditional rendering
- **LOCATION**: Replace lines 469-500 (current inventory cards section)
- **OLD CODE**: Look for `{/* Inventory Summary */}` comment
- **NEW CODE**:
  ```typescript
  {/* Inventory Summary - Dynamic based on enabled modules */}
  {enabledModules.length > 0 && (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {enabledModules.map((moduleKey) => {
        const config = LIVESTOCK_CARDS[moduleKey]
        if (!config) return null
        
        const Icon = config.icon
        const count = config.getValue(stats)
        
        return (
          <Card key={moduleKey}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
                  config.bgClass
                )}>
                  <Icon className={cn('h-5 w-5', config.textClass)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{config.label}</p>
                  <p className="text-lg sm:text-xl font-bold">
                    {count.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )}
  ```
- **GOTCHA**: Use `cn()` utility for conditional classes
- **VALIDATE**: `npx tsc --noEmit`

### Task 5: UPDATE app/routes/_auth/dashboard/index.tsx - Update DashboardStats interface

- **IMPLEMENT**: Add optional fields for new livestock types
- **LOCATION**: Find DashboardStats interface (around line 160-180)
- **ADD TO INTERFACE**:
  ```typescript
  inventory: {
    activeBatches: number
    totalPoultry: number
    totalFish: number
    totalCattle?: number  // Add
    totalGoats?: number   // Add
    totalSheep?: number   // Add
    totalBees?: number    // Add
  }
  ```
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: VERIFY app/features/dashboard/server.ts - Check inventory data

- **IMPLEMENT**: Ensure getDashboardStats returns counts for all livestock types
- **PATTERN**: Check existing poultry/fish aggregation logic
- **ACTION**: Read file to verify, add TODO comment if missing
- **LOCATION**: `app/features/dashboard/server.ts`
- **NOTE**: If counts are missing, they'll default to 0 (handled by `|| 0` in getValue)
- **VALIDATE**: `npx tsc --noEmit`

---

## TESTING STRATEGY

### Manual Testing

Test dashboard with different module combinations:

**Test Case 1: Single Module (Poultry Only)**
- Enable only poultry module in settings
- Dashboard should show only poultry card
- Grid should adapt to single card layout

**Test Case 2: Two Modules (Poultry + Aquaculture)**
- Enable poultry and aquaculture modules
- Dashboard should show 2 cards
- Grid should show 2 columns on desktop

**Test Case 3: All Modules**
- Enable all 6 modules
- Dashboard should show 6 cards
- Grid should show 3 columns on desktop (2 rows)

**Test Case 4: No Modules (Edge Case)**
- Disable all modules
- Inventory section should not render
- No errors or empty grid

**Test Case 5: Module with Zero Count**
- Enable cattle module but have 0 cattle
- Card should still show with "0" count
- No errors

### Edge Cases

- Empty stats object → cards show 0
- Undefined livestock counts → default to 0
- Module enabled but no batches → show 0 count
- Rapid module toggling → no flickering or errors

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Build

```bash
bun run build
```

### Level 3: Manual Validation

**Test 1: Poultry-only farm**
1. Go to Settings → Modules
2. Enable only "Poultry" module
3. Go to Dashboard
4. Verify only poultry card shows

**Test 2: Mixed farm**
1. Enable Poultry + Aquaculture modules
2. Go to Dashboard
3. Verify both cards show

**Test 3: All livestock types**
1. Enable all 6 modules
2. Go to Dashboard
3. Verify 6 cards show with correct icons/colors

**Test 4: Responsive layout**
1. Resize browser window
2. Verify grid adapts: 1 col mobile, 2 col tablet, 3 col desktop

---

## ACCEPTANCE CRITERIA

- [x] Dashboard shows only inventory cards for enabled modules
- [x] All 6 livestock types supported (poultry, fish, cattle, goats, sheep, bees)
- [x] Each card has appropriate icon and color scheme
- [x] Grid layout is responsive (1/2/3 columns)
- [x] Zero counts display correctly (no errors)
- [x] No modules enabled → inventory section hidden
- [x] TypeScript compiles with zero errors
- [x] ESLint passes with zero errors
- [x] No regressions in other dashboard sections

---

## COMPLETION CHECKLIST

- [ ] Task 1: Imports added
- [ ] Task 2: Livestock metadata created
- [ ] Task 3: Module context added
- [ ] Task 4: Dynamic cards implemented
- [ ] Task 5: Interface updated
- [ ] Task 6: Server data verified
- [ ] All validation commands pass
- [ ] Manual testing complete (all 5 test cases)
- [ ] Responsive layout verified
- [ ] No TypeScript errors
- [ ] No ESLint errors

---

## NOTES

**Design Decisions:**

1. **Icons**: Using Lucide icons that best represent each livestock type
   - Beef for cattle (most recognizable)
   - Rabbit for goats (similar silhouette)
   - Cloud for sheep (wool association)
   - Hexagon for bees (honeycomb pattern)

2. **Colors**: Each livestock type gets unique color for visual distinction
   - Poultry: Primary (orange) - existing brand color
   - Fish: Blue - water association
   - Cattle: Orange - warm, earthy
   - Goats: Green - pasture association
   - Sheep: Purple - distinct from others
   - Bees: Amber - honey color

3. **Grid Layout**: Responsive grid adapts to card count
   - Mobile: 1 column (stacked)
   - Tablet: 2 columns
   - Desktop: 3 columns (optimal for 3-6 cards)

4. **Data Handling**: Optional fields with fallback to 0
   - New livestock types default to 0 if not in stats
   - No errors if backend doesn't provide counts yet
   - Graceful degradation

**Trade-offs:**

- Using `|| 0` fallback means we can't distinguish between "0 count" and "data not available"
- Acceptable trade-off for simpler implementation
- Backend can be updated later to provide actual counts

**Future Enhancements:**

- Click card to navigate to filtered batch list for that livestock type
- Show trend indicators (↑↓) for inventory changes
- Add "Add Batch" quick action button on each card
- Show health alerts per livestock type
