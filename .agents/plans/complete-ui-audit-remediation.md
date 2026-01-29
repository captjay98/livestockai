# Feature: Complete UI Audit Remediation

Complete all remaining UI audit issues: navigation structure fixes and hardcoded color migrations.

## Feature Description

Address all outstanding items from the UI audit to achieve full "Rugged Utility" design system compliance before committing the UI standards implementation work.

## User Story

As a farmer using OpenLivestock
I want consistent navigation and visual feedback
So that I can quickly find features and understand data states

## Problem Statement

The UI audit identified:

1. Navigation pointing Tasks to wrong route (`/vaccinations` instead of `/tasks`)
2. Duplicate navigation entries for vaccinations (3x)
3. Missing `/eggs` route in navigation
4. Dashboard in wrong navigation group
5. 25 hardcoded status colors that should use semantic tokens

## Solution Statement

1. Fix navigation.tsx to correct hrefs and remove duplicates
2. Migrate hardcoded `text-red-*` and `text-green-*` to `text-destructive` and `text-success`

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Low
**Primary Systems Affected**: Navigation, UI components
**Dependencies**: None

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ

- `app/components/navigation.tsx` (lines 40-125) - Navigation structure to fix
- `app/styles.css` - Verify `text-success` and `text-destructive` exist

### Files to Modify

| File                                          | Changes                                |
| --------------------------------------------- | -------------------------------------- |
| `app/components/navigation.tsx`               | Fix hrefs, remove duplicates, add eggs |
| `app/routes/_auth/dashboard/index.tsx`        | Migrate ~9 color instances             |
| `app/routes/_auth/batches/$batchId/index.tsx` | Migrate ~4 color instances             |
| `app/routes/_auth/inventory/index.tsx`        | Migrate ~2 color instances             |
| `app/routes/_auth/eggs/index.tsx`             | Migrate ~3 color instances             |
| `app/routes/_auth/onboarding/index.tsx`       | Migrate ~2 color instances             |

### Semantic Color Tokens Available

```css
/* From styles.css */
--success: oklch(0.7 0.15 145); /* Green - positive states */
--destructive: oklch(0.55 0.2 25); /* Red - negative states */
--warning: oklch(0.75 0.15 85); /* Amber - warnings */
```

### Color Migration Rules

| Hardcoded            | Semantic           | Context                     |
| -------------------- | ------------------ | --------------------------- |
| `text-green-500/600` | `text-success`     | Profit, completed, positive |
| `text-red-500/600`   | `text-destructive` | Loss, mortality, negative   |
| `bg-green-*`         | `bg-success`       | Success backgrounds         |
| `bg-red-*`           | `bg-destructive`   | Error backgrounds           |

**KEEP AS-IS (intentional differentiation):**

- Livestock type icon colors in `batch-header.tsx`
- Action icon colors in `command-center.tsx`, `fab.tsx`

---

## IMPLEMENTATION PLAN

### Phase 1: Navigation Fixes

Fix navigation structure in `navigation.tsx`.

### Phase 2: Color Migrations

Migrate hardcoded colors to semantic tokens across 5 route files.

### Phase 3: Validation

Run full validation suite.

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `app/components/navigation.tsx` - Fix getNavigationSections

**Location**: Lines 40-77

**CHANGES**:

1. Line 43: Change `href: '/vaccinations'` → `href: '/tasks'`
2. Line 52: Remove duplicate Medicine→vaccinations entry OR change to unique route
3. Line 58: Move Dashboard from Analysis to Operations group
4. Add Eggs to Daily Ops section (for poultry module)

**IMPLEMENT**:

```typescript
// Replace getNavigationSections (lines 40-77) with:
export const getNavigationSections = (t: any) => [
  {
    title: t('common:operations', { defaultValue: 'Operations' }),
    items: [
      {
        name: t('common:dashboard', { defaultValue: 'Dashboard' }),
        href: '/dashboard',
        icon: Home,
      },
      {
        name: t('common:batches', { defaultValue: 'Batches' }),
        href: '/batches',
        icon: Package,
      },
      {
        name: t('common:tasks', { defaultValue: 'Tasks' }),
        href: '/tasks',
        icon: CheckSquare,
      },
    ],
  },
  {
    title: t('common:dailyOps', { defaultValue: 'Daily Ops' }),
    items: [
      {
        name: t('common:feed', { defaultValue: 'Feed' }),
        href: '/feed',
        icon: Wheat,
      },
      {
        name: t('common:mortality', { defaultValue: 'Mortality' }),
        href: '/mortality',
        icon: TrendingDown,
      },
      {
        name: t('common:weight', { defaultValue: 'Weight' }),
        href: '/weight',
        icon: Scale,
      },
      {
        name: t('common:health', { defaultValue: 'Health' }),
        href: '/vaccinations',
        icon: Syringe,
      },
      {
        name: t('common:water', { defaultValue: 'Water' }),
        href: '/water-quality',
        icon: Droplets,
      },
      {
        name: t('common:eggs', { defaultValue: 'Eggs' }),
        href: '/eggs',
        icon: Egg,
      },
    ],
  },
  {
    title: t('common:inventory', { defaultValue: 'Inventory' }),
    items: [
      {
        name: t('common:inventory', { defaultValue: 'Inventory' }),
        href: '/inventory',
        icon: Warehouse,
      },
    ],
  },
  {
    title: t('common:finance', { defaultValue: 'Finance' }),
    items: [
      {
        name: t('common:sales', { defaultValue: 'Sales' }),
        href: '/sales',
        icon: ShoppingCart,
      },
      {
        name: t('common:expenses', { defaultValue: 'Expenses' }),
        href: '/expenses',
        icon: Receipt,
      },
      {
        name: t('common:invoices', { defaultValue: 'Invoices' }),
        href: '/invoices',
        icon: FileText,
      },
      {
        name: t('common:reports', { defaultValue: 'Reports' }),
        href: '/reports',
        icon: BarChart3,
      },
    ],
  },
  {
    title: t('common:network', { defaultValue: 'Network' }),
    items: [
      {
        name: t('common:customers', { defaultValue: 'Customers' }),
        href: '/customers',
        icon: UserCircle,
      },
      {
        name: t('common:suppliers', { defaultValue: 'Suppliers' }),
        href: '/suppliers',
        icon: Truck,
      },
    ],
  },
  {
    title: t('common:setup', { defaultValue: 'Setup' }),
    items: [
      {
        name: t('common:farms', { defaultValue: 'Farms' }),
        href: '/farms',
        icon: Building2,
      },
      {
        name: t('common:settings', { defaultValue: 'Settings' }),
        href: '/settings',
        icon: Settings,
      },
    ],
  },
]
```

**IMPORTS**: Add `Egg` and `Scale` to lucide-react imports if missing

**VALIDATE**:

```bash
grep -n "href: '/tasks'" app/components/navigation.tsx
grep -c "/vaccinations" app/components/navigation.tsx  # Should be 1 (Health only)
npx tsc --noEmit
```

---

### Task 2: UPDATE `app/components/navigation.tsx` - Fix NAVIGATION_SECTIONS

**Location**: Lines 82-122

**IMPLEMENT**: Update to match getNavigationSections structure

```typescript
export const NAVIGATION_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Batches', href: '/batches', icon: Package },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Daily Ops',
    items: [
      { name: 'Feed', href: '/feed', icon: Wheat },
      { name: 'Mortality', href: '/mortality', icon: TrendingDown },
      { name: 'Weight', href: '/weight', icon: Scale },
      { name: 'Health', href: '/vaccinations', icon: Syringe },
      { name: 'Water', href: '/water-quality', icon: Droplets },
      { name: 'Eggs', href: '/eggs', icon: Egg },
    ],
  },
  {
    title: 'Inventory',
    items: [{ name: 'Inventory', href: '/inventory', icon: Warehouse }],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Invoices', href: '/invoices', icon: FileText },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Network',
    items: [
      { name: 'Customers', href: '/customers', icon: UserCircle },
      { name: 'Suppliers', href: '/suppliers', icon: Truck },
    ],
  },
  {
    title: 'Setup',
    items: [
      { name: 'Farms', href: '/farms', icon: Building2 },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]
```

**VALIDATE**:

```bash
npx tsc --noEmit
bun run lint
```

---

### Task 3: UPDATE `app/routes/_auth/dashboard/index.tsx` - Migrate colors

**Locations and changes**:

| Line | Before                               | After                                |
| ---- | ------------------------------------ | ------------------------------------ |
| 221  | `text-green-600 dark:text-green-400` | `text-success`                       |
| 449  | `text-red-600`                       | `text-destructive`                   |
| 475  | `text-red-600 dark:text-red-400`     | `text-destructive`                   |
| 490  | `text-red-600`                       | `text-destructive`                   |
| 529  | `text-red-600 dark:text-red-400`     | `text-destructive`                   |
| 834  | `bg-red-100 text-red-600`            | `bg-destructive/10 text-destructive` |
| 859  | `text-red-600`                       | `text-destructive`                   |
| 982  | `text-red-600 bg-red-100`            | `text-destructive bg-destructive/10` |

**SKIP** (icon colors - keep as-is):

- Line 762: `text-red-500` on TrendingDown icon

**VALIDATE**:

```bash
grep -n "text-red-[0-9]\|text-green-[0-9]" app/routes/_auth/dashboard/index.tsx | grep -v "Icon\|icon" | wc -l
# Expected: 0 or only icon lines
npx tsc --noEmit
```

---

### Task 4: UPDATE `app/routes/_auth/batches/$batchId/index.tsx` - Migrate colors

**Locations and changes**:

| Line | Before                            | After                               |
| ---- | --------------------------------- | ----------------------------------- |
| 235  | `text-red-500 font-medium`        | `text-destructive font-medium`      |
| 236  | `text-green-500`                  | `text-success`                      |
| 312  | `text-green-600` : `text-red-500` | `text-success` : `text-destructive` |

**SKIP** (icon colors - keep as-is):

- Line 227: `text-red-600` on HeartPulse icon
- Line 270: `text-red-600` on TrendingDown icon
- Line 287: `text-green-600` on TrendingUp icon

**VALIDATE**:

```bash
grep -n "text-red-[0-9]\|text-green-[0-9]" app/routes/_auth/batches/\$batchId/index.tsx | grep -v "Icon\|icon\|className=\"h-4"
npx tsc --noEmit
```

---

### Task 5: UPDATE `app/routes/_auth/inventory/index.tsx` - Migrate colors

**Locations and changes**:

| Line | Before                        | After                                 |
| ---- | ----------------------------- | ------------------------------------- |
| 1054 | `text-red-600 font-bold`      | `text-destructive font-bold`          |
| 1088 | `text-red-600 border-red-500` | `text-destructive border-destructive` |

**VALIDATE**:

```bash
grep -n "text-red-[0-9]" app/routes/_auth/inventory/index.tsx
# Expected: 0
npx tsc --noEmit
```

---

### Task 6: UPDATE `app/routes/_auth/eggs/index.tsx` - Migrate colors

**Locations and changes**:

| Line | Before           | After          |
| ---- | ---------------- | -------------- |
| 404  | `text-green-600` | `text-success` |
| 513  | `text-green-600` | `text-success` |

**SKIP** (icon colors - keep as-is):

- Line 510: `text-green-600` on TrendingUp icon

**VALIDATE**:

```bash
grep -n "text-green-[0-9]" app/routes/_auth/eggs/index.tsx | grep -v "Icon\|icon"
npx tsc --noEmit
```

---

### Task 7: UPDATE `app/routes/_auth/onboarding/index.tsx` - Migrate colors

**Locations and changes**:

| Line | Before                        | After                        |
| ---- | ----------------------------- | ---------------------------- |
| 1323 | `bg-green-100 text-green-600` | `bg-success/10 text-success` |

**SKIP** (icon colors - keep as-is):

- Line 1348: `text-green-600` on Check icon

**VALIDATE**:

```bash
grep -n "text-green-[0-9]\|bg-green-[0-9]" app/routes/_auth/onboarding/index.tsx | grep -v "Icon\|icon\|Check"
npx tsc --noEmit
```

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
npx tsc --noEmit
bun run lint
```

### Level 2: Verify Changes

```bash
# Navigation fixes
grep "href: '/tasks'" app/components/navigation.tsx  # Should exist
grep -c "/vaccinations" app/components/navigation.tsx  # Should be 1-2

# Color migrations - count remaining hardcoded (should be ~5-8, all icons)
grep -rn "text-red-[0-9]\|text-green-[0-9]" app/routes/_auth --include="*.tsx" | grep -v "Icon\|icon\|className=\"h-" | wc -l
```

### Level 3: Build & Test

```bash
bun run build
bun run test --run
```

---

## ACCEPTANCE CRITERIA

- [ ] Tasks nav item points to `/tasks` not `/vaccinations`
- [ ] No duplicate vaccinations entries (only "Health" → `/vaccinations`)
- [ ] Eggs route in navigation
- [ ] Dashboard in Operations group
- [ ] All status colors use semantic tokens (`text-success`, `text-destructive`)
- [ ] Icon colors remain hardcoded (intentional)
- [ ] All validation commands pass
- [ ] 397 tests still passing

---

## COMPLETION CHECKLIST

- [ ] Task 1: getNavigationSections fixed
- [ ] Task 2: NAVIGATION_SECTIONS fixed
- [ ] Task 3: dashboard/index.tsx colors migrated
- [ ] Task 4: batches/$batchId/index.tsx colors migrated
- [ ] Task 5: inventory/index.tsx colors migrated
- [ ] Task 6: eggs/index.tsx colors migrated
- [ ] Task 7: onboarding/index.tsx colors migrated
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Build passes
- [ ] Tests pass

---

## NOTES

### Why Keep Icon Colors Hardcoded

Icon colors like `text-red-500` on `<TrendingDown>` or `text-green-600` on `<TrendingUp>` are intentional visual differentiation, not status indicators. They help users quickly identify the type of metric (mortality vs growth) regardless of the actual value.

### Navigation Philosophy

The new structure follows "Batch-Centric" philosophy:

- **Operations**: What you do every morning (Dashboard, Batches, Tasks)
- **Daily Ops**: High-frequency batch actions (Feed, Mortality, Weight, Health, Water, Eggs)
- **Inventory**: Resource tracking
- **Finance**: Money in/out
- **Network**: External relationships
- **Setup**: Configuration

### Confidence Score: 9/10

Simple string replacements with clear patterns. Only risk is missing an instance.
