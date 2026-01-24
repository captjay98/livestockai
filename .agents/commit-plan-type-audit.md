# Commit Plan - Type Suppression Audit

## Changes Summary

- Eliminated 5 unnecessary @ts-ignore comments (36% reduction: 14 → 9)
- Fixed null/undefined type mismatches
- Updated MortalityRecord interface to match query results
- Documented remaining 9 legitimate suppressions

## Commits

### Commit 1: Fix null/undefined conversions
**Type:** fix(types)
**Files:** 2
- app/features/sales/use-sales-page.ts
- app/features/inventory/use-medication-inventory.ts

**Message:**
```
fix(types): eliminate null/undefined type suppressions

- Use nullish coalescing (??) for null to undefined conversions
- Remove redundant suppression after type guard
- Fixes 3 @ts-ignore comments in sales and inventory
```

### Commit 2: Fix water quality type mismatch
**Type:** fix(types)
**Files:** 2
- app/features/water-quality/use-water-quality-page.ts
- app/routes/_auth/water-quality/index.tsx

**Message:**
```
fix(types): accept null farmId in water quality hook

- Change UseWaterQualityPageProps to accept string | null
- Convert null to undefined internally with ?? operator
- Removes 1 @ts-ignore comment
```

### Commit 3: Fix mortality record interface
**Type:** fix(types)
**Files:** 2
- app/features/mortality/server.ts
- app/features/mortality/use-mortality-page.ts

**Message:**
```
fix(types): complete MortalityRecord interface

- Add missing joined fields: species, livestockType, farmName, farmId, createdAt
- Replace @ts-ignore with explicit type assertion
- Interface now matches actual database query result
```

### Commit 4: Document type suppressions
**Type:** docs
**Files:** 1
- .agents/type-suppression-audit-2026-01-24.md

**Message:**
```
docs: add comprehensive type suppression audit

- Document 5 suppressions eliminated
- Explain 9 remaining legitimate suppressions (TanStack Router)
- Provide alternatives investigated and why they were rejected
- Add recommendations for future development
```

## Validation

```bash
# TypeScript
npx tsc --noEmit
# Expected: 0 errors

# ESLint
bun run lint
# Expected: 0 errors

# Suppression count
grep -r "@ts-ignore" app/ --include="*.ts" --include="*.tsx" | wc -l
# Expected: 9
```

## Execution Order

1. Commit 1 (sales + inventory fixes)
2. Commit 2 (water quality fix)
3. Commit 3 (mortality interface fix)
4. Commit 4 (documentation)
