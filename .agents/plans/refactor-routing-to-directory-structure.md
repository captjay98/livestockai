# Feature: Refactor Routing to Directory-Based Structure

The following plan should be complete, but its important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Refactor the current flat routing structure from `_auth.feature.action.tsx` files to a directory-based structure using `_auth/feature/action.tsx` pattern. This improves code organization, makes the project structure more intuitive, and follows modern file-based routing conventions.

## User Story

As a developer working on the OpenLivestock Manager codebase
I want routes organized in a directory-based structure
So that I can easily navigate, maintain, and scale the routing system with better organization

## Problem Statement

The current routing structure uses a flat file naming convention (`_auth.batches.index.tsx`, `_auth.farms.new.tsx`, etc.) which becomes difficult to navigate and maintain as the application grows. With 40+ route files, the flat structure makes it hard to understand feature boundaries and relationships.

## Solution Statement

Transform the flat routing structure to a directory-based hierarchy where related routes are grouped in folders. This maintains the same URL structure while improving developer experience and code organization.

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: Medium
**Primary Systems Affected**: Routing system, file organization
**Dependencies**: TanStack Router (existing)

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `app/routes/_auth.tsx` (lines 1-50) - Why: Main auth layout route that will remain unchanged
- `app/routes/_auth.dashboard.tsx` (lines 1-20) - Why: Example of current route pattern to follow
- `app/routes/_auth.batches.index.tsx` (lines 1-20) - Why: Example of index route pattern
- `app/routes/_auth.batches.$batchId.index.tsx` - Why: Example of dynamic route pattern
- `app/routes/_auth.settings.tsx` - Why: Example of feature root route
- `app/routes/_auth.settings.users.tsx` - Why: Example of nested feature route

### New Directory Structure to Create

```
app/routes/_auth/
├── dashboard.tsx
├── batches/
│   ├── index.tsx
│   ├── new.tsx
│   └── $batchId/
│       └── index.tsx
├── farms/
│   ├── index.tsx
│   ├── new.tsx
│   └── $farmId/
│       ├── index.tsx
│       └── tsx (if exists)
├── sales/
│   ├── index.tsx
│   └── new.tsx
├── customers/
│   ├── index.tsx
│   ├── new.tsx
│   └── $customerId.tsx
├── suppliers/
│   ├── index.tsx
│   ├── new.tsx
│   └── $supplierId.tsx
├── settings/
│   ├── index.tsx
│   ├── users.tsx
│   ├── audit.tsx
│   └── modules.tsx
├── reports/
│   ├── index.tsx
│   └── export.tsx
├── invoices/
│   ├── index.tsx
│   ├── new.tsx
│   └── $invoiceId.tsx
├── expenses/
│   ├── index.tsx
│   └── new.tsx
├── inventory.tsx
├── feed/
│   ├── index.tsx
│   └── new.tsx
├── weight/
│   ├── index.tsx
│   └── new.tsx
├── mortality.tsx
├── vaccinations/
│   ├── index.tsx
│   └── new.tsx
├── water-quality/
│   ├── index.tsx
│   └── new.tsx
├── eggs/
│   ├── index.tsx
│   └── new.tsx
└── onboarding.tsx
```

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
    - Specific section: Directory-based routing
    - Why: Shows how directory structure maps to routes
- [TanStack Router Route Trees](https://tanstack.com/router/latest/docs/framework/react/guide/route-trees)
    - Specific section: Nested routes
    - Why: Explains parent-child route relationships

### Patterns to Follow

**File Naming Convention:**

- Index routes: `index.tsx` (maps to `/feature`)
- Action routes: `action.tsx` (maps to `/feature/action`)
- Dynamic routes: `$param.tsx` or `$param/index.tsx`

**Route Definition Pattern:**

```typescript
export const Route = createFileRoute('/_auth/feature/action')({
    component: ComponentName,
    // ... other route options
})
```

**Import Pattern:**

```typescript
import { createFileRoute } from '@tanstack/react-router'
// Other imports remain the same
```

---

## IMPLEMENTATION PLAN

### Phase 1: Directory Structure Setup

Create the new directory structure within `app/routes/_auth/` to organize routes by feature.

**Tasks:**

- Create all necessary directories for each feature
- Ensure proper nesting for dynamic routes

### Phase 2: File Migration

Move all existing `_auth.feature.action.tsx` files to their new directory locations while preserving all content.

**Tasks:**

- Move files to new locations following the mapping
- Update route paths in createFileRoute calls
- Preserve all existing functionality and imports

### Phase 3: Route Path Updates

Update the route path strings in createFileRoute calls to match the new directory structure.

**Tasks:**

- Update route paths from flat to directory-based
- Ensure dynamic routes maintain correct parameter names
- Verify nested route relationships

### Phase 4: Testing & Validation

Verify that all routes work correctly after the refactoring.

**Tasks:**

- Test all route navigation
- Verify dynamic routes work with parameters
- Check that nested layouts still function
- Validate no broken links or imports

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE app/routes/\_auth/ directory structure

- **IMPLEMENT**: Create all necessary directories for organized routing
- **PATTERN**: Follow TanStack Router directory conventions
- **VALIDATE**: `ls -la app/routes/_auth/` should show directory structure

### CREATE app/routes/\_auth/dashboard.tsx

- **IMPLEMENT**: Move \_auth.dashboard.tsx to \_auth/dashboard.tsx
- **PATTERN**: Update createFileRoute path from '/\_auth/dashboard' to '/\_auth/dashboard'
- **IMPORTS**: Keep all existing imports unchanged
- **VALIDATE**: `bun dev` and navigate to /dashboard

### CREATE app/routes/\_auth/batches/ directory and files

- **IMPLEMENT**: Move batch-related routes to batches directory
- **PATTERN**:
    - `_auth.batches.index.tsx` → `_auth/batches/index.tsx`
    - `_auth.batches.new.tsx` → `_auth/batches/new.tsx`
    - `_auth.batches.$batchId.index.tsx` → `_auth/batches/$batchId/index.tsx`
- **IMPORTS**: Update createFileRoute paths accordingly
- **VALIDATE**: `bun dev` and test /batches, /batches/new, /batches/123

### CREATE app/routes/\_auth/farms/ directory and files

- **IMPLEMENT**: Move farm-related routes to farms directory
- **PATTERN**:
    - `_auth.farms.index.tsx` → `_auth/farms/index.tsx`
    - `_auth.farms.tsx` → `_auth/farms/index.tsx` (merge if needed)
    - `_auth.farms.new.tsx` → `_auth/farms/new.tsx`
    - `_auth.farms.$farmId.index.tsx` → `_auth/farms/$farmId/index.tsx`
    - `_auth.farms.$farmId.tsx` → `_auth/farms/$farmId.tsx` (if different from index)
- **IMPORTS**: Update createFileRoute paths
- **VALIDATE**: Test /farms routes and dynamic farm pages

### CREATE app/routes/\_auth/sales/ directory and files

- **IMPLEMENT**: Move sales-related routes
- **PATTERN**:
    - `_auth.sales.tsx` → `_auth/sales/index.tsx`
    - `_auth.sales.new.tsx` → `_auth/sales/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test /sales and /sales/new

### CREATE app/routes/\_auth/customers/ directory and files

- **IMPLEMENT**: Move customer-related routes
- **PATTERN**:
    - `_auth.customers.tsx` → `_auth/customers/index.tsx`
    - `_auth.customers.new.tsx` → `_auth/customers/new.tsx`
    - `_auth.customers.$customerId.tsx` → `_auth/customers/$customerId.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test customer routes including dynamic customer pages

### CREATE app/routes/\_auth/suppliers/ directory and files

- **IMPLEMENT**: Move supplier-related routes
- **PATTERN**:
    - `_auth.suppliers.tsx` → `_auth/suppliers/index.tsx`
    - `_auth.suppliers.new.tsx` → `_auth/suppliers/new.tsx`
    - `_auth.suppliers.$supplierId.tsx` → `_auth/suppliers/$supplierId.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test supplier routes

### CREATE app/routes/\_auth/settings/ directory and files

- **IMPLEMENT**: Move settings-related routes
- **PATTERN**:
    - `_auth.settings.tsx` → `_auth/settings/index.tsx`
    - `_auth.settings.users.tsx` → `_auth/settings/users.tsx`
    - `_auth.settings.audit.tsx` → `_auth/settings/audit.tsx`
    - `_auth.settings.modules.tsx` → `_auth/settings/modules.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test all settings pages

### CREATE app/routes/\_auth/reports/ directory and files

- **IMPLEMENT**: Move report-related routes
- **PATTERN**:
    - `_auth.reports.tsx` → `_auth/reports/index.tsx`
    - `_auth.reports.export.tsx` → `_auth/reports/export.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test reports functionality

### CREATE app/routes/\_auth/invoices/ directory and files

- **IMPLEMENT**: Move invoice-related routes
- **PATTERN**:
    - `_auth.invoices.tsx` → `_auth/invoices/index.tsx`
    - `_auth.invoices.new.tsx` → `_auth/invoices/new.tsx`
    - `_auth.invoices.$invoiceId.tsx` → `_auth/invoices/$invoiceId.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test invoice routes including dynamic invoice pages

### CREATE app/routes/\_auth/expenses/ directory and files

- **IMPLEMENT**: Move expense-related routes
- **PATTERN**:
    - `_auth.expenses.tsx` → `_auth/expenses/index.tsx`
    - `_auth.expenses.new.tsx` → `_auth/expenses/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test expense routes

### CREATE app/routes/\_auth/feed/ directory and files

- **IMPLEMENT**: Move feed-related routes
- **PATTERN**:
    - `_auth.feed.tsx` → `_auth/feed/index.tsx`
    - `_auth.feed.new.tsx` → `_auth/feed/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test feed routes

### CREATE app/routes/\_auth/weight/ directory and files

- **IMPLEMENT**: Move weight-related routes
- **PATTERN**:
    - `_auth.weight.tsx` → `_auth/weight/index.tsx`
    - `_auth.weight.new.tsx` → `_auth/weight/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test weight tracking routes

### CREATE app/routes/\_auth/vaccinations/ directory and files

- **IMPLEMENT**: Move vaccination-related routes
- **PATTERN**:
    - `_auth.vaccinations.tsx` → `_auth/vaccinations/index.tsx`
    - `_auth.vaccinations.new.tsx` → `_auth/vaccinations/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test vaccination routes

### CREATE app/routes/\_auth/water-quality/ directory and files

- **IMPLEMENT**: Move water quality routes
- **PATTERN**:
    - `_auth.water-quality.tsx` → `_auth/water-quality/index.tsx`
    - `_auth.water-quality.new.tsx` → `_auth/water-quality/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test water quality routes

### CREATE app/routes/\_auth/eggs/ directory and files

- **IMPLEMENT**: Move egg-related routes
- **PATTERN**:
    - `_auth.eggs.tsx` → `_auth/eggs/index.tsx`
    - `_auth.eggs.new.tsx` → `_auth/eggs/new.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test egg tracking routes

### CREATE remaining single-file routes

- **IMPLEMENT**: Move remaining single routes
- **PATTERN**:
    - `_auth.inventory.tsx` → `_auth/inventory.tsx`
    - `_auth.mortality.tsx` → `_auth/mortality.tsx`
    - `_auth.onboarding.tsx` → `_auth/onboarding.tsx`
- **IMPORTS**: Update route paths
- **VALIDATE**: Test each individual route

### REMOVE old flat route files

- **IMPLEMENT**: Delete all original `_auth.*.tsx` files (except `_auth.tsx` layout)
- **PATTERN**: Only remove files after confirming new structure works
- **GOTCHA**: Keep `_auth.tsx` as it's the layout route
- **VALIDATE**: `ls app/routes/_auth.*` should only show `_auth.tsx`

### UPDATE any hardcoded route references

- **IMPLEMENT**: Search for and update any hardcoded route paths in components
- **PATTERN**: Look for Link components, navigate calls, or route strings
- **IMPORTS**: Search codebase for old route paths
- **VALIDATE**: `grep -r "_auth\." app/` should find minimal references

---

## TESTING STRATEGY

### Manual Navigation Testing

Test each route category systematically to ensure all routes work correctly after refactoring.

### Route Parameter Testing

Verify that all dynamic routes (with $parameters) still receive and handle parameters correctly.

### Layout Inheritance Testing

Confirm that the `_auth.tsx` layout still applies to all nested routes properly.

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
bun run lint
bun run check
```

### Level 2: Build Validation

```bash
bun run build
```

### Level 3: Development Server

```bash
bun dev
# Test navigation to each major route section
```

### Level 4: Manual Validation

Test each route category:

- Dashboard: `/dashboard`
- Batches: `/batches`, `/batches/new`, `/batches/[id]`
- Farms: `/farms`, `/farms/new`, `/farms/[id]`
- Sales: `/sales`, `/sales/new`
- Settings: `/settings`, `/settings/users`, `/settings/audit`, `/settings/modules`
- All other feature routes

### Level 5: Route Structure Validation

```bash
# Verify new structure exists
find app/routes/_auth -type f -name "*.tsx" | head -20

# Verify old flat files are removed (except _auth.tsx)
ls app/routes/_auth.*.tsx
```

---

## ACCEPTANCE CRITERIA

- [ ] All routes maintain the same URL structure and functionality
- [ ] Directory structure follows the planned organization
- [ ] All dynamic routes work with parameters
- [ ] No broken links or navigation issues
- [ ] Build process completes without errors
- [ ] All validation commands pass
- [ ] Old flat route files are removed (except layout)
- [ ] Route definitions use correct new paths
- [ ] No hardcoded route references remain
- [ ] Authentication and layout inheritance still works

---

## COMPLETION CHECKLIST

- [ ] All directories created with proper structure
- [ ] All route files moved to new locations
- [ ] Route paths updated in createFileRoute calls
- [ ] Dynamic routes maintain parameter handling
- [ ] Old flat files removed (except \_auth.tsx)
- [ ] Manual testing confirms all routes work
- [ ] Build process succeeds
- [ ] No linting or type errors
- [ ] Navigation between routes functions correctly
- [ ] Layout and authentication still apply properly

---

## NOTES

**Critical Considerations:**

- The `_auth.tsx` file must remain as the layout route
- Route URLs will remain exactly the same for users
- Only file organization changes, not functionality
- TanStack Router automatically handles the new structure
- Dynamic routes must maintain parameter names and handling

**Risk Mitigation:**

- Test each route category immediately after moving
- Keep backup of original structure until validation complete
- Verify authentication still works across all routes
- Check that nested layouts and providers still function

**Performance Impact:**

- No performance impact expected
- Bundle splitting may improve with better organization
- Development experience will be significantly better
