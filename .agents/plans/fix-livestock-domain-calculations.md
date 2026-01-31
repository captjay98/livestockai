# Feature: Fix Livestock Domain Calculations

## Feature Description

Fix critical biological accuracy issues in growth forecasting, mortality tracking, and health monitoring systems. These fixes ensure accurate ADG calculations, species-specific thresholds, and breed-adjusted performance metrics for Nigerian livestock operations.

## User Story

As a livestock farmer
I want accurate growth projections and health alerts
So that I can make informed decisions about feeding, harvesting, and veterinary interventions

## Problem Statement

Current domain implementations have biological accuracy issues:

1. ADG calculation assumes 0g initial weight (incorrect for all species)
2. Missing species parameter in ADG function calls
3. FCR targets incomplete for Nigerian breeds (local chicken, WAD goat, etc.)
4. Layer mortality thresholds too strict (triggers false alarms)
5. Growth alerts don't account for breed variation (local vs improved breeds)
6. Water quality checks missing temperature thresholds
7. FCR calculation ignores mortality (underestimates true FCR)
8. Harvest projections don't warn about feed inventory shortages

## Solution Statement

Implement species-specific initial weights, add Nigerian breed constants, adjust thresholds for breed performance variation, and enhance monitoring with temperature checks and inventory warnings.

## Feature Metadata

**Feature Type**: Bug Fix + Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Forecasting, Monitoring, Constants
**Dependencies**: None (internal refactor)

---

## CONTEXT REFERENCES

### Relevant Codebase Files - MUST READ BEFORE IMPLEMENTING!

- `app/features/batches/forecasting-service.ts` (lines 46-90) - Why: Contains ADG calculation that assumes 0g initial weight
- `app/features/batches/forecasting.ts` (lines 240-265) - Why: Calls calculateADG without species parameter
- `app/features/monitoring/constants.ts` (lines 1-80) - Why: Contains species thresholds that need Nigerian breed additions
- `app/features/monitoring/service.ts` (lines 150-180, 220-240) - Why: Water quality and FCR checks need enhancements
- `app/features/batches/alert-service.ts` (lines 30-80) - Why: Growth alerts need breed adjustment factors
- `app/lib/db/types/livestock.ts` (lines 1-100) - Why: BreedTable structure with typicalFcr field
- `tests/features/batches/forecasting-service.property.test.ts` (lines 1-80) - Why: Test patterns to follow for ADG tests

### New Files to Create

None - all changes are modifications to existing files

### Relevant Documentation

- [Nigerian Poultry Breeds](https://www.fao.org/3/i2516e/i2516e00.pdf) - Indigenous chicken performance data
- [West African Dwarf Goat Standards](https://www.fao.org/3/t0690e/t0690e00.htm) - Growth rates and FCR
- [Catfish Production in Nigeria](https://www.ajol.info/index.php/ajfand/article/view/87613) - FCR benchmarks for Clarias gariepinus

### Patterns to Follow

**Species-Specific Constants Pattern:**

```typescript
// Use lookup objects for species-specific values
const SPECIES_CONSTANT: Record<string, number> = {
  broiler: 1.8,
  catfish: 1.5,
  // ... etc
}

// Access with fallback
const value = SPECIES_CONSTANT[species.toLowerCase()] || DEFAULT_VALUE
```

**Breed Adjustment Pattern:**

```typescript
// Adjust thresholds based on breed characteristics
const adjustment = breedName
  ? BREED_ADJUSTMENT[breedName.toLowerCase()] || 1.0
  : 1.0

const adjustedThreshold = baseThreshold * adjustment
```

**Property Test Pattern:**

```typescript
// From tests/features/batches/forecasting-service.property.test.ts
it('Property: ADG calculation invariant', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0.1, max: 10 }),
      fc.integer({ min: 1, max: 100 }),
      (weight, days) => {
        const result = calculateADG(/* ... */)
        expect(result.adgGramsPerDay).toBeGreaterThan(0)
      },
    ),
  )
})
```

---

## IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (ADG Calculation)

Fix the biological accuracy of ADG calculations by adding species-specific initial weights.

**Tasks:**

- Add INITIAL_WEIGHTS constant with species-specific values
- Update calculateADG signature to accept species parameter
- Update all calculateADG call sites
- Add property tests for initial weight handling

### Phase 2: Nigerian Breed Constants

Add FCR targets and thresholds for common Nigerian livestock breeds.

**Tasks:**

- Extend FCR_TARGETS_BY_SPECIES with Nigerian breeds
- Add breed adjustment factors for growth alerts
- Update mortality thresholds for layers

### Phase 3: Enhanced Monitoring

Add temperature checks for water quality and mortality-adjusted FCR.

**Tasks:**

- Add temperature thresholds to constants
- Implement temperature alerts in water quality service
- Fix FCR calculation to use average population
- Add feed inventory warnings to projections

### Phase 4: Testing & Validation

Ensure all changes maintain existing behavior and add new test coverage.

**Tasks:**

- Add property tests for species-specific ADG
- Add unit tests for breed adjustments
- Run full test suite
- Validate with build

---

## STEP-BY-STEP TASKS

### Task 1: ADD species-specific initial weights constant

**File**: `app/features/batches/forecasting-service.ts`

- **IMPLEMENT**: Add INITIAL_WEIGHTS constant after imports
- **CODE**:

```typescript
/**
 * Species-specific initial weights (grams)
 * Based on typical acquisition weights for each species
 */
const INITIAL_WEIGHTS: Record<string, number> = {
  // Poultry
  broiler: 40,
  layer: 38,
  turkey: 55,
  duck: 45,
  'guinea fowl': 25,
  'local chicken': 35,

  // Fish
  catfish: 2,
  tilapia: 1,
  'african catfish': 2,
  'hybrid catfish': 2,

  // Cattle (born much heavier)
  cattle: 35000, // ~35kg
  angus: 35000,
  'dairy cattle': 40000,

  // Goats
  goats: 3000, // ~3kg
  boer: 3500,
  'west african dwarf': 2000,
  'red sokoto': 2500,

  // Sheep
  sheep: 4000, // ~4kg
  merino: 4500,
  dorper: 4000,
  'west african dwarf sheep': 3000,
  yankasa: 3500,
  uda: 4000,

  // Bees (colony weight, not individual)
  bees: 2000, // ~2kg for small colony
}

const DEFAULT_INITIAL_WEIGHT = 40 // Default to broiler chick weight
```

- **VALIDATE**: `bun run lint app/features/batches/forecasting-service.ts`

---

### Task 2: UPDATE calculateADG signature to accept species

**File**: `app/features/batches/forecasting-service.ts`

- **IMPLEMENT**: Add species parameter to calculateADG function (line 46)
- **PATTERN**: See existing function signature
- **CODE**:

```typescript
export function calculateADG(
  samples: Array<WeightSample>,
  acquisitionDate: Date,
  currentAgeDays: number,
  growthStandards: Array<GrowthStandard>,
  species: string, // ADD THIS PARAMETER
): ADGResult {
```

- **VALIDATE**: `npx tsc --noEmit`

---

### Task 3: UPDATE single-sample ADG calculation to use initial weight

**File**: `app/features/batches/forecasting-service.ts`

- **IMPLEMENT**: Replace lines 67-76 with species-aware calculation
- **CODE**:

```typescript
// Case 2: Single sample - calculate from acquisition
if (samples.length === 1) {
  const sample = samples[0]
  const daysSinceAcquisition = differenceInDays(sample.date, acquisitionDate)

  if (daysSinceAcquisition <= 0) {
    return calculateADG(
      [],
      acquisitionDate,
      currentAgeDays,
      growthStandards,
      species,
    )
  }

  // Use species-specific initial weight
  const initialWeightG =
    INITIAL_WEIGHTS[species.toLowerCase()] || DEFAULT_INITIAL_WEIGHT
  const currentWeightG = sample.averageWeightKg * 1000
  const weightGain = currentWeightG - initialWeightG

  return {
    adgGramsPerDay: weightGain / daysSinceAcquisition,
    method: 'single_sample',
  }
}
```

- **VALIDATE**: `bun run lint app/features/batches/forecasting-service.ts`

---

### Task 4: UPDATE calculateADG recursive call in two-sample case

**File**: `app/features/batches/forecasting-service.ts`

- **IMPLEMENT**: Add species parameter to recursive call (around line 63)
- **CODE**:

```typescript
return calculateADG(
  [samples[0]],
  acquisitionDate,
  currentAgeDays,
  growthStandards,
  species, // ADD THIS
)
```

- **VALIDATE**: `npx tsc --noEmit`

---

### Task 5: UPDATE calculateEnhancedProjection to pass species

**File**: `app/features/batches/forecasting.ts`

- **IMPLEMENT**: Add batch.species to calculateADG call (around line 252)
- **CODE**:

```typescript
const adgResult = calculateADG(
  samples.map((s) => ({
    averageWeightKg: Number(s.averageWeightKg),
    date: new Date(s.date),
  })),
  batch.acquisitionDate,
  currentAgeDays,
  growthStandards,
  batch.species, // ADD THIS
)
```

- **VALIDATE**: `npx tsc --noEmit`

---

### Task 6: ADD Nigerian breed FCR targets

**File**: `app/features/monitoring/constants.ts`

- **IMPLEMENT**: Extend FCR_TARGETS_BY_SPECIES object (after line 50)
- **CODE**:

```typescript
export const FCR_TARGETS_BY_SPECIES = {
  // Poultry
  broiler: 1.8,
  layer: 2.2,
  turkey: 2.5,
  duck: 2.8,
  'guinea fowl': 2.5,
  'local chicken': 3.0, // Indigenous breeds less efficient

  // Fish
  catfish: 1.5,
  tilapia: 1.6,
  'african catfish': 1.4, // Clarias gariepinus (most common in Nigeria)
  'hybrid catfish': 1.3, // Heteroclarias

  // Cattle
  dairy: 6.0,
  beef: 8.0,

  // Goats
  boer: 4.0,
  saanen: 4.5,
  'west african dwarf': 5.0, // WAD goat (most common in Nigeria)
  'red sokoto': 4.5,

  // Sheep
  merino: 5.0,
  dorper: 4.5,
  'west african dwarf sheep': 5.5,
  yankasa: 5.0,
  uda: 4.8,

  // Bees
  'apis mellifera': 2.0,
} as const
```

- **VALIDATE**: `bun run lint app/features/monitoring/constants.ts`

---

### Task 7: UPDATE layer mortality thresholds

**File**: `app/features/monitoring/constants.ts`

- **IMPLEMENT**: Change layer thresholds (line 8)
- **CODE**:

```typescript
export const MORTALITY_THRESHOLD_BY_SPECIES = {
  broiler: { alert: 0.03, critical: 0.08 },
  layer: { alert: 0.05, critical: 0.1 }, // CHANGED: Was 0.02/0.05, now 0.05/0.10
  catfish: { alert: 0.05, critical: 0.12 },
  tilapia: { alert: 0.04, critical: 0.1 },
  cattle: { alert: 0.01, critical: 0.03 },
  goats: { alert: 0.02, critical: 0.05 },
  sheep: { alert: 0.02, critical: 0.05 },
  bees: { alert: 0.1, critical: 0.25 },
} as const
```

- **VALIDATE**: `bun run lint app/features/monitoring/constants.ts`

---

### Task 8: ADD breed adjustment factors

**File**: `app/features/batches/alert-service.ts`

- **IMPLEMENT**: Add BREED_ADJUSTMENT constant after imports
- **CODE**:

```typescript
/**
 * Breed performance adjustment factors
 * Local/indigenous breeds have lower baseline expectations
 */
const BREED_ADJUSTMENT: Record<string, number> = {
  // Poultry - local breeds
  'local chicken': 0.7, // 70% of standard growth
  'guinea fowl': 0.75,

  // Goats - local breeds
  'west african dwarf': 0.75,
  'red sokoto': 0.8,

  // Sheep - local breeds
  'west african dwarf sheep': 0.75,
  yankasa: 0.8,
  uda: 0.85,

  // Improved breeds (baseline)
  'cobb 500': 1.0,
  'ross 308': 1.0,
  boer: 1.0,
  dorper: 1.0,
  merino: 1.0,
}
```

- **VALIDATE**: `bun run lint app/features/batches/alert-service.ts`

---

### Task 9: UPDATE determineAlertSeverity to accept breedName

**File**: `app/features/batches/alert-service.ts`

- **IMPLEMENT**: Add breedName parameter and breed adjustment logic (line 30)
- **CODE**:

```typescript
export function determineAlertSeverity(
  performanceIndex: number,
  breedName?: string, // ADD THIS PARAMETER
): AlertResult | null {
  // Adjust threshold based on breed
  const adjustment = breedName
    ? BREED_ADJUSTMENT[breedName.toLowerCase()] || 1.0
    : 1.0

  const adjustedPI = performanceIndex / adjustment

  // Critical: Severely behind schedule (adjusted)
  if (adjustedPI < 80) {
    return {
      shouldAlert: true,
      severity: 'critical',
      type: 'growthDeviation',
      recommendation: generateRecommendation(performanceIndex, 'critical'),
    }
  }

  // Warning: Behind schedule (adjusted)
  if (adjustedPI < 90) {
    return {
      shouldAlert: true,
      severity: 'warning',
      type: 'growthDeviation',
      recommendation: generateRecommendation(performanceIndex, 'warning'),
    }
  }

  // Info: Ahead of schedule
  if (adjustedPI > 110) {
    return {
      shouldAlert: true,
      severity: 'info',
      type: 'earlyHarvest',
      recommendation: generateRecommendation(performanceIndex, 'info'),
    }
  }

  return null
}
```

- **VALIDATE**: `npx tsc --noEmit`

---

### Task 10: ADD water temperature constants

**File**: `app/features/monitoring/constants.ts`

- **IMPLEMENT**: Add temperature thresholds after water quality constants (after line 20)
- **CODE**:

```typescript
// Water temperature thresholds (Celsius)
export const WATER_TEMP_CATFISH_MIN = 25
export const WATER_TEMP_CATFISH_MAX = 32
export const WATER_TEMP_CATFISH_CRITICAL_MIN = 20
export const WATER_TEMP_CATFISH_CRITICAL_MAX = 35

export const WATER_TEMP_TILAPIA_MIN = 28
export const WATER_TEMP_TILAPIA_MAX = 34
export const WATER_TEMP_TILAPIA_CRITICAL_MIN = 22
export const WATER_TEMP_TILAPIA_CRITICAL_MAX = 36
```

- **VALIDATE**: `bun run lint app/features/monitoring/constants.ts`

---

### Task 11: ADD temperature checks to water quality alerts

**File**: `app/features/monitoring/service.ts`

- **IMPLEMENT**: Add temperature check after ammonia check (around line 180)
- **IMPORTS**: Import temperature constants from './constants'
- **CODE**:

```typescript
// Check temperature (critical for fish health)
if (waterQuality.temperatureC) {
  const temp = parseFloat(waterQuality.temperatureC)
  const species = batch.species.toLowerCase()

  if (species === 'catfish' || species === 'african catfish') {
    if (
      temp < WATER_TEMP_CATFISH_CRITICAL_MIN ||
      temp > WATER_TEMP_CATFISH_CRITICAL_MAX
    ) {
      alerts.push({
        id: `temp-critical-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'critical',
        source: 'water_quality',
        message: `Critical Temperature: ${temp}°C (safe range: ${WATER_TEMP_CATFISH_MIN}-${WATER_TEMP_CATFISH_MAX}°C)`,
        timestamp: waterQuality.date,
        value: temp,
      })
    } else if (temp < WATER_TEMP_CATFISH_MIN || temp > WATER_TEMP_CATFISH_MAX) {
      alerts.push({
        id: `temp-warning-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'warning',
        source: 'water_quality',
        message: `Suboptimal Temperature: ${temp}°C (optimal: ${WATER_TEMP_CATFISH_MIN}-${WATER_TEMP_CATFISH_MAX}°C)`,
        timestamp: waterQuality.date,
        value: temp,
      })
    }
  } else if (species === 'tilapia') {
    if (
      temp < WATER_TEMP_TILAPIA_CRITICAL_MIN ||
      temp > WATER_TEMP_TILAPIA_CRITICAL_MAX
    ) {
      alerts.push({
        id: `temp-critical-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'critical',
        source: 'water_quality',
        message: `Critical Temperature: ${temp}°C (safe range: ${WATER_TEMP_TILAPIA_MIN}-${WATER_TEMP_TILAPIA_MAX}°C)`,
        timestamp: waterQuality.date,
        value: temp,
      })
    } else if (temp < WATER_TEMP_TILAPIA_MIN || temp > WATER_TEMP_TILAPIA_MAX) {
      alerts.push({
        id: `temp-warning-${batch.id}-${Date.now()}`,
        batchId: batch.id,
        species: batch.species,
        type: 'warning',
        source: 'water_quality',
        message: `Suboptimal Temperature: ${temp}°C (optimal: ${WATER_TEMP_TILAPIA_MIN}-${WATER_TEMP_TILAPIA_MAX}°C)`,
        timestamp: waterQuality.date,
        value: temp,
      })
    }
  }
}
```

- **VALIDATE**: `bun run lint app/features/monitoring/service.ts`

---

### Task 12: FIX FCR calculation to use average population

**File**: `app/features/monitoring/service.ts`

- **IMPLEMENT**: Replace FCR calculation (around line 230)
- **CODE**:

```typescript
if (totalFeedKg > 0 && avgWeightKg > 0 && batch.currentQuantity > 0) {
  // Calculate average population (accounting for mortality)
  const avgPopulation = (batch.initialQuantity + batch.currentQuantity) / 2
  const totalWeightGainKg = avgWeightKg * avgPopulation
  const fcr = totalFeedKg / totalWeightGainKg

  // ... rest of FCR alert logic
}
```

- **VALIDATE**: `bun run lint app/features/monitoring/service.ts`

---

### Task 13: ADD property test for species-specific ADG

**File**: `tests/features/batches/forecasting-service.property.test.ts`

- **IMPLEMENT**: Add test after existing ADG tests (around line 80)
- **CODE**:

```typescript
it('Property 4: Single-sample ADG should account for initial weight', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0.5, max: 3.0, noNaN: true }), // final weight kg
      fc.integer({ min: 7, max: 56 }), // days since acquisition
      fc.constantFrom('broiler', 'catfish', 'layer', 'tilapia'),
      (finalWeight, days, species) => {
        const acquisitionDate = new Date('2024-01-01')
        const sampleDate = new Date(
          acquisitionDate.getTime() + days * 24 * 60 * 60 * 1000,
        )

        const samples = [{ averageWeightKg: finalWeight, date: sampleDate }]

        const result = calculateADG(samples, acquisitionDate, days, [], species)

        // ADG should be positive and reasonable
        expect(result.adgGramsPerDay).toBeGreaterThan(0)
        expect(result.adgGramsPerDay).toBeLessThan(200) // Max ~200g/day for broilers
        expect(result.method).toBe('single_sample')

        // Verify it's not just weight/days (which would ignore initial weight)
        const naiveADG = (finalWeight * 1000) / days
        expect(result.adgGramsPerDay).not.toBeCloseTo(naiveADG, 1)
      },
    ),
  )
})
```

- **VALIDATE**: `bun run test tests/features/batches/forecasting-service.property.test.ts`

---

### Task 14: ADD unit test for breed adjustment

**File**: `tests/features/batches/alert-service.property.test.ts`

- **IMPLEMENT**: Add test for breed-adjusted alerts
- **CODE**:

```typescript
describe('determineAlertSeverity with breed adjustment', () => {
  it('should adjust thresholds for local breeds', () => {
    // Local chicken at 70% of expected weight
    const localChickenPI = 70
    const result = determineAlertSeverity(localChickenPI, 'local chicken')

    // With 0.7 adjustment: 70 / 0.7 = 100 (on track)
    expect(result).toBeNull()
  })

  it('should not adjust for improved breeds', () => {
    // Cobb 500 at 70% of expected weight
    const cobb500PI = 70
    const result = determineAlertSeverity(cobb500PI, 'cobb 500')

    // No adjustment: 70 < 80 (critical)
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('critical')
  })

  it('should handle unknown breeds with no adjustment', () => {
    const unknownBreedPI = 85
    const result = determineAlertSeverity(unknownBreedPI, 'unknown breed')

    // No adjustment: 85 < 90 (warning)
    expect(result).not.toBeNull()
    expect(result?.severity).toBe('warning')
  })
})
```

- **VALIDATE**: `bun run test tests/features/batches/alert-service.property.test.ts`

---

## TESTING STRATEGY

### Unit Tests

**Location**: `tests/features/batches/`, `tests/features/monitoring/`
**Framework**: Vitest + fast-check
**Coverage Target**: 90%+ for business logic

**Test Coverage:**

- Property tests for ADG with species-specific initial weights
- Unit tests for breed adjustment factors
- Unit tests for temperature threshold checks
- Unit tests for mortality-adjusted FCR

### Integration Tests

**Scope**: Not required - all changes are pure functions

### Edge Cases

**Species-specific edge cases:**

- Unknown species defaults to broiler initial weight (40g)
- Unknown breed defaults to no adjustment (1.0)
- Missing temperature data doesn't crash water quality checks
- Zero or negative population handled in FCR calculation

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# Type checking (fail fast)
npx tsc --noEmit || exit 1

# Linting (fail fast)
bun run lint || exit 1
```

### Level 2: Unit Tests

```bash
# Run forecasting service tests
bun run test tests/features/batches/forecasting-service.property.test.ts

# Run alert service tests
bun run test tests/features/batches/alert-service.property.test.ts

# Run monitoring service tests
bun run test tests/features/monitoring/

# Run all tests
bun run test --run || exit 1
```

### Level 3: Build Verification

```bash
# Verify production build works
bun run build || exit 1
```

### Complete Validation

```bash
# Run all checks
bun run check && bun run test --run && bun run build
```

---

## ACCEPTANCE CRITERIA

- [ ] ADG calculation uses species-specific initial weights
- [ ] All calculateADG calls include species parameter
- [ ] Nigerian breed FCR targets added to constants
- [ ] Layer mortality thresholds adjusted to 5%/10%
- [ ] Growth alerts use breed adjustment factors
- [ ] Water quality checks include temperature thresholds
- [ ] FCR calculation uses average population
- [ ] All validation commands pass
- [ ] Test coverage maintained at 90%+
- [ ] No regressions in existing tests
- [ ] Property tests verify ADG invariants with initial weights
- [ ] Unit tests verify breed adjustments work correctly

---

## COMPLETION CHECKLIST

- [ ] Task 1-5: ADG calculation fixes completed
- [ ] Task 6-7: Nigerian breed constants added
- [ ] Task 8-9: Breed adjustment implemented
- [ ] Task 10-11: Temperature checks added
- [ ] Task 12: FCR calculation fixed
- [ ] Task 13-14: Tests added and passing
- [ ] All validation commands executed successfully
- [ ] Full test suite passes (300+ tests)
- [ ] No linting or type checking errors
- [ ] Build succeeds

---

## NOTES

**Design Decisions:**

1. **Initial weights**: Used conservative estimates based on FAO data for Nigerian livestock
2. **Breed adjustments**: Set at 70-85% for local breeds based on field performance data
3. **Layer mortality**: Adjusted to industry standard for 18-month production cycle
4. **Temperature thresholds**: Based on optimal ranges for Nigerian climate conditions

**Trade-offs:**

- Initial weight estimates are conservative (may underestimate ADG slightly)
- Breed adjustments are broad categories (could be more granular per breed)
- Temperature checks only for catfish/tilapia (could extend to other species)

**Future Enhancements:**

- Add seasonal adjustment factors (rainy vs dry season)
- Extend growth standards to include expected feed intake
- Add feed inventory warnings to harvest projections
- Add region-specific breed performance data
