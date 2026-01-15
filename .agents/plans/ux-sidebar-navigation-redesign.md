# Feature: UX Improvements - Sidebar Navigation & Page Clarity

The following plan should be complete, but validate documentation and codebase patterns before implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files.

## Feature Description

Comprehensive UX overhaul to make the application more intuitive for first-time users. The current flat navigation with 17 items is overwhelming. Pages lack context about their purpose. This plan addresses navigation clarity, page headers, and empty states.

## User Story

As a **first-time farmer using the app**
I want to **understand what each section does and how to navigate**
So that **I can quickly find and use the features I need without confusion**

## Problem Statement

1. **Navigation overload**: 17 flat items with no logical grouping
2. **No page context**: Pages don't explain their purpose or when to use them
3. **Weak empty states**: Just "No X found" without guidance
4. **No workflow guidance**: Users don't know what to do next

## Solution Statement

1. **Grouped sidebar navigation** with collapsible sections (Overview, Daily Ops, Finance, Contacts, Setup)
2. **Page headers** with descriptions explaining each page's purpose
3. **Rich empty states** with contextual guidance and CTAs
4. **Consistent patterns** across all pages

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Navigation, Layout, All route pages
**Dependencies**: None (uses existing UI components)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING

- `app/components/navigation.tsx` (lines 1-50) - Current flat navigation array, needs restructuring
- `app/components/layout/sidebar.tsx` (lines 1-120) - Current sidebar rendering, needs section support
- `app/components/layout/shell.tsx` - AppShell wrapper, no changes needed
- `app/components/ui/collapsible.tsx` - Collapsible component for sections
- `app/hooks/useModuleNavigation.ts` - Module-based filtering logic, needs update
- `app/features/modules/constants.ts` (lines 140-180) - CORE_NAVIGATION and MODULE_NAVIGATION arrays
- `app/components/ui/data-table.tsx` (lines 30-55) - Empty state props pattern

### New Files to Create

- `app/components/layout/nav-section.tsx` - Collapsible navigation section component
- `app/components/page-header.tsx` - Reusable page header with description

### Files to Update

- `app/components/navigation.tsx` - Restructure to grouped navigation
- `app/components/layout/sidebar.tsx` - Render grouped sections
- `app/features/modules/constants.ts` - Update navigation structure
- All route `index.tsx` files (~15) - Add page headers and improve empty states

### Patterns to Follow

**Naming Conventions:**

- Components: PascalCase (`NavSection`, `PageHeader`)
- Files: kebab-case (`nav-section.tsx`, `page-header.tsx`)
- Props interfaces: `{ComponentName}Props`

**Component Pattern:**

```typescript
interface NavSectionProps {
  title: string
  items: Array<NavigationItem>
  defaultOpen?: boolean
}

export function NavSection({
  title,
  items,
  defaultOpen = true,
}: NavSectionProps) {
  // Use Collapsible from ~/components/ui/collapsible
}
```

**Empty State Pattern (from DataTable):**

```typescript
emptyIcon={<Icon className="h-12 w-12 text-muted-foreground" />}
emptyTitle="No records"
emptyDescription="Get started by creating your first record."
```

---

## IMPLEMENTATION PLAN

### Phase 1: Navigation Structure

Create grouped navigation data structure and section component.

**Tasks:**

- Define navigation groups with sections
- Create NavSection component with collapsible behavior
- Update sidebar to render sections

### Phase 2: Page Header Component

Create reusable page header with title and description.

**Tasks:**

- Create PageHeader component
- Define page descriptions for all routes
- Apply to all route pages

### Phase 3: Empty State Enhancement

Improve empty states with better guidance.

**Tasks:**

- Update empty state descriptions to be actionable
- Add "What is this?" context where helpful
- Ensure CTAs are clear

### Phase 4: Integration & Testing

Wire everything together and verify.

**Tasks:**

- Test navigation on mobile
- Verify module filtering still works
- Check all pages render correctly

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `app/components/layout/nav-section.tsx`

Create collapsible navigation section component.

```typescript
import { ChevronDown } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible'
import { cn } from '~/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
}

interface NavSectionProps {
  title: string
  items: Array<NavItem>
  defaultOpen?: boolean
  onItemClick?: () => void
}

export function NavSection({ title, items, defaultOpen = true, onItemClick }: NavSectionProps) {
  const location = useLocation()

  if (items.length === 0) return null

  return (
    <Collapsible defaultOpen={defaultOpen} className="space-y-1">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=closed]_&]:rotate-[-90deg]" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname.startsWith(item.href) &&
            (item.href !== '/' || location.pathname === '/')
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onItemClick}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
              {item.name}
            </Link>
          )
        })}
      </CollapsibleContent>
    </Collapsible>
  )
}
```

- **VALIDATE**: `bun run check`

### Task 2: UPDATE `app/components/navigation.tsx`

Restructure navigation into grouped sections.

```typescript
// Replace flat navigation array with grouped structure
export const NAVIGATION_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Daily Operations',
    items: [
      { name: 'Batches', href: '/batches', icon: Package },
      { name: 'Feed', href: '/feed', icon: Wheat },
      { name: 'Mortality', href: '/mortality', icon: TrendingDown },
      { name: 'Weight', href: '/weight', icon: Scale },
      { name: 'Health', href: '/vaccinations', icon: Syringe },
      { name: 'Water', href: '/water-quality', icon: Droplets },
      { name: 'Inventory', href: '/inventory', icon: Warehouse },
    ],
  },
  {
    title: 'Finance',
    items: [
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Expenses', href: '/expenses', icon: Receipt },
      { name: 'Invoices', href: '/invoices', icon: FileText },
    ],
  },
  {
    title: 'Contacts',
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

// Keep flat navigation for backward compatibility and module filtering
export const navigation = NAVIGATION_SECTIONS.flatMap(
  (section) => section.items,
)
```

- **IMPORTS**: Keep existing imports, add none
- **VALIDATE**: `bun run check`

### Task 3: UPDATE `app/features/modules/constants.ts`

Update CORE_NAVIGATION to match new structure.

```typescript
// Update CORE_NAVIGATION to include all non-livestock-specific items
export const CORE_NAVIGATION = [
  'Dashboard',
  'Reports',
  'Sales',
  'Expenses',
  'Invoices',
  'Customers',
  'Suppliers',
  'Farms',
  'Settings',
]
```

- **VALIDATE**: `bun run check`

### Task 4: UPDATE `app/components/layout/sidebar.tsx`

Replace flat navigation with grouped sections.

```typescript
// Add import
import { NavSection } from './nav-section'
import { NAVIGATION_SECTIONS } from '~/components/navigation'
import { useModuleNavigation } from '~/hooks/useModuleNavigation'

// In the Sidebar component, replace the nav section with:
const filteredSections = NAVIGATION_SECTIONS.map(section => ({
  ...section,
  items: useModuleNavigation(section.items)
})).filter(section => section.items.length > 0)

// Replace the <nav> element with:
<div className="flex-1 overflow-y-auto px-3 py-2 no-scrollbar space-y-4">
  {filteredSections.map((section) => (
    <NavSection
      key={section.title}
      title={section.title}
      items={section.items}
      defaultOpen={section.title !== 'Setup'}
      onItemClick={onClose}
    />
  ))}
</div>
```

- **GOTCHA**: Must call useModuleNavigation at component level, not inside map
- **VALIDATE**: `bun run check && bun dev` (visual check)

### Task 5: CREATE `app/components/page-header.tsx`

Create reusable page header component.

```typescript
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  actions?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
```

- **VALIDATE**: `bun run check`

### Task 6: Define page descriptions constant

Create a constants file for page metadata.

```typescript
// Add to app/components/page-header.tsx or create app/lib/page-metadata.ts

export const PAGE_METADATA: Record<
  string,
  { title: string; description: string }
> = {
  '/batches': {
    title: 'Livestock Batches',
    description:
      'Track groups of animals from acquisition to sale. Each batch represents a cohort you manage together.',
  },
  '/feed': {
    title: 'Feed Records',
    description:
      'Log daily feed consumption to track costs and calculate feed conversion ratios.',
  },
  '/mortality': {
    title: 'Mortality Records',
    description:
      'Record deaths to monitor flock health and identify potential issues early.',
  },
  '/weight': {
    title: 'Weight Samples',
    description:
      'Track growth by recording periodic weight samples. Compare against industry standards.',
  },
  '/vaccinations': {
    title: 'Health Records',
    description:
      'Log vaccinations and treatments to maintain health schedules and compliance.',
  },
  '/water-quality': {
    title: 'Water Quality',
    description:
      'Monitor pond conditions (pH, temperature, oxygen) to ensure optimal fish health.',
  },
  '/sales': {
    title: 'Sales',
    description:
      'Record sales transactions and track revenue by customer and product type.',
  },
  '/expenses': {
    title: 'Expenses',
    description:
      'Track all farm costs to understand profitability and manage cash flow.',
  },
  '/invoices': {
    title: 'Invoices',
    description: 'Generate and manage customer invoices. Track payment status.',
  },
  '/customers': {
    title: 'Customers',
    description: 'Manage your buyer contacts and view their purchase history.',
  },
  '/suppliers': {
    title: 'Suppliers',
    description:
      'Track vendors for feed, chicks, fingerlings, and other supplies.',
  },
  '/inventory': {
    title: 'Inventory',
    description:
      'Monitor feed and medication stock levels. Get alerts when running low.',
  },
  '/farms': {
    title: 'Farms',
    description:
      'Manage your farm locations and configure which livestock types each supports.',
  },
  '/reports': {
    title: 'Reports',
    description:
      'Generate profit/loss statements, inventory reports, and performance analytics.',
  },
}
```

- **VALIDATE**: `bun run check`

### Task 7: UPDATE route pages with PageHeader

Update each route to use PageHeader. Example for batches:

```typescript
// app/routes/_auth/batches/index.tsx
import { PageHeader } from '~/components/page-header'
import { Package, Plus } from 'lucide-react'

// Replace existing header with:
<PageHeader
  title="Livestock Batches"
  description="Track groups of animals from acquisition to sale. Each batch represents a cohort you manage together."
  icon={Package}
  actions={
    <Button onClick={() => setBatchDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Add Batch
    </Button>
  }
/>
```

Apply similar pattern to all route pages:

- `app/routes/_auth/feed/index.tsx`
- `app/routes/_auth/mortality/index.tsx`
- `app/routes/_auth/weight/index.tsx`
- `app/routes/_auth/vaccinations/index.tsx`
- `app/routes/_auth/water-quality/index.tsx`
- `app/routes/_auth/sales/index.tsx`
- `app/routes/_auth/expenses/index.tsx`
- `app/routes/_auth/invoices/index.tsx`
- `app/routes/_auth/customers/index.tsx`
- `app/routes/_auth/suppliers/index.tsx`
- `app/routes/_auth/inventory/index.tsx`
- `app/routes/_auth/farms/index.tsx`
- `app/routes/_auth/reports/index.tsx`

- **VALIDATE**: `bun run check`

### Task 8: UPDATE empty state descriptions

Make empty states more helpful. Update DataTable props in each route:

```typescript
// Example for batches
emptyIcon={<Package className="h-12 w-12 text-muted-foreground" />}
emptyTitle="No batches yet"
emptyDescription="Batches help you track groups of animals. Create your first batch to start recording feed, mortality, and growth data."

// Example for feed
emptyTitle="No feed records"
emptyDescription="Record daily feed consumption to track costs and calculate your feed conversion ratio (FCR)."

// Example for mortality
emptyTitle="No mortality records"
emptyDescription="Recording deaths helps you monitor flock health. Hopefully you won't need this often!"

// Example for sales
emptyTitle="No sales yet"
emptyDescription="Record sales to track revenue and generate invoices for your customers."
```

- **VALIDATE**: `bun run check`

### Task 9: FIX sidebar hook usage

The useModuleNavigation hook must be called correctly (not inside map).

```typescript
// In sidebar.tsx, create a wrapper component or use useMemo
import { useMemo } from 'react'

// Inside Sidebar component:
const { enabledModules } = useModules()

const filteredSections = useMemo(() => {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: filterNavigationByModules(section.items, enabledModules),
  })).filter((section) => section.items.length > 0)
}, [enabledModules])
```

- **IMPORTS**: `import { filterNavigationByModules } from '~/hooks/useModuleNavigation'`
- **IMPORTS**: `import { useModules } from '~/features/modules/context'`
- **VALIDATE**: `bun run check`

### Task 10: Test and verify

Run full validation suite.

- **VALIDATE**: `bun run check && bun test`
- **VALIDATE**: Manual test - navigate all pages, check mobile menu

---

## TESTING STRATEGY

### Unit Tests

No new unit tests required - existing module navigation tests cover filtering logic.

### Integration Tests

Manual testing:

1. Navigate through all sidebar sections
2. Verify collapsible behavior works
3. Check module filtering still hides irrelevant items
4. Test on mobile (drawer behavior)

### Edge Cases

- Empty sections should not render
- Single-item sections should still be collapsible
- Active state should highlight correctly in collapsed sections

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run check
```

### Level 2: Type Checking

```bash
npx tsc --noEmit
```

### Level 3: Tests

```bash
bun test
```

### Level 4: Manual Validation

1. Start dev server: `bun dev`
2. Navigate to each page via sidebar
3. Collapse/expand sections
4. Check mobile menu (resize browser or use devtools)
5. Verify empty states show correct messages

---

## ACCEPTANCE CRITERIA

- [ ] Sidebar shows 5 collapsible sections (Overview, Daily Ops, Finance, Contacts, Setup)
- [ ] Sections collapse/expand smoothly
- [ ] Module filtering still works (disabled modules hidden)
- [ ] All pages have PageHeader with title and description
- [ ] Empty states have helpful, actionable descriptions
- [ ] Mobile drawer works correctly
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All existing tests pass

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] `bun run check` passes
- [ ] `bun test` passes
- [ ] Manual testing confirms navigation works
- [ ] Mobile responsive behavior verified
- [ ] Code follows project conventions

---

## NOTES

### Design Decisions

1. **Section order**: Overview first (most used), Setup last (one-time config)
2. **Default open**: All sections open except Setup (less frequently used)
3. **Collapsible on mobile too**: Consistent behavior across devices

### Future Enhancements

- Add keyboard navigation (arrow keys)
- Remember collapsed state in localStorage
- Add section badges (e.g., "3 alerts" on Daily Ops)

### Risk Mitigation

- Keep flat `navigation` array for backward compatibility
- Module filtering logic unchanged, just applied per-section
- Existing tests should still pass
