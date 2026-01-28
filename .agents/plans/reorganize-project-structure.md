# Feature: Reorganize Project Structure to Feature-Based Architecture

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Reorganize the OpenLivestock Manager codebase from a scattered lib/-heavy structure to a feature-based architecture following TanStack Start best practices. This improves maintainability, makes features self-contained, and follows modern React/TanStack conventions.

## User Story

As a developer working on OpenLivestock Manager
I want features organized as self-contained modules
So that I can easily find, modify, and maintain related code without jumping between directories

## Problem Statement

The current structure has several issues:

1. **lib/ is overloaded** - Contains server functions, contexts, constants, types, and tests all mixed together
2. **Features are scattered** - Related code (components, hooks, server functions) spread across multiple directories
3. **Inconsistent organization** - Some features have dedicated directories, others are standalone files
4. **Contexts scattered** - React contexts in both components/ and lib/ directories
5. **Tests co-located inconsistently** - Some in lib/, some in tests/

### Current Structure (Problematic)

```
app/
├── components/
│   ├── ui/                    # ✅ Good - shared UI
│   ├── layout/                # ✅ Good - shared layout
│   ├── dialogs/               # ❌ Feature-specific, should be with features
│   │   ├── batch-dialog.tsx
│   │   ├── sale-dialog.tsx
│   │   └── ...
│   ├── batches/               # ⚠️ Inconsistent - only one feature has this
│   ├── settings/              # ⚠️ Inconsistent - settings logic in lib/
│   ├── farm-context.tsx       # ❌ Context should be with feature
│   └── module-context.tsx     # ❌ Context should be with feature
├── lib/
│   ├── db/                    # ✅ Good - shared database layer
│   ├── auth/                  # ⚠️ Mix of server + client + config
│   ├── batches/               # ⚠️ Server functions + tests + constants
│   ├── farms/                 # ⚠️ Server functions + tests
│   ├── settings/              # ⚠️ Server + context + formatters + tests
│   ├── onboarding/            # ⚠️ Server + context + types
│   ├── currency.ts            # ⚠️ Should be in shared utils or settings
│   └── ... (25+ feature directories)
├── hooks/                     # ✅ Good - shared hooks
└── routes/                    # ✅ Good - file-based routing
```

## Solution Statement

Adopt a **feature-based architecture** where each domain feature is self-contained:

### Target Structure

```
app/
├── components/               # ONLY shared/reusable UI components
│   ├── ui/                   # Base UI components (shadcn)
│   ├── layout/               # Shell, sidebar, navigation
│   └── common/               # Shared app components (error-page, not-found)
├── features/                 # Self-contained feature modules
│   ├── auth/
│   │   ├── components/       # Auth-specific components
│   │   ├── server.ts         # Server functions
│   │   ├── client.ts         # Client utilities
│   │   ├── config.ts         # Auth configuration
│   │   └── types.ts
│   ├── batches/
│   │   ├── components/       # BatchDialog, ProjectionsCard
│   │   ├── hooks/            # useBatches, useBatchMutations
│   │   ├── server.ts         # Server functions
│   │   ├── forecasting.ts    # Business logic
│   │   ├── constants.ts
│   │   └── types.ts
│   ├── farms/
│   │   ├── components/       # FarmDialog, EditFarmDialog
│   │   ├── context.tsx       # FarmProvider, useFarm
│   │   ├── server.ts
│   │   └── types.ts
│   ├── settings/
│   │   ├── components/       # AuditLogTable
│   │   ├── context.tsx       # SettingsProvider
│   │   ├── server.ts
│   │   ├── formatters/       # currency, date, unit formatters
│   │   └── hooks.ts
│   ├── modules/
│   │   ├── context.tsx       # ModuleProvider
│   │   ├── server.ts
│   │   ├── constants.ts
│   │   └── utils.ts
│   └── ... (other features)
├── lib/                      # ONLY truly shared utilities
│   ├── db/                   # Database layer (unchanged)
│   ├── utils.ts              # Generic utilities (cn, etc.)
│   └── query-client.ts       # TanStack Query config
├── hooks/                    # ONLY shared hooks (not feature-specific)
├── routes/                   # File-based routing (unchanged)
└── styles.css
```

## Feature Metadata

**Feature Type**: Refactor
**Estimated Complexity**: High
**Primary Systems Affected**: All feature modules, imports throughout codebase
**Dependencies**: None (internal reorganization)

---

## CONTEXT REFERENCES

### Current Feature Directories in lib/ (to be moved to features/)

| Current Location            | New Location              | Contents                                        |
| --------------------------- | ------------------------- | ----------------------------------------------- |
| `lib/auth/`                 | `features/auth/`          | server, client, config, middleware, types       |
| `lib/batches/`              | `features/batches/`       | server, forecasting, constants, tests           |
| `lib/farms/`                | `features/farms/`         | server, tests                                   |
| `lib/sales/`                | `features/sales/`         | server                                          |
| `lib/customers/`            | `features/customers/`     | server, tests                                   |
| `lib/suppliers/`            | `features/suppliers/`     | server                                          |
| `lib/expenses/`             | `features/expenses/`      | server, constants                               |
| `lib/invoices/`             | `features/invoices/`      | server, tests                                   |
| `lib/feed/`                 | `features/feed/`          | server, constants, tests                        |
| `lib/feed-inventory/`       | `features/inventory/`     | server (merge with inventory)                   |
| `lib/medication-inventory/` | `features/inventory/`     | server (merge with inventory)                   |
| `lib/weight/`               | `features/weight/`        | server, tests                                   |
| `lib/mortality/`            | `features/mortality/`     | server, tests                                   |
| `lib/vaccinations/`         | `features/vaccinations/`  | server, tests                                   |
| `lib/water-quality/`        | `features/water-quality/` | server, constants, tests                        |
| `lib/eggs/`                 | `features/eggs/`          | server, tests                                   |
| `lib/settings/`             | `features/settings/`      | server, context, formatters, hooks, tests       |
| `lib/modules/`              | `features/modules/`       | server, context, constants, utils, types, tests |
| `lib/onboarding/`           | `features/onboarding/`    | server, context, types, tests                   |
| `lib/dashboard/`            | `features/dashboard/`     | server, tests                                   |
| `lib/reports/`              | `features/reports/`       | server                                          |
| `lib/export/`               | `features/export/`        | server, pdf                                     |
| `lib/users/`                | `features/users/`         | server, tests                                   |
| `lib/structures/`           | `features/structures/`    | server                                          |
| `lib/monitoring/`           | `features/monitoring/`    | alerts                                          |
| `lib/logging/`              | `features/logging/`       | audit, tests                                    |
| `lib/finance/`              | `features/finance/`       | calculations, tests                             |

### Components to Move to Features

| Current Location                          | New Location                    | Reason            |
| ----------------------------------------- | ------------------------------- | ----------------- |
| `components/dialogs/batch-dialog.tsx`     | `features/batches/components/`  | Batch-specific    |
| `components/dialogs/sale-dialog.tsx`      | `features/sales/components/`    | Sales-specific    |
| `components/dialogs/farm-dialog.tsx`      | `features/farms/components/`    | Farm-specific     |
| `components/dialogs/edit-farm-dialog.tsx` | `features/farms/components/`    | Farm-specific     |
| `components/dialogs/expense-dialog.tsx`   | `features/expenses/components/` | Expense-specific  |
| `components/dialogs/feed-dialog.tsx`      | `features/feed/components/`     | Feed-specific     |
| `components/dialogs/egg-dialog.tsx`       | `features/eggs/components/`     | Egg-specific      |
| `components/batches/projections-card.tsx` | `features/batches/components/`  | Batch-specific    |
| `components/settings/audit-log-table.tsx` | `features/settings/components/` | Settings-specific |
| `components/farm-context.tsx`             | `features/farms/context.tsx`    | Farm-specific     |
| `components/farm-selector.tsx`            | `features/farms/components/`    | Farm-specific     |
| `components/module-context.tsx`           | `features/modules/context.tsx`  | Module-specific   |
| `components/module-selector.tsx`          | `features/modules/components/`  | Module-specific   |

### Files to Keep in lib/ (Truly Shared)

- `lib/db/` - Database layer (Kysely, migrations, schema)
- `lib/utils.ts` - Generic utilities (cn function)
- `lib/query-client.ts` - TanStack Query configuration
- `lib/currency.ts` → Move to `features/settings/formatters/` (it's settings-related)

### Files to Keep in components/ (Truly Shared)

- `components/ui/` - Base UI components (shadcn)
- `components/layout/` - Shell, sidebar
- `components/navigation.tsx` - App navigation
- `components/theme-provider.tsx` - Theme context
- `components/theme-toggle.tsx` - Theme toggle
- `components/error-page.tsx` - Error boundary
- `components/not-found.tsx` - 404 page
- `components/offline-indicator.tsx` - PWA indicator
- `components/pwa-prompt.tsx` - PWA install prompt
- `components/logo.tsx` - App logo

### Relevant Documentation

- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
- [Feature-Based Architecture](https://saas-ui.dev/docs/tanstack-router-starter-kit/project-structure)
    - "Application code is grouped by feature... all related assets, like components, hooks, pages are grouped in a single feature folder"

---

## IMPLEMENTATION PLAN

### Phase 1: Create Feature Directory Structure

Create the new `features/` directory with all feature subdirectories.

### Phase 2: Move Core Features First

Start with features that have the most dependencies to establish patterns:

1. auth (used everywhere)
2. farms (context used in many places)
3. modules (context used in many places)
4. settings (formatters used everywhere)

### Phase 3: Move Remaining Features

Move all other feature directories from lib/ to features/.

### Phase 4: Move Feature-Specific Components

Move dialogs and feature-specific components to their feature directories.

### Phase 5: Update All Imports

Update import paths throughout the codebase.

### Phase 6: Cleanup

Remove empty directories and update documentation.

---

## STEP-BY-STEP TASKS

### Phase 1: Create Directory Structure

#### CREATE features/ directory structure

```bash
mkdir -p app/features/{auth,batches,farms,sales,customers,suppliers,expenses,invoices,feed,inventory,weight,mortality,vaccinations,water-quality,eggs,settings,modules,onboarding,dashboard,reports,export,users,structures,monitoring,logging,finance}
mkdir -p app/features/{batches,farms,sales,expenses,feed,eggs,settings,modules}/components
mkdir -p app/features/settings/formatters
mkdir -p app/components/common
```

- **VALIDATE**: `ls app/features/` shows all directories

---

### Phase 2: Move Core Features

#### MOVE lib/auth/ → features/auth/

```bash
mv app/lib/auth/* app/features/auth/
rmdir app/lib/auth
```

- **UPDATE IMPORTS**: Change `~/lib/auth/` to `~/features/auth/` in all files
- **VALIDATE**: `grep -r "lib/auth" app/` returns no results

#### MOVE lib/farms/ → features/farms/

```bash
mv app/lib/farms/* app/features/farms/
rmdir app/lib/farms
```

- **ALSO MOVE**:
    - `components/farm-context.tsx` → `features/farms/context.tsx`
    - `components/farm-selector.tsx` → `features/farms/components/selector.tsx`
    - `components/dialogs/farm-dialog.tsx` → `features/farms/components/farm-dialog.tsx`
    - `components/dialogs/edit-farm-dialog.tsx` → `features/farms/components/edit-farm-dialog.tsx`
- **UPDATE IMPORTS**: Change all farm-related imports
- **VALIDATE**: `grep -r "lib/farms" app/` returns no results

#### MOVE lib/modules/ → features/modules/

```bash
mv app/lib/modules/* app/features/modules/
rmdir app/lib/modules
```

- **ALSO MOVE**:
    - `components/module-context.tsx` → `features/modules/context.tsx`
    - `components/module-selector.tsx` → `features/modules/components/selector.tsx`
- **UPDATE IMPORTS**: Change all module-related imports
- **VALIDATE**: `grep -r "lib/modules" app/` returns no results

#### MOVE lib/settings/ → features/settings/

```bash
mv app/lib/settings/* app/features/settings/
mv app/lib/currency.ts app/features/settings/formatters/currency.ts
mv app/lib/currency.test.ts app/features/settings/formatters/currency.test.ts
rmdir app/lib/settings
```

- **ALSO MOVE**:
    - `components/settings/audit-log-table.tsx` → `features/settings/components/audit-log-table.tsx`
- **UPDATE IMPORTS**: Change all settings-related imports
- **VALIDATE**: `grep -r "lib/settings" app/` returns no results

---

### Phase 3: Move Remaining Features

#### MOVE lib/batches/ → features/batches/

```bash
mv app/lib/batches/* app/features/batches/
rmdir app/lib/batches
```

- **ALSO MOVE**:
    - `components/batches/projections-card.tsx` → `features/batches/components/projections-card.tsx`
    - `components/dialogs/batch-dialog.tsx` → `features/batches/components/batch-dialog.tsx`
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/batches" app/` returns no results

#### MOVE lib/sales/ → features/sales/

```bash
mv app/lib/sales/* app/features/sales/
rmdir app/lib/sales
```

- **ALSO MOVE**:
    - `components/dialogs/sale-dialog.tsx` → `features/sales/components/sale-dialog.tsx`
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/sales" app/` returns no results

#### MOVE lib/customers/ → features/customers/

```bash
mv app/lib/customers/* app/features/customers/
rmdir app/lib/customers
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/customers" app/` returns no results

#### MOVE lib/suppliers/ → features/suppliers/

```bash
mv app/lib/suppliers/* app/features/suppliers/
rmdir app/lib/suppliers
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/suppliers" app/` returns no results

#### MOVE lib/expenses/ → features/expenses/

```bash
mv app/lib/expenses/* app/features/expenses/
rmdir app/lib/expenses
```

- **ALSO MOVE**:
    - `components/dialogs/expense-dialog.tsx` → `features/expenses/components/expense-dialog.tsx`
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/expenses" app/` returns no results

#### MOVE lib/invoices/ → features/invoices/

```bash
mv app/lib/invoices/* app/features/invoices/
rmdir app/lib/invoices
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/invoices" app/` returns no results

#### MOVE lib/feed/ → features/feed/

```bash
mv app/lib/feed/* app/features/feed/
rmdir app/lib/feed
```

- **ALSO MOVE**:
    - `components/dialogs/feed-dialog.tsx` → `features/feed/components/feed-dialog.tsx`
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/feed" app/` returns no results

#### MOVE inventory features → features/inventory/

```bash
mv app/lib/feed-inventory/server.ts app/features/inventory/feed-server.ts
mv app/lib/medication-inventory/server.ts app/features/inventory/medication-server.ts
rmdir app/lib/feed-inventory app/lib/medication-inventory
```

- **CREATE**: `features/inventory/index.ts` to re-export both
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/feed-inventory\|lib/medication-inventory" app/` returns no results

#### MOVE lib/weight/ → features/weight/

```bash
mv app/lib/weight/* app/features/weight/
rmdir app/lib/weight
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/weight" app/` returns no results

#### MOVE lib/mortality/ → features/mortality/

```bash
mv app/lib/mortality/* app/features/mortality/
rmdir app/lib/mortality
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/mortality" app/` returns no results

#### MOVE lib/vaccinations/ → features/vaccinations/

```bash
mv app/lib/vaccinations/* app/features/vaccinations/
rmdir app/lib/vaccinations
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/vaccinations" app/` returns no results

#### MOVE lib/water-quality/ → features/water-quality/

```bash
mv app/lib/water-quality/* app/features/water-quality/
rmdir app/lib/water-quality
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/water-quality" app/` returns no results

#### MOVE lib/eggs/ → features/eggs/

```bash
mv app/lib/eggs/* app/features/eggs/
rmdir app/lib/eggs
```

- **ALSO MOVE**:
    - `components/dialogs/egg-dialog.tsx` → `features/eggs/components/egg-dialog.tsx`
- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/eggs" app/` returns no results

#### MOVE lib/onboarding/ → features/onboarding/

```bash
mv app/lib/onboarding/* app/features/onboarding/
rmdir app/lib/onboarding
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/onboarding" app/` returns no results

#### MOVE lib/dashboard/ → features/dashboard/

```bash
mv app/lib/dashboard/* app/features/dashboard/
rmdir app/lib/dashboard
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/dashboard" app/` returns no results

#### MOVE lib/reports/ → features/reports/

```bash
mv app/lib/reports/* app/features/reports/
rmdir app/lib/reports
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/reports" app/` returns no results

#### MOVE lib/export/ → features/export/

```bash
mv app/lib/export/* app/features/export/
rmdir app/lib/export
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/export" app/` returns no results

#### MOVE lib/users/ → features/users/

```bash
mv app/lib/users/* app/features/users/
rmdir app/lib/users
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/users" app/` returns no results

#### MOVE lib/structures/ → features/structures/

```bash
mv app/lib/structures/* app/features/structures/
rmdir app/lib/structures
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/structures" app/` returns no results

#### MOVE lib/monitoring/ → features/monitoring/

```bash
mv app/lib/monitoring/* app/features/monitoring/
rmdir app/lib/monitoring
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/monitoring" app/` returns no results

#### MOVE lib/logging/ → features/logging/

```bash
mv app/lib/logging/* app/features/logging/
rmdir app/lib/logging
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/logging" app/` returns no results

#### MOVE lib/finance/ → features/finance/

```bash
mv app/lib/finance/* app/features/finance/
rmdir app/lib/finance
```

- **UPDATE IMPORTS**
- **VALIDATE**: `grep -r "lib/finance" app/` returns no results

---

### Phase 4: Organize Shared Components

#### MOVE shared components to components/common/

```bash
mv app/components/error-page.tsx app/components/common/
mv app/components/not-found.tsx app/components/common/
mv app/components/offline-indicator.tsx app/components/common/
mv app/components/offline-indicator.test.tsx app/components/common/
mv app/components/pwa-prompt.tsx app/components/common/
mv app/components/logo.tsx app/components/common/
mv app/components/example.tsx app/components/common/
mv app/components/component-example.tsx app/components/common/
```

- **UPDATE IMPORTS**
- **VALIDATE**: Components still render correctly

#### REMOVE empty directories

```bash
rmdir app/components/dialogs  # Should be empty after moves
rmdir app/components/batches  # Should be empty after moves
rmdir app/components/settings # Should be empty after moves
```

---

### Phase 5: Update All Imports

#### UPDATE route imports

All route files need import path updates:

- `~/lib/auth/` → `~/features/auth/`
- `~/lib/batches/` → `~/features/batches/`
- `~/lib/farms/` → `~/features/farms/`
- etc.

Use find and replace:

```bash
# Example for each feature
find app/routes -name "*.tsx" -exec sed -i '' 's|~/lib/auth/|~/features/auth/|g' {} \;
find app/routes -name "*.tsx" -exec sed -i '' 's|~/lib/batches/|~/features/batches/|g' {} \;
# ... repeat for all features
```

#### UPDATE component imports

```bash
find app -name "*.tsx" -exec sed -i '' 's|~/components/farm-context|~/features/farms/context|g' {} \;
find app -name "*.tsx" -exec sed -i '' 's|~/components/module-context|~/features/modules/context|g' {} \;
# ... etc
```

#### UPDATE cross-feature imports

Some features import from other features - these paths need updating too.

---

### Phase 6: Validation & Cleanup

#### RUN full validation

```bash
bun run lint
bun run check
bun test
bun dev  # Manual testing
```

#### UPDATE documentation

- Update `AGENTS.md` with new structure
- Update `.kiro/steering/structure.md`
- Update `README.md` project structure section

---

## TESTING STRATEGY

### Validation After Each Move

After moving each feature:

1. Run `bun run lint` - Check for import errors
2. Run `bun run check` - Check TypeScript types
3. Run `bun test` - Ensure tests still pass

### Final Validation

1. Full test suite passes
2. Development server starts
3. All routes accessible
4. No console errors

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

### Level 3: Build

```bash
bun run build  # Note: May have pre-existing TanStack issue
```

### Level 4: Manual Testing

```bash
bun dev
# Navigate to all major routes
# Test CRUD operations
```

### Level 5: Import Verification

```bash
# Verify no old imports remain
grep -r "~/lib/auth" app/
grep -r "~/lib/batches" app/
grep -r "~/lib/farms" app/
# ... etc for all moved features
```

---

## ACCEPTANCE CRITERIA

- [ ] All features moved to `features/` directory
- [ ] Feature-specific components co-located with features
- [ ] `lib/` contains only truly shared code (db, utils, query-client)
- [ ] `components/` contains only shared UI components
- [ ] All imports updated throughout codebase
- [ ] All tests pass
- [ ] Development server works
- [ ] No TypeScript errors
- [ ] Documentation updated

---

## COMPLETION CHECKLIST

- [ ] Phase 1: Directory structure created
- [ ] Phase 2: Core features moved (auth, farms, modules, settings)
- [ ] Phase 3: All remaining features moved
- [ ] Phase 4: Feature-specific components moved
- [ ] Phase 5: All imports updated
- [ ] Phase 6: Validation passed, documentation updated
- [ ] Final review and cleanup

---

## NOTES

### Why Feature-Based Architecture?

1. **Maintainability**: Related code is together, easier to understand and modify
2. **Scalability**: New features are self-contained, don't pollute shared directories
3. **Discoverability**: Developers can find all feature code in one place
4. **Testability**: Feature tests are co-located with feature code
5. **Refactoring**: Easier to modify or remove features without side effects

### Migration Strategy

This is a large refactor. Consider:

1. **Incremental approach**: Move one feature at a time, validate, commit
2. **Feature flags**: If needed, can maintain both paths temporarily
3. **Team communication**: Ensure all developers know about the change

### Import Path Aliases

The `~/` alias should continue to work. Just update paths from:

- `~/lib/feature/` → `~/features/feature/`
- `~/components/feature-context` → `~/features/feature/context`

### Backward Compatibility

This is an internal refactor. No API changes, no user-facing changes. All routes and functionality remain identical.

### Risk Assessment

- **Low Risk**: File moves with import updates
- **Medium Risk**: Complex import chains may have edge cases
- **Mitigation**: Validate after each feature move, don't batch too many changes

### Estimated Time

- Phase 1: 5 minutes
- Phase 2: 30 minutes (core features + imports)
- Phase 3: 45 minutes (remaining features)
- Phase 4: 15 minutes (components)
- Phase 5: 30 minutes (import updates)
- Phase 6: 15 minutes (validation)

**Total: ~2-3 hours**
