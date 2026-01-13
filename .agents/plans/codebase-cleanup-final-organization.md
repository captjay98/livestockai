# Feature: Codebase Cleanup and Final Organization

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Comprehensive cleanup and final organization of the OpenLivestock Manager codebase to achieve a clean, maintainable structure following TanStack Start best practices. This includes consolidating tests, removing unused files, streamlining the features directory, and properly organizing components.

## User Story

As a developer working on OpenLivestock Manager
I want a clean, well-organized codebase with consistent patterns
So that I can easily navigate, maintain, and extend the application

## Problem Statement

After the recent reorganization, several cleanup tasks remain:

1. **Tests scattered everywhere** - Tests are co-located in features/, lib/db/, hooks/, and tests/
2. **Unused example files** - `example.tsx` and `component-example.tsx` are demo files not used in production
3. **Empty component directories** - Many `features/*/components/` directories are empty
4. **Feature components should be in components/** - Feature-specific dialogs/components should be in a structured components directory
5. **API routes structure** - Currently have `routes/api/auth/` which is empty; need to understand TanStack Start's recommended approach
6. **Inconsistent test naming** - Mix of `.test.ts` and `.property.test.ts` patterns

## Solution Statement

1. **Consolidate all tests** into a structured `tests/` directory mirroring the source structure
2. **Remove unused example files** that are not part of the production app
3. **Move feature components to components/** with proper organization
4. **Simplify features/** to only contain business logic (server functions, types, constants)
5. **Clean up API routes** - TanStack Start recommends server routes alongside app routes, not separate api/ folder
6. **Remove empty directories** throughout the codebase

## Feature Metadata

**Feature Type**: Refactor/Cleanup
**Estimated Complexity**: Medium
**Primary Systems Affected**: Test organization, components, features
**Dependencies**: None

---

## CONTEXT REFERENCES

### Current Test Locations (to be consolidated)

| Current Location  | Test Count | New Location        |
| ----------------- | ---------- | ------------------- |
| `app/features/*/` | 22 files   | `tests/features/*/` |
| `app/lib/db/`     | 5 files    | `tests/lib/db/`     |
| `app/hooks/`      | 1 file     | `tests/hooks/`      |
| `app/components/` | 1 file     | `tests/components/` |
| `tests/routes/`   | 2 files    | Keep as-is          |

### Files to Remove (Unused)

| File                                   | Reason                                                    |
| -------------------------------------- | --------------------------------------------------------- |
| `app/components/example.tsx`           | Demo wrapper component, not used                          |
| `app/components/component-example.tsx` | Large demo file showcasing UI components, not used in app |
| `app/routes/api/auth/`                 | Empty directory, Better Auth uses server functions        |
| `app/routes/api/`                      | Empty after removing auth/                                |
| `app/components/common/`               | Empty directory created but never used                    |

### Feature Components to Move to components/

| Current Location                                   | New Location                              |
| -------------------------------------------------- | ----------------------------------------- |
| `features/batches/components/batch-dialog.tsx`     | `components/dialogs/batch-dialog.tsx`     |
| `features/batches/components/projections-card.tsx` | `components/batches/projections-card.tsx` |
| `features/farms/components/farm-dialog.tsx`        | `components/dialogs/farm-dialog.tsx`      |
| `features/farms/components/edit-farm-dialog.tsx`   | `components/dialogs/edit-farm-dialog.tsx` |
| `features/farms/components/selector.tsx`           | `components/farms/selector.tsx`           |
| `features/sales/components/sale-dialog.tsx`        | `components/dialogs/sale-dialog.tsx`      |
| `features/expenses/components/expense-dialog.tsx`  | `components/dialogs/expense-dialog.tsx`   |
| `features/feed/components/feed-dialog.tsx`         | `components/dialogs/feed-dialog.tsx`      |
| `features/eggs/components/egg-dialog.tsx`          | `components/dialogs/egg-dialog.tsx`       |
| `features/settings/components/audit-log-table.tsx` | `components/settings/audit-log-table.tsx` |
| `features/modules/components/selector.tsx`         | `components/modules/selector.tsx`         |

### Empty Feature Component Directories to Remove

All `features/*/components/` directories that are empty after moving components:

- auth, customers, dashboard, export, finance, inventory, invoices, logging, monitoring, mortality, onboarding, reports, structures, suppliers, users, vaccinations, water-quality, weight

### Relevant Documentation

- [TanStack Start Server Routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
  - Server routes can be defined alongside app routes in the same file
  - No need for separate `/api/` directory
  - Use `server.handlers` property in route files for API endpoints

### Target Structure After Cleanup

```
app/
├── components/
│   ├── ui/                    # Base UI (shadcn)
│   ├── layout/                # Shell, sidebar
│   ├── dialogs/               # All feature dialogs
│   │   ├── batch-dialog.tsx
│   │   ├── farm-dialog.tsx
│   │   ├── edit-farm-dialog.tsx
│   │   ├── sale-dialog.tsx
│   │   ├── expense-dialog.tsx
│   │   ├── feed-dialog.tsx
│   │   └── egg-dialog.tsx
│   ├── batches/               # Batch-specific components
│   │   └── projections-card.tsx
│   ├── farms/                 # Farm-specific components
│   │   └── selector.tsx
│   ├── modules/               # Module-specific components
│   │   └── selector.tsx
│   ├── settings/              # Settings-specific components
│   │   └── audit-log-table.tsx
│   ├── navigation.tsx
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   ├── error-page.tsx
│   ├── not-found.tsx
│   ├── offline-indicator.tsx
│   ├── pwa-prompt.tsx
│   └── logo.tsx
├── features/                  # Business logic only (no components)
│   ├── auth/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   ├── config.ts
│   │   ├── middleware.ts
│   │   ├── server-middleware.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── batches/
│   │   ├── server.ts
│   │   ├── forecasting.ts
│   │   └── constants.ts
│   ├── farms/
│   │   ├── server.ts
│   │   └── context.tsx        # Contexts stay in features
│   ├── modules/
│   │   ├── server.ts
│   │   ├── context.tsx
│   │   ├── constants.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── settings/
│   │   ├── server.ts
│   │   ├── context.tsx
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   ├── formatters/
│   │   │   └── currency.ts
│   │   ├── currency-formatter.ts
│   │   ├── date-formatter.ts
│   │   ├── unit-converter.ts
│   │   └── currency-presets.ts
│   └── ... (other features - server.ts, types, constants only)
├── hooks/                     # Shared hooks only
│   └── useModuleNavigation.ts
├── lib/
│   ├── db/                    # Database layer
│   ├── utils.ts
│   └── query-client.ts
└── routes/                    # File-based routing (no api/ subdirectory)

tests/
├── features/                  # Feature tests
│   ├── batches/
│   │   └── batches.property.test.ts
│   ├── farms/
│   │   └── farms.property.test.ts
│   └── ... (mirrors features/)
├── lib/
│   └── db/
│       ├── seed.property.test.ts
│       ├── seed-dev.property.test.ts
│       ├── seed-helpers.test.ts
│       ├── seed-helpers.property.test.ts
│       └── persistence.property.test.ts
├── hooks/
│   └── useModuleNavigation.property.test.ts
├── components/
│   └── offline-indicator.test.tsx
└── routes/                    # Route tests (existing)
    ├── batches-new.property.test.ts
    └── dashboard.property.test.ts
```

---

## IMPLEMENTATION PLAN

### Phase 1: Remove Unused Files

Remove example/demo files that aren't used in production.

### Phase 2: Consolidate Tests

Move all tests from scattered locations to structured `tests/` directory.

### Phase 3: Move Feature Components to components/

Move all feature-specific components to the components directory with proper organization.

### Phase 4: Clean Up Empty Directories

Remove all empty directories created during reorganization.

### Phase 5: Clean Up API Routes

Remove empty api/ directory (TanStack Start uses server routes in route files).

### Phase 6: Update Imports and Validate

Update all imports and run full validation.

---

## STEP-BY-STEP TASKS

### Phase 1: Remove Unused Files

#### REMOVE unused example files

```bash
rm app/components/example.tsx
rm app/components/component-example.tsx
```

- **VALIDATE**: `ls app/components/example.tsx` should fail

---

### Phase 2: Consolidate Tests

#### CREATE test directory structure

```bash
mkdir -p tests/features/{auth,batches,customers,dashboard,eggs,expenses,export,farms,feed,finance,invoices,logging,modules,mortality,onboarding,reports,sales,settings,structures,suppliers,users,vaccinations,water-quality,weight}
mkdir -p tests/lib/db
mkdir -p tests/hooks
mkdir -p tests/components
```

#### MOVE feature tests to tests/features/

```bash
# Move all feature tests
mv app/features/batches/batches.property.test.ts tests/features/batches/
mv app/features/customers/customers.property.test.ts tests/features/customers/
mv app/features/dashboard/dashboard.property.test.ts tests/features/dashboard/
mv app/features/eggs/eggs.property.test.ts tests/features/eggs/
mv app/features/farms/farms.property.test.ts tests/features/farms/
mv app/features/feed/feed.property.test.ts tests/features/feed/
mv app/features/finance/finance.property.test.ts tests/features/finance/
mv app/features/invoices/invoices.property.test.ts tests/features/invoices/
mv app/features/logging/audit.test.ts tests/features/logging/
mv app/features/modules/modules.property.test.ts tests/features/modules/
mv app/features/modules/server.property.test.ts tests/features/modules/
mv app/features/mortality/mortality.property.test.ts tests/features/mortality/
mv app/features/onboarding/onboarding.property.test.ts tests/features/onboarding/
mv app/features/settings/currency-formatter.property.test.ts tests/features/settings/
mv app/features/settings/date-formatter.property.test.ts tests/features/settings/
mv app/features/settings/unit-converter.property.test.ts tests/features/settings/
mv app/features/settings/formatters/currency.test.ts tests/features/settings/
mv app/features/users/users.property.test.ts tests/features/users/
mv app/features/vaccinations/vaccinations.property.test.ts tests/features/vaccinations/
mv app/features/water-quality/water-quality.property.test.ts tests/features/water-quality/
mv app/features/weight/weight.property.test.ts tests/features/weight/
mv app/features/auth/auth.test.ts tests/features/auth/
```

#### MOVE lib/db tests to tests/lib/db/

```bash
mv app/lib/db/seed.property.test.ts tests/lib/db/
mv app/lib/db/seed-dev.property.test.ts tests/lib/db/
mv app/lib/db/seed-helpers.test.ts tests/lib/db/
mv app/lib/db/seed-helpers.property.test.ts tests/lib/db/
mv app/lib/db/persistence.property.test.ts tests/lib/db/
```

#### MOVE hooks test to tests/hooks/

```bash
mv app/hooks/useModuleNavigation.property.test.ts tests/hooks/
```

#### MOVE component test to tests/components/

```bash
mv app/components/offline-indicator.test.tsx tests/components/
```

#### UPDATE test imports

All moved tests need import path updates from relative to absolute:

- `../server` → `~/features/X/server`
- `../../lib/db` → `~/lib/db`
- etc.

- **VALIDATE**: `bun test` should still pass

---

### Phase 3: Move Feature Components to components/

#### CREATE component subdirectories

```bash
mkdir -p app/components/dialogs
mkdir -p app/components/batches
mkdir -p app/components/farms
mkdir -p app/components/modules
mkdir -p app/components/settings
```

#### MOVE dialog components

```bash
mv app/features/batches/components/batch-dialog.tsx app/components/dialogs/
mv app/features/farms/components/farm-dialog.tsx app/components/dialogs/
mv app/features/farms/components/edit-farm-dialog.tsx app/components/dialogs/
mv app/features/sales/components/sale-dialog.tsx app/components/dialogs/
mv app/features/expenses/components/expense-dialog.tsx app/components/dialogs/
mv app/features/feed/components/feed-dialog.tsx app/components/dialogs/
mv app/features/eggs/components/egg-dialog.tsx app/components/dialogs/
```

#### MOVE other feature components

```bash
mv app/features/batches/components/projections-card.tsx app/components/batches/
mv app/features/farms/components/selector.tsx app/components/farms/
mv app/features/modules/components/selector.tsx app/components/modules/
mv app/features/settings/components/audit-log-table.tsx app/components/settings/
```

#### UPDATE component imports

Update all imports from:

- `~/features/X/components/Y` → `~/components/X/Y` or `~/components/dialogs/Y`

- **VALIDATE**: `bun run check` should pass

---

### Phase 4: Clean Up Empty Directories

#### REMOVE empty feature component directories

```bash
# Remove all empty components directories in features
find app/features -type d -name "components" -empty -delete

# Also remove the formatters directory if empty after test move
rmdir app/features/settings/formatters 2>/dev/null || true
```

#### REMOVE empty common directory

```bash
rmdir app/components/common 2>/dev/null || true
```

- **VALIDATE**: `find app/features -type d -name "components" -empty` returns nothing

---

### Phase 5: Clean Up API Routes

#### REMOVE empty api directory

```bash
rmdir app/routes/api/auth 2>/dev/null || true
rmdir app/routes/api 2>/dev/null || true
```

- **NOTE**: TanStack Start recommends using `server.handlers` in route files for API endpoints, not a separate api/ directory
- **VALIDATE**: `ls app/routes/api` should fail

---

### Phase 6: Update Imports and Validate

#### UPDATE all imports for moved components

Use find/sed to update imports:

```bash
# Update dialog imports
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/batches/components/batch-dialog|~/components/dialogs/batch-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/farms/components/farm-dialog|~/components/dialogs/farm-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/farms/components/edit-farm-dialog|~/components/dialogs/edit-farm-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/sales/components/sale-dialog|~/components/dialogs/sale-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/expenses/components/expense-dialog|~/components/dialogs/expense-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/feed/components/feed-dialog|~/components/dialogs/feed-dialog|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/eggs/components/egg-dialog|~/components/dialogs/egg-dialog|g' {} \;

# Update other component imports
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/batches/components/projections-card|~/components/batches/projections-card|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/farms/components/selector|~/components/farms/selector|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/modules/components/selector|~/components/modules/selector|g' {} \;
find app -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's|~/features/settings/components/audit-log-table|~/components/settings/audit-log-table|g' {} \;
```

#### RUN full validation

```bash
bun run lint
bun run check
bun test
```

- **VALIDATE**: All commands pass

---

## TESTING STRATEGY

### Test Migration Validation

After moving tests:

1. Run `bun test` to ensure all tests still pass
2. Verify test count matches before/after (30 test files)
3. Check that vitest can find tests in new locations

### Import Validation

After updating imports:

1. Run `bun run check` for TypeScript validation
2. Run `bun run lint` for import order issues
3. Start dev server to verify runtime

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
bun run lint
bun run check
```

### Level 2: Tests

```bash
bun test
```

### Level 3: Structure Verification

```bash
# Verify no tests remain in app/
find app -name "*.test.ts" -o -name "*.test.tsx"

# Verify no empty component directories in features
find app/features -type d -name "components" -empty

# Verify api directory removed
ls app/routes/api 2>&1 | grep -q "No such file"
```

### Level 4: Manual Validation

```bash
bun dev
# Navigate to key routes to verify components render
```

---

## ACCEPTANCE CRITERIA

- [ ] All tests consolidated in `tests/` directory
- [ ] No test files remain in `app/` directory
- [ ] All feature components moved to `components/` directory
- [ ] No empty `components/` directories in `features/`
- [ ] Unused example files removed
- [ ] Empty `api/` directory removed
- [ ] All imports updated correctly
- [ ] All tests pass
- [ ] No TypeScript errors
- [ ] No linting errors

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Unused files removed
- [ ] Phase 2: Tests consolidated
- [ ] Phase 3: Feature components moved
- [ ] Phase 4: Empty directories removed
- [ ] Phase 5: API routes cleaned up
- [ ] Phase 6: Imports updated and validated
- [ ] All validation commands pass
- [ ] Manual testing confirms app works

---

## NOTES

### Why Consolidate Tests?

1. **Discoverability**: All tests in one place, easy to find
2. **CI/CD**: Simpler test configuration
3. **Separation of concerns**: Source code separate from test code
4. **Industry standard**: Most projects keep tests separate

### Why Move Components Out of Features?

1. **Consistency**: All UI components in one place
2. **Reusability**: Easier to share components across features
3. **Features = Business Logic**: Features should focus on server functions, types, and business logic
4. **Components = UI**: Components directory is the natural home for all UI

### API Routes in TanStack Start

According to TanStack Start docs:

- Server routes can be defined **alongside app routes** in the same file
- Use `server.handlers` property in `createFileRoute`
- No need for separate `/api/` directory
- This project uses server functions (`createServerFn`) which is the recommended approach

### Contexts Stay in Features

React contexts (`context.tsx`) should stay in features because:

- They're tightly coupled to feature business logic
- They often import from feature server functions
- They're not reusable UI components

### Test Import Updates

When moving tests, imports need to change from relative to absolute:

```typescript
// Before (in app/features/batches/)
import { something } from '../server'

// After (in tests/features/batches/)
import { something } from '~/features/batches/server'
```

### Estimated Time

- Phase 1: 2 minutes
- Phase 2: 15 minutes (many files + import updates)
- Phase 3: 10 minutes
- Phase 4: 2 minutes
- Phase 5: 1 minute
- Phase 6: 10 minutes

**Total: ~40 minutes**
