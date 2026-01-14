# Commit Plan - Day 8 Part 4 (January 14, 2026)

## Summary

- 7 commits planned
- 36 files changed
- 298 insertions, 139 deletions

## Commits

### Commit 1: fix(onboarding): persist skip to database and fix redirect loop

**Files**:

- app/features/onboarding/context.tsx
- app/routes/\_auth/onboarding/index.tsx

**Message**:

```
fix(onboarding): persist skip to database and fix redirect loop

- skipOnboarding() now calls markOnboardingCompleteFn() to persist to DB
- Move navigate() to useEffect to avoid calling during render
- Expand farm type options from 3 to 7 (poultry, fishery, cattle, goats, sheep, bees, mixed)
- Fix type cast in farm type select
- Remove unused useModules import

Fixes redirect loop when skipping onboarding
```

### Commit 2: fix(settings): select all columns and merge with defaults

**Files**:

- app/features/settings/server.ts
- app/features/settings/hooks.ts
- app/features/settings/currency.ts

**Message**:

```
fix(settings): select all columns and merge with defaults

- getUserSettings now uses selectAll() instead of explicit columns
- Merge database settings with DEFAULT_SETTINGS for missing fields
- Add default fallback for dashboardCards in useDashboardPreferences
- Handle undefined/null/empty string in toDecimal and toNumber

Fixes undefined errors for fiscalYearStartMonth and dashboardCards
```

### Commit 3: fix(database): quote camelCase columns in PostgreSQL orderBy

**Files**:

- app/features/customers/server.ts
- app/features/suppliers/server.ts

**Message**:

```
fix(database): quote camelCase columns in PostgreSQL orderBy

- Quote column names: customers."createdAt", suppliers."createdAt"
- Quote alias columns: "totalSpent", "salesCount", "expenseCount"

PostgreSQL requires double quotes around camelCase identifiers
```

### Commit 4: fix(auth): add guard for missing user in AuthLayout

**Files**:

- app/routes/\_auth.tsx

**Message**:

```
fix(auth): add guard for missing user in AuthLayout

- Return null if context.user is undefined
- Prevents crash when user data is not yet loaded
```

### Commit 5: refactor(ui): reduce padding for more screen real estate

**Files**:

- app/components/layout/shell.tsx
- app/components/ui/card.tsx
- app/components/ui/select.tsx
- app/components/ui/switch.tsx
- app/components/ui/tabs.tsx

**Message**:

```
refactor(ui): reduce padding for more screen real estate

AppShell:
- Desktop padding: p-8 → px-4 py-6

Card components:
- Card: py-6 → py-4, gap-5 → gap-4
- CardHeader/Content: px-6 → px-4
- CardFooter: p-6 → p-4

Other UI:
- SelectTrigger: w-fit → w-full (better mobile display)
- TabsList: flex-wrap justify-between (responsive tabs)
- Switch: improved visibility in dark/light mode
```

### Commit 6: refactor(routes): remove redundant container padding

**Files**:

- app/routes/\_auth/batches/index.tsx
- app/routes/\_auth/batches/$batchId/index.tsx
- app/routes/\_auth/customers/index.tsx
- app/routes/\_auth/customers/$customerId.tsx
- app/routes/\_auth/suppliers/index.tsx
- app/routes/\_auth/suppliers/$supplierId.tsx
- app/routes/\_auth/sales/index.tsx
- app/routes/\_auth/expenses/index.tsx
- app/routes/\_auth/invoices/index.tsx
- app/routes/\_auth/invoices/$invoiceId.tsx
- app/routes/\_auth/farms/index.tsx
- app/routes/\_auth/farms/$farmId/index.tsx
- app/routes/\_auth/feed/index.tsx
- app/routes/\_auth/eggs/index.tsx
- app/routes/\_auth/weight/index.tsx
- app/routes/\_auth/water-quality/index.tsx
- app/routes/\_auth/mortality/index.tsx
- app/routes/\_auth/inventory/index.tsx
- app/routes/\_auth/vaccinations/index.tsx
- app/routes/\_auth/reports/index.tsx
- app/routes/\_auth/settings/index.tsx
- app/routes/\_auth/settings/modules.tsx

**Message**:

```
refactor(routes): remove redundant container padding

- Replace "container mx-auto py-6 px-4" with "space-y-6"
- AppShell already handles page padding
- Reduces code duplication across 22 route files
```

### Commit 7: test(currency): update tests for USD default

**Files**:

- tests/features/settings/currency.test.ts

**Message**:

```
test(currency): update tests for USD default

- Change expected currency symbol from ₦ to $
- Update formatCurrency tests for $0.00, $100.00, etc.
- Update formatCurrencyCompact tests for $1.5M, $25K, etc.
- Fix thousands test: $25.0K → $25K (trailing .0 removed)

Default currency changed from NGN to USD for international users
```

## Execution

```bash
# Commit 1: Onboarding fixes
git add app/features/onboarding/context.tsx app/routes/_auth/onboarding/index.tsx
git commit -m "fix(onboarding): persist skip to database and fix redirect loop"

# Commit 2: Settings fixes
git add app/features/settings/server.ts app/features/settings/hooks.ts app/features/settings/currency.ts
git commit -m "fix(settings): select all columns and merge with defaults"

# Commit 3: PostgreSQL column quoting
git add app/features/customers/server.ts app/features/suppliers/server.ts
git commit -m "fix(database): quote camelCase columns in PostgreSQL orderBy"

# Commit 4: Auth guard
git add app/routes/_auth.tsx
git commit -m "fix(auth): add guard for missing user in AuthLayout"

# Commit 5: UI padding reduction
git add app/components/layout/shell.tsx app/components/ui/card.tsx app/components/ui/select.tsx app/components/ui/switch.tsx app/components/ui/tabs.tsx
git commit -m "refactor(ui): reduce padding for more screen real estate"

# Commit 6: Route padding cleanup
git add app/routes/_auth/batches/index.tsx app/routes/_auth/batches/\$batchId/index.tsx app/routes/_auth/customers/index.tsx app/routes/_auth/customers/\$customerId.tsx app/routes/_auth/suppliers/index.tsx app/routes/_auth/suppliers/\$supplierId.tsx app/routes/_auth/sales/index.tsx app/routes/_auth/expenses/index.tsx app/routes/_auth/invoices/index.tsx app/routes/_auth/invoices/\$invoiceId.tsx app/routes/_auth/farms/index.tsx app/routes/_auth/farms/\$farmId/index.tsx app/routes/_auth/feed/index.tsx app/routes/_auth/eggs/index.tsx app/routes/_auth/weight/index.tsx app/routes/_auth/water-quality/index.tsx app/routes/_auth/mortality/index.tsx app/routes/_auth/inventory/index.tsx app/routes/_auth/vaccinations/index.tsx app/routes/_auth/reports/index.tsx app/routes/_auth/settings/index.tsx app/routes/_auth/settings/modules.tsx
git commit -m "refactor(routes): remove redundant container padding"

# Commit 7: Currency tests
git add tests/features/settings/currency.test.ts
git commit -m "test(currency): update tests for USD default"
```

## Validation

- [x] TypeScript: 0 errors
- [x] ESLint: 0 errors (pre-existing issues in other files)
- [x] Tests: 302 pass, 1 skip, 0 fail
- [ ] Git status clean (after commits)
