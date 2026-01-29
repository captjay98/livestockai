# Feature: Implement All Unit Value Conversions

The following plan should be complete, but validate documentation and codebase patterns before implementing.

## Feature Description

Currently, unit labels show the correct unit (kg/lbs, m²/ft², °C/°F) but actual values are not converted. When a user changes their unit preferences, they see "5.51 lbs" but the number is still in kg (should be 12.14 lbs). This feature implements actual value conversion for ALL unit settings: weight, area, and temperature.

## User Story

As a user who prefers imperial/different units
I want all measurement values converted to my preferred units
So that I can read and understand measurements naturally without manual conversion

## Problem Statement

The unit formatting system is half-implemented across all measurement types:

- ✅ Labels change (kg → lbs, m² → ft², °C → °F)
- ❌ Values don't convert (still show metric values with wrong labels)

This creates confusion and makes the unit settings useless.

## Solution Statement

Use the existing `formatWeight()`, `formatArea()`, and `formatTemperature()` functions from `unit-converter.ts` to convert all measurement values before display. Replace all raw displays with formatted values.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Low-Medium
**Primary Systems Affected**: Weight, area, and temperature displays across 10 files
**Dependencies**: None (formatters already exist)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ

- `app/features/settings/unit-converter.ts` (lines 1-200) - All conversion functions
- `app/features/settings/hooks.ts` (lines 135-200) - useFormatWeight, useFormatArea, useFormatTemperature hooks
- `app/routes/_auth/sales/index.tsx` (line 1003) - Example of correct weight usage
- `app/routes/_auth/settings/index.tsx` (lines 470-580) - Preview shows all conversions working

### Files Needing Updates (10 files)

**Weight conversions (7 files):**

- `app/routes/_auth/feed/index.tsx` - Feed quantity displays
- `app/routes/_auth/weight/index.tsx` - Weight sample displays
- `app/routes/_auth/reports/index.tsx` - Feed report quantities
- `app/routes/_auth/batches/$batchId/index.tsx` - Feed records table
- `app/components/dialogs/weight-dialog.tsx` - Total weight calculation
- `app/components/dialogs/feed-dialog.tsx` - Available quantity display
- `app/routes/_auth/inventory/index.tsx` - Feed inventory quantities

**Area conversions (1 file):**

- `app/routes/_auth/farms/$farmId/index.tsx` - Structure area displays

**Temperature conversions (2 files):**

- `app/routes/_auth/water-quality/index.tsx` - Temperature readings
- `app/components/dialogs/water-quality-dialog.tsx` - Temperature input labels

### Patterns to Follow

**Weight Pattern (from sales/index.tsx):**

```typescript
// Import hook
import { useFormatWeight } from '~/features/settings'

// Use hook in component
const { format: formatWeight } = useFormatWeight()

// Display converted value
{
  formatWeight(parseFloat(selectedSale.averageWeightKg))
}
// Shows: "5.51 lbs" when user has lbs selected
// Shows: "2.50 kg" when user has kg selected
```

**Area Pattern:**

```typescript
// Import hook
import { useFormatArea } from '~/features/settings'

// Use hook in component
const { format: formatArea } = useFormatArea()

// Display converted value
{
  formatArea(parseFloat(structure.areaSqm))
}
// Shows: "1076.39 ft²" when user has sqft selected
// Shows: "100.00 m²" when user has sqm selected
```

**Temperature Pattern:**

```typescript
// Import hook
import { useFormatTemperature } from '~/features/settings'

// Use hook in component
const { format: formatTemperature } = useFormatTemperature()

// Display converted value
{
  formatTemperature(parseFloat(record.temperatureCelsius))
}
// Shows: "77.0°F" when user has fahrenheit selected
// Shows: "25.0°C" when user has celsius selected
```

**Incorrect Pattern (current):**

```typescript
// Just shows raw metric value with wrong label
{row.original.quantityKg.toLocaleString()} kg
{structure.areaSqm} m²
{record.temperatureCelsius}°C
// Shows wrong values when user changes units!
```

---

## IMPLEMENTATION PLAN

### Phase 1: Weight Conversions (7 files)

Add `useFormatWeight` hook and convert all weight displays.

### Phase 2: Area Conversions (1 file)

Add `useFormatArea` hook and convert structure area displays.

### Phase 3: Temperature Conversions (2 files)

Add `useFormatTemperature` hook and convert water quality temperature displays.

### Phase 4: Validation

Ensure TypeScript compiles and manual testing confirms all conversions work.

---

## STEP-BY-STEP TASKS

### WEIGHT CONVERSIONS

### Task 1: UPDATE `app/routes/_auth/feed/index.tsx`

- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()` (hook import already exists)
- **FIND**: Line ~463: `<span className="font-medium">{qty.toLocaleString()} kg</span>`
- **REPLACE**: `{formatWeight(qty)}`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep feed/index`

### Task 2: UPDATE `app/routes/_auth/weight/index.tsx`

- **ADD IMPORT**: `useFormatWeight` to existing import
- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()`
- **FIND**: Column definition for `averageWeightKg` (line ~258)
- **UPDATE CELL**:
  ```typescript
  cell: ({ row }) => formatWeight(parseFloat(row.original.averageWeightKg))
  ```
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight/index`

### Task 3: UPDATE `app/routes/_auth/reports/index.tsx`

- **ADD HOOK** to FeedReportView: `const { format: formatWeight } = useFormatWeight()`
- **FIND**: Line ~617: `cell: ({ row }) => row.original.totalQuantityKg.toLocaleString()`
- **REPLACE**: `cell: ({ row }) => formatWeight(row.original.totalQuantityKg)`
- **FIND**: Line ~663: `<span>{t.quantityKg.toLocaleString()} kg</span>`
- **REPLACE**: `<span>{formatWeight(t.quantityKg)}</span>`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep reports/index`

### Task 4: UPDATE `app/routes/_auth/batches/$batchId/index.tsx`

- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()` (already has label)
- **FIND**: Feed records table column for `quantityKg` (line ~355)
- **UPDATE**: Add cell formatter:
  ```typescript
  {
    accessorKey: 'quantityKg',
    header: `Qty (${weightLabel})`,
    cell: ({ row }) => formatWeight(parseFloat(row.original.quantityKg))
  }
  ```
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep batchId/index`

### Task 5: UPDATE `app/components/dialogs/weight-dialog.tsx`

- **ADD IMPORT**: `import { useFormatWeight } from '~/features/settings'`
- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()`
- **FIND**: Line ~57: Total weight calculation display
- **REPLACE**: Use `formatWeight()` for the calculated total
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep weight-dialog`

### Task 6: UPDATE `app/components/dialogs/feed-dialog.tsx`

- **ADD IMPORT**: `import { useFormatWeight } from '~/features/settings'`
- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()`
- **FIND**: Line ~216: Available quantity display
- **REPLACE**: `{formatWeight(qty)}` instead of `{qty.toLocaleString()} kg`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep feed-dialog`

### Task 7: UPDATE `app/routes/_auth/inventory/index.tsx`

- **ADD IMPORT**: `import { useFormatWeight } from '~/features/settings'`
- **ADD HOOK**: `const { format: formatWeight } = useFormatWeight()`
- **FIND**: Feed inventory quantity displays
- **REPLACE**: All `{value} kg` with `{formatWeight(parseFloat(value))}`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep inventory/index`

### AREA CONVERSIONS

### Task 8: UPDATE `app/routes/_auth/farms/$farmId/index.tsx`

- **ADD IMPORT**: `import { useFormatArea } from '~/features/settings'`
- **ADD HOOK**: `const { format: formatArea, label: areaLabel } = useFormatArea()`
- **FIND**: Structure area displays (areaSqm fields)
- **REPLACE**: All area displays with `{formatArea(parseFloat(structure.areaSqm))}`
- **UPDATE LABELS**: Change "Area (m²)" to `Area ({areaLabel})`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep farmId/index`

### TEMPERATURE CONVERSIONS

### Task 9: UPDATE `app/routes/_auth/water-quality/index.tsx`

- **ADD IMPORT**: `import { useFormatTemperature } from '~/features/settings'`
- **ADD HOOK**: `const { format: formatTemperature, label: tempLabel } = useFormatTemperature()`
- **FIND**: Temperature column display (line ~283)
- **UPDATE CELL**: `cell: ({ row }) => formatTemperature(parseFloat(row.original.temperatureCelsius))`
- **UPDATE LABEL**: Line ~458: Change "Temperature (°C)" to `Temperature ({tempLabel})`
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality/index`

### Task 10: UPDATE `app/components/dialogs/water-quality-dialog.tsx`

- **ADD IMPORT**: `import { useFormatTemperature } from '~/features/settings'`
- **ADD HOOK**: `const { label: tempLabel } = useFormatTemperature()`
- **FIND**: Temperature input label
- **UPDATE**: Change "Temperature (°C)" to `Temperature ({tempLabel})`
- **NOTE**: Input values stay in Celsius (storage unit), only display label changes
- **VALIDATE**: `npx tsc --noEmit 2>&1 | grep water-quality-dialog`

### Task 11: Final Validation

- **RUN**: `npx tsc --noEmit`
- **RUN**: `bun run lint`
- **VERIFY**: 0 errors

---

## TESTING STRATEGY

### Manual Testing

1. Go to Settings → Regional
2. **Test Weight Conversion:**
   - Change weight unit from kg to lbs
   - Navigate to: Feed, Weight, Reports, Batch details, Inventory
   - Verify: 2.5 kg → 5.51 lbs, 10 kg → 22.05 lbs
3. **Test Area Conversion:**
   - Change area unit from m² to ft²
   - Navigate to: Farms (structure details)
   - Verify: 100 m² → 1076.39 ft²
4. **Test Temperature Conversion:**
   - Change temperature unit from Celsius to Fahrenheit
   - Navigate to: Water Quality records
   - Verify: 25°C → 77.0°F, 30°C → 86.0°F
5. Change all units back, verify values revert correctly

### Edge Cases

- Zero values: All formatters handle 0 correctly
- Null/undefined: Use optional chaining or default to 0
- String values: Parse with `parseFloat()` before formatting
- Very large/small numbers: Formatters use `.toFixed()` for consistency

---

## VALIDATION COMMANDS

### Level 1: Type Check

```bash
npx tsc --noEmit
```

### Level 2: Lint

```bash
bun run lint
```

### Level 3: Manual Validation

1. Start dev: `bun dev`
2. Login and go to Settings
3. Change weight unit to lbs
4. Check all pages with weight displays
5. Verify conversion is correct (multiply kg by 2.20462)

---

## ACCEPTANCE CRITERIA

- [ ] All weight values convert when unit changes (kg ↔ lbs)
- [ ] All area values convert when unit changes (m² ↔ ft²)
- [ ] All temperature values convert when unit changes (°C ↔ °F)
- [ ] Labels and values both show correct unit
- [ ] Conversion factors are accurate:
  - Weight: 2.20462 lbs per kg
  - Area: 10.7639 ft² per m²
  - Temperature: (C × 9/5) + 32 = F
- [ ] TypeScript compiles with 0 errors
- [ ] ESLint passes with 0 errors
- [ ] No regressions in existing functionality
- [ ] Settings changes reflect immediately

---

## COMPLETION CHECKLIST

- [ ] All 7 files updated with weight conversion
- [ ] 1 file updated with area conversion
- [ ] 2 files updated with temperature conversion
- [ ] `npx tsc --noEmit` passes
- [ ] `bun run lint` passes
- [ ] Manual testing confirms all conversions work
- [ ] All unit modes tested (kg/lbs, m²/ft², °C/°F)
- [ ] Commit changes

---

## NOTES

**Why this is simple:**
All conversion functions already exist and work correctly (verified in Settings preview). We just need to use them instead of displaying raw metric values.

**Pattern consistency:**

- Weight: Follow `sales/index.tsx` line 1003
- Area: Follow `settings/index.tsx` preview pattern
- Temperature: Follow `settings/index.tsx` preview pattern

**Database values unchanged:**
All measurements remain stored in metric (kg, m², °C) in the database. Only display formatting changes.

**Conversion factors:**

- Weight: 1 kg = 2.20462 lbs
- Area: 1 m² = 10.7639 ft²
- Temperature: °F = (°C × 9/5) + 32

**Estimated time:** ~45 minutes (30 min weight + 10 min area + 5 min temperature)
