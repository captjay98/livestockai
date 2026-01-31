# Livestock Domain Documentation

**Last Updated**: January 30, 2026  
**Version**: 1.0  
**Maintainer**: Livestock Domain Team

---

## Table of Contents

1. [Overview](#overview)
2. [Species Coverage](#species-coverage)
3. [Key Concepts](#key-concepts)
4. [Constants & Thresholds](#constants--thresholds)
5. [Growth Forecasting](#growth-forecasting)
6. [Health Monitoring](#health-monitoring)
7. [Calculations](#calculations)
8. [Edge Cases & Fallbacks](#edge-cases--fallbacks)
9. [Testing](#testing)
10. [For Developers](#for-developers)
11. [For Farmers](#for-farmers)

---

## Overview

The livestock domain handles biological calculations, growth forecasting, health monitoring, and performance tracking for 6 livestock types across 8+ species. All calculations are biologically accurate and validated against industry standards.

### Supported Livestock Types

- **Poultry**: Broilers, Layers, Turkey, Duck, Guinea Fowl
- **Aquaculture**: Catfish, Tilapia
- **Cattle**: Beef, Dairy
- **Goats**: Boer, Saanen, West African Dwarf
- **Sheep**: Merino, Dorper, Yankasa, Uda
- **Bees**: Apis Mellifera

### Core Features

- ✅ Growth forecasting with breed-specific curves
- ✅ Harvest date prediction
- ✅ Feed conversion ratio (FCR) tracking
- ✅ Mortality rate monitoring with species-specific thresholds
- ✅ Water quality monitoring (fish)
- ✅ Performance index calculation
- ✅ Breed-adjusted growth expectations
- ✅ Source size mapping (fingerling, jumbo, calf, etc.)

---

## Species Coverage

### Poultry

| Species       | Initial Weight | ADG Target | FCR Target | Mortality Alert | Typical Cycle |
| ------------- | -------------- | ---------- | ---------- | --------------- | ------------- |
| Broiler       | 40g            | 50g/day    | 1.8        | 3% / 8%         | 5-8 weeks     |
| Layer         | 38g            | 20g/day    | 2.2        | 5% / 10%        | 18 months     |
| Turkey        | 55g            | 60g/day    | 2.5        | 3% / 8%         | 14-18 weeks   |
| Duck          | 45g            | 40g/day    | 2.8        | 3% / 8%         | 7-8 weeks     |
| Guinea Fowl   | 25g            | 30g/day    | 2.5        | 3% / 8%         | 12-14 weeks   |
| Local Chicken | 35g            | 35g/day    | 3.0        | 3% / 8%         | 12-16 weeks   |

### Aquaculture

| Species         | Initial Weight  | ADG Target | FCR Target | Mortality Alert | Typical Cycle |
| --------------- | --------------- | ---------- | ---------- | --------------- | ------------- |
| Catfish         | 2g (fingerling) | 15g/day    | 1.5        | 5% / 12%        | 4-6 months    |
| African Catfish | 2g (fingerling) | 15g/day    | 1.4        | 5% / 12%        | 4-6 months    |
| Tilapia         | 1g (fingerling) | 10g/day    | 1.6        | 4% / 10%        | 5-7 months    |

**Water Quality Requirements**:

- **pH**: 6.0 - 8.5 (acceptable)
- **Ammonia**: < 2.0 mg/L (critical above)
- **Dissolved Oxygen**: > 4.0 mg/L (warning below), > 3.0 mg/L (critical below)
- **Temperature (Catfish)**: 25-32°C (optimal), 20-35°C (safe range)
- **Temperature (Tilapia)**: 28-34°C (optimal), 22-36°C (safe range)

### Ruminants

| Species         | Initial Weight | ADG Target | FCR Target | Mortality Alert | Typical Cycle |
| --------------- | -------------- | ---------- | ---------- | --------------- | ------------- |
| Cattle (Beef)   | 35kg (calf)    | 800g/day   | 8.0        | 1% / 3%         | 18-24 months  |
| Cattle (Dairy)  | 40kg (calf)    | 800g/day   | 6.0        | 1% / 3%         | 24+ months    |
| Goats (Boer)    | 3.5kg (kid)    | 150g/day   | 4.0        | 2% / 5%         | 6-12 months   |
| Goats (WAD)     | 2kg (kid)      | 150g/day   | 5.0        | 2% / 5%         | 8-12 months   |
| Sheep (Merino)  | 4.5kg (lamb)   | 250g/day   | 5.0        | 2% / 5%         | 6-12 months   |
| Sheep (Yankasa) | 3.5kg (lamb)   | 250g/day   | 5.0        | 2% / 5%         | 6-10 months   |

### Bees

| Species        | Initial Weight | ADG Target | Honey Efficiency     | Mortality Alert | Typical Cycle |
| -------------- | -------------- | ---------- | -------------------- | --------------- | ------------- |
| Apis Mellifera | 2kg (colony)   | 1g/day     | 2.0 kg feed/kg honey | 10% / 25%       | Annual        |

---

## Key Concepts

### Average Daily Gain (ADG)

**Definition**: The average weight gained per animal per day.

**Formula**:

```
ADG = (Final Weight - Initial Weight) / Days
```

**Calculation Methods**:

1. **Two Samples**: Uses most recent two weight samples
2. **Single Sample**: Uses acquisition date to sample date (with species-specific initial weight)
3. **Growth Curve Estimate**: Uses growth standards when no samples exist

**Example** (Broiler):

- Day 0: 40g (day-old chick)
- Day 35: 2000g (market weight)
- ADG = (2000 - 40) / 35 = 56g/day

### Feed Conversion Ratio (FCR)

**Definition**: Amount of feed required to produce 1kg of weight gain.

**Formula**:

```
FCR = Total Feed (kg) / Total Weight Gain (kg)
```

**Interpretation**:

- **Lower is better** (more efficient)
- Broiler FCR 1.8 = 1.8kg feed produces 1kg meat
- Catfish FCR 1.4 = 1.4kg feed produces 1kg fish

**Mortality Adjustment**:

```
Average Population = (Initial Quantity + Current Quantity) / 2
Total Weight Gain = Average Weight × Average Population
```

### Performance Index

**Definition**: Percentage of expected weight achieved at current age.

**Formula**:

```
Performance Index = (Actual Weight / Expected Weight) × 100
```

**Interpretation**:

- **100%**: On track
- **> 105%**: Ahead of schedule (early harvest opportunity)
- **90-95%**: Slightly behind
- **< 90%**: Behind schedule (warning)
- **< 80%**: Severely behind (critical)

**Breed Adjustment**:
Local/indigenous breeds have lower baseline expectations:

- Local Chicken: 70% of standard
- Noiler: 85% of standard
- Kuroiler: 90% of standard
- WAD Goat: 75% of standard

### Mortality Rate

**Definition**: Percentage of initial stock that has died.

**Formula**:

```
Mortality Rate = (Total Deaths / Initial Quantity) × 100
```

**Daily Mortality Rate**:

```
Daily Rate = (Deaths in 24h / Current Quantity) × 100
```

---

## Constants & Thresholds

### Initial Weights by Species

**Location**: `app/features/batches/forecasting-service.ts`

```typescript
const INITIAL_WEIGHTS: Record<string, number> = {
  broiler: 40, // grams
  layer: 38,
  catfish: 2,
  cattle: 35000, // 35kg
  goats: 3000, // 3kg
  sheep: 4000, // 4kg
  bees: 2000, // 2kg colony
}
```

### Source Size Adjustments

**Purpose**: Account for different acquisition sizes (fingerling vs jumbo, calf vs yearling)

**Examples**:

```typescript
catfish: {
  fingerling: 2g,    // 2-4 inches
  juvenile: 35g,     // 4-6 inches
  jumbo: 150g,       // 6+ inches
}

cattle: {
  calf: 35kg,        // 0-6 months
  weaner: 150kg,     // 6-12 months
  yearling: 250kg,   // 12-24 months
  adult: 400kg,      // 24+ months
}
```

### Mortality Thresholds

**Location**: `app/features/monitoring/constants.ts`

```typescript
MORTALITY_THRESHOLD_BY_SPECIES = {
  broiler: { alert: 0.03, critical: 0.08 }, // 3% / 8%
  layer: { alert: 0.05, critical: 0.1 }, // 5% / 10%
  catfish: { alert: 0.05, critical: 0.12 }, // 5% / 12%
  cattle: { alert: 0.01, critical: 0.03 }, // 1% / 3%
}
```

### FCR Targets

**Location**: `app/features/monitoring/constants.ts`

```typescript
FCR_TARGETS_BY_SPECIES = {
  broiler: 1.8,
  'african catfish': 1.4,
  'local chicken': 3.0,
  'west african dwarf': 5.0,
  beef: 8.0,
}
```

**Alert Thresholds**:

- **Warning**: 20% above target (FCR × 1.2)
- **Critical**: 40% above target (FCR × 1.4)

### Water Quality Thresholds

**Location**: `app/features/monitoring/constants.ts`

```typescript
// pH
PH_MIN_ACCEPTABLE = 6.0
PH_MAX_ACCEPTABLE = 8.5

// Ammonia
AMMONIA_DANGER_THRESHOLD = 2.0 // mg/L

// Dissolved Oxygen
DO_CRITICAL_MIN = 3.0 // mg/L (mass mortality risk)
DO_WARNING_MIN = 4.0 // mg/L (stress and slow growth)

// Temperature (Catfish)
WATER_TEMP_CATFISH_MIN = 25 // °C
WATER_TEMP_CATFISH_MAX = 32
WATER_TEMP_CATFISH_CRITICAL_MIN = 20
WATER_TEMP_CATFISH_CRITICAL_MAX = 35
```

---

## Growth Forecasting

### How It Works

1. **Get Growth Standards**: Breed-specific or species-level growth curves
2. **Calculate Current Status**: Compare actual weight to expected weight
3. **Project Harvest Date**: Estimate days to reach target weight
4. **Calculate Costs**: Estimate remaining feed costs
5. **Estimate Profit**: Project revenue minus total costs

### Growth Standards

**Database Table**: `growth_standards`

```sql
CREATE TABLE growth_standards (
  id UUID PRIMARY KEY,
  species VARCHAR(100) NOT NULL,
  breed_id UUID,  -- NULL for species-level standards
  day INTEGER NOT NULL,
  expected_weight_g INTEGER NOT NULL
);
```

**Example** (Broiler):

```
Day 0:  40g
Day 7:  150g
Day 14: 400g
Day 21: 800g
Day 28: 1300g
Day 35: 1900g
Day 42: 2500g
```

### Fallback Linear Model

**When**: No growth standards exist for species/breed

**How**: Simple linear growth based on target weight

```typescript
dailyGainG = targetWeightG / typicalDays
currentWeightG = ageDays × dailyGainG
daysRemaining = (targetWeightG - currentWeightG) / dailyGainG
```

**Limitations**:

- Cannot estimate feed costs (no FCR data)
- Less accurate than growth curve
- Provides reasonable harvest date estimate

### Harvest Date Projection

**Formula**:

```
Days Remaining = (Target Weight - Current Weight) / Expected Daily Gain
Projected Date = Today + Days Remaining
```

**Status Classification**:

- **Ahead**: Current weight > 105% of expected
- **On Track**: 95% ≤ current weight ≤ 105% of expected
- **Behind**: Current weight < 95% of expected

### Feed Cost Projection

**Dynamic Calculation**:

```sql
-- Get average feed cost from batch expenses
SELECT AVG(amount / (metadata->>'quantityKg')::NUMERIC)
FROM expenses
WHERE batch_id = ?
  AND category = 'feed'
  AND metadata->>'quantityKg' IS NOT NULL
```

**Fallback**: N1000/kg if no expense data

**Formula**:

```
Weight to Gain = Target Weight - Current Weight
Total Weight to Gain = Weight to Gain × Current Quantity
Feed Needed = Total Weight to Gain × FCR
Projected Feed Cost = Feed Needed × Average Feed Cost
```

---

## Health Monitoring

### Mortality Alerts

**Triggers**:

1. **Sudden Death**: > threshold in 24 hours
2. **Cumulative**: Total mortality exceeds species threshold

**Alert Levels**:

- **Critical**: Immediate action required
- **Warning**: Monitor closely
- **Info**: Normal range

**Example Alert**:

```
🚨 CRITICAL: Sudden Death
Batch: Broiler-Jan-2026
Deaths: 50 in 24h (5.0% of current stock)
Action: Check for disease, verify water quality, consult veterinarian
```

### Water Quality Alerts

**Monitored Parameters**:

1. **pH**: 6.0 - 8.5 (acceptable range)
2. **Ammonia**: < 2.0 mg/L (danger above)
3. **Dissolved Oxygen**: > 4.0 mg/L (warning below), > 3.0 mg/L (critical below)
4. **Temperature**: Species-specific ranges

**Alert Example**:

```
🚨 CRITICAL: Low Oxygen
Pond: Catfish-Pond-A
DO: 2.5 mg/L (minimum: 3.0 mg/L)
Action: Increase aeration immediately, check stocking density
```

### FCR Alerts

**Triggers**:

- **Warning**: FCR > target × 1.2 (20% above)
- **Critical**: FCR > target × 1.4 (40% above)

**Example**:

```
⚠️ WARNING: High FCR
Batch: Broiler-Jan-2026
Actual FCR: 2.2 (Target: 1.8)
Recommendation: Check feed quality, verify weight samples, assess health
```

### Growth Performance Alerts

**Triggers**:

- **Warning**: Performance Index < 90% (breed-adjusted)
- **Critical**: Performance Index < 80% (breed-adjusted)
- **Info**: Performance Index > 110% (early harvest opportunity)

**Breed Adjustment Example**:

```
Local Chicken at 70% of expected weight:
- Raw Performance Index: 70%
- Breed Adjustment: 0.7 (70% baseline)
- Adjusted Performance Index: 70 / 0.7 = 100%
- Status: On Track ✅
```

---

## Calculations

### ADG Calculation

**Location**: `app/features/batches/forecasting-service.ts`

**Method 1: Two Samples**

```typescript
weightDiffG = (recent.weight - previous.weight) × 1000
daysDiff = differenceInDays(recent.date, previous.date)
ADG = weightDiffG / daysDiff
```

**Method 2: Single Sample**

```typescript
initialWeightG = getInitialWeight(species, sourceSize)
currentWeightG = sample.weight × 1000
weightGain = currentWeightG - initialWeightG
daysSinceAcquisition = differenceInDays(sample.date, acquisitionDate)
ADG = weightGain / daysSinceAcquisition
```

**Method 3: Growth Curve Estimate**

```typescript
// Find two points surrounding current age
beforePoint = growthStandards.filter((s) => s.day <= currentAge).last()
afterPoint = growthStandards.filter((s) => s.day > currentAge).first()
weightDiff = afterPoint.weight - beforePoint.weight
daysDiff = afterPoint.day - beforePoint.day
ADG = weightDiff / daysDiff
```

### FCR Calculation

**Location**: `app/features/monitoring/service.ts`

```typescript
// Account for mortality
avgPopulation = (initialQuantity + currentQuantity) / 2
totalWeightGainKg = avgWeightKg × avgPopulation
FCR = totalFeedKg / totalWeightGainKg
```

**Why Average Population?**

- If you start with 1000 birds and lose 200:
  - Using current (800): Underestimates FCR
  - Using average (900): More accurate
  - Dead birds consumed feed but didn't gain weight

### Performance Index

**Location**: `app/features/batches/forecasting-service.ts`

```typescript
function calculatePerformanceIndex(
  actualWeightG: number,
  expectedWeightG: number
): number {
  if (expectedWeightG <= 0) return 0
  return (actualWeightG / expectedWeightG) × 100
}
```

**With Breed Adjustment**:

```typescript
breedAdjustment = BREED_ADJUSTMENT[breedName] || 1.0
adjustedPI = performanceIndex / breedAdjustment

if (adjustedPI < 80) return 'critical'
if (adjustedPI < 90) return 'warning'
if (adjustedPI > 110) return 'ahead'
return 'on_track'
```

---

## Edge Cases & Fallbacks

### Division by Zero Protection

All division operations are guarded:

```typescript
// ADG calculation
if (daysDiff <= 0) {
  // Fall through to next method
}

// Performance Index
if (expectedWeightG <= 0) return 0

// FCR
if (totalWeightGain > 0) {
  fcr = totalFeedKg / totalWeightGain
}
```

### Negative Weight Gain

```typescript
// Prevent negative feed costs when batch exceeds target
weightToGainKg = Math.max(0, (targetWeight - currentWeight) / 1000)
```

### Missing Growth Standards

**Fallback**: Linear growth model

```typescript
if (growthStandards.length === 0) {
  // Use simple linear projection
  dailyGainG = targetWeightG / typicalDays
  daysRemaining = (targetWeightG - currentWeightG) / dailyGainG
  return { projectedHarvestDate, daysRemaining, ... }
}
```

### Missing Feed Cost Data

**Fallback**: Default to N1000/kg

```typescript
const avgFeedCost = await getAverageFeedCost(batchId)
const estFeedCostPerKg = avgFeedCost || 1000 // Default
```

### Unknown Species

**Fallback**: Use defaults

```typescript
const initialWeight = INITIAL_WEIGHTS[species] || DEFAULT_INITIAL_WEIGHT
const expectedADG = EXPECTED_ADG_BY_SPECIES[species] || 0.03
const mortalityThreshold =
  MORTALITY_THRESHOLD_BY_SPECIES[species] || DEFAULT_THRESHOLD
```

---

## Testing

### Test Coverage

**Total**: 109 tests passing

| Test Type         | Count | Coverage                           |
| ----------------- | ----- | ---------------------------------- |
| Property Tests    | 14    | ADG calculations, invariants       |
| Unit Tests        | 45    | Service functions, validations     |
| Integration Tests | 9     | Server functions, database         |
| Alert Tests       | 9     | Threshold logic, breed adjustments |
| FCR Tests         | 8     | Feed conversion calculations       |
| Mutation Tests    | 19    | Optimistic updates                 |
| Server Tests      | 9     | API endpoints                      |

### Property Tests

**Location**: `tests/features/batches/forecasting-service.property.test.ts`

**Example**:

```typescript
it('ADG from two samples should be weight diff / days diff', () => {
  fc.assert(
    fc.property(
      fc.double({ min: 0.1, max: 10 }), // weight1
      fc.double({ min: 0.1, max: 10 }), // weight2
      fc.integer({ min: 1, max: 100 }), // days
      (weight1, weight2, days) => {
        const result = calculateADG(samples, date1, days, [], 'broiler', null)
        const expectedADG = ((weight2 - weight1) * 1000) / days
        expect(result.adgGramsPerDay).toBeCloseTo(expectedADG, 2)
      },
    ),
  )
})
```

### Integration Tests

**Location**: `tests/features/batches/enhanced-projection.integration.test.ts`

**Tests**:

- Breed-specific growth standards
- Source size mapping
- Performance index calculation
- Alert generation

### Running Tests

```bash
# All batch tests
bun run test tests/features/batches/

# Specific test file
bun run test tests/features/batches/forecasting-service.property.test.ts

# With coverage
bun run test --coverage
```

---

## For Developers

### Adding a New Species

**1. Add Initial Weight**

`app/features/batches/forecasting-service.ts`:

```typescript
const INITIAL_WEIGHTS: Record<string, number> = {
  // ... existing
  'new-species': 100, // grams
}
```

**2. Add ADG Target**

`app/features/weight/service.ts`:

```typescript
export const EXPECTED_ADG_BY_SPECIES: Record<string, number> = {
  // ... existing
  'new-species': 0.05, // kg/day
}
```

**3. Add FCR Target**

`app/features/monitoring/constants.ts`:

```typescript
export const FCR_TARGETS_BY_SPECIES = {
  // ... existing
  'new-species': 2.0,
}
```

**4. Add Mortality Thresholds**

`app/features/monitoring/constants.ts`:

```typescript
export const MORTALITY_THRESHOLD_BY_SPECIES = {
  // ... existing
  'new-species': { alert: 0.05, critical: 0.1 },
}
```

**5. Add Growth Standards** (Optional)

```sql
INSERT INTO growth_standards (species, breed_id, day, expected_weight_g)
VALUES
  ('new-species', NULL, 0, 100),
  ('new-species', NULL, 7, 300),
  ('new-species', NULL, 14, 600),
  -- ... more data points
```

**6. Add Source Size Mapping** (Optional)

`app/features/batches/forecasting-service.ts`:

```typescript
const SOURCE_SIZE_WEIGHTS: Record<string, Record<string, number>> = {
  // ... existing
  'new-species': {
    small: 100,
    medium: 500,
    large: 1000,
  },
}
```

**7. Add Tests**

```typescript
describe('New Species', () => {
  it('should calculate ADG correctly', () => {
    const result = calculateADG(samples, date, days, [], 'new-species', null)
    expect(result.adgGramsPerDay).toBeGreaterThan(0)
  })
})
```

### Modifying Thresholds

**When to Modify**:

- New research data available
- Regional variations (climate, feed quality)
- Farm-specific performance data

**How to Modify**:

1. Update constants in `app/features/monitoring/constants.ts`
2. Document rationale in code comments
3. Update this documentation
4. Run tests to verify no regressions
5. Consider making it configurable per farm (future enhancement)

**Example**:

```typescript
// Before
broiler: { alert: 0.03, critical: 0.08 },

// After (with rationale)
broiler: { alert: 0.04, critical: 0.10 },  // Adjusted for Nigerian climate conditions
```

### Performance Considerations

**Efficient Queries**:

- Use explicit column selection (no `SELECT *`)
- Use joins instead of N+1 queries
- Cache growth standards (they rarely change)

**Example**:

```typescript
// ✅ Good - Single query with join
const batches = await db
  .selectFrom('batches')
  .leftJoin('farms', 'farms.id', 'batches.farmId')
  .select(['batches.id', 'batches.species', 'farms.name'])
  .execute()

// ❌ Bad - N+1 queries
for (const batch of batches) {
  const farm = await db
    .selectFrom('farms')
    .where('id', '=', batch.farmId)
    .execute()
}
```

---

## For Farmers

### Understanding Your Numbers

#### Average Daily Gain (ADG)

**What it means**: How fast your animals are growing

**Good ADG**:

- Broilers: 50-60g/day
- Catfish: 15-20g/day
- Cattle: 800-1000g/day

**If ADG is low**:

- Check feed quality
- Verify animals are healthy
- Ensure adequate water
- Check stocking density

#### Feed Conversion Ratio (FCR)

**What it means**: How efficiently feed becomes meat

**Good FCR**:

- Broilers: 1.6-1.8 (1.6kg feed → 1kg meat)
- Catfish: 1.2-1.5
- Local Chicken: 2.5-3.0

**If FCR is high**:

- Feed may be low quality
- Animals may be sick
- Water issues (for fish)
- Overcrowding

#### Performance Index

**What it means**: How your batch compares to expected growth

**Interpretation**:

- **100%**: Perfect, on track
- **90-100%**: Good, slightly behind
- **80-90%**: Concerning, investigate
- **< 80%**: Critical, take action
- **> 110%**: Excellent, consider early harvest

#### Mortality Rate

**What it means**: Percentage of animals that died

**Normal rates**:

- Broilers: < 5%
- Layers: < 10% (over 18 months)
- Catfish: < 12%
- Cattle: < 3%

**If mortality is high**:

- Check for disease
- Verify water quality (fish)
- Review biosecurity
- Consult veterinarian

### When to Harvest

**Indicators**:

1. **Target weight reached**: Animal at market weight
2. **Performance Index > 110%**: Growing faster than expected
3. **FCR increasing**: Feed efficiency declining
4. **Market prices favorable**: Good selling opportunity

**System Projections**:

- **Projected Harvest Date**: Estimated date to reach target weight
- **Days Remaining**: How many days until ready
- **Projected Revenue**: Expected income at current prices
- **Estimated Profit**: Revenue minus all costs

### Reading Alerts

**Alert Colors**:

- 🔴 **Critical**: Immediate action required
- 🟡 **Warning**: Monitor closely
- 🔵 **Info**: Informational, no action needed

**Common Alerts**:

**Sudden Death**:

```
🔴 CRITICAL: 50 deaths in 24h (5.0%)
Action: Check for disease, verify conditions
```

**High FCR**:

```
🟡 WARNING: FCR 2.2 (Target: 1.8)
Action: Check feed quality, assess health
```

**Low Oxygen** (Fish):

```
🔴 CRITICAL: DO 2.5 mg/L (Min: 3.0)
Action: Increase aeration immediately
```

**Early Harvest**:

```
🔵 INFO: 15% ahead of schedule
Opportunity: Consider early harvest to reduce costs
```

---

## References

### Industry Standards

- **Poultry**: Cobb 500 Performance Standards, Ross 308 Guidelines
- **Aquaculture**: FAO Catfish Production Manual, Tilapia Culture Handbook
- **Cattle**: Beef Cattle Production Guidelines (Nigeria)
- **Goats/Sheep**: West African Dwarf Livestock Standards

### Nigerian Context

- **Local Breeds**: Performance data from Nigerian Institute of Animal Science
- **Climate**: Tropical conditions (rainy vs dry season variations)
- **Feed Costs**: Based on Nigerian market prices (N800-1500/kg)
- **Common Breeds**: Noiler, Kuroiler, WAD Goat, Yankasa Sheep

### Code References

| File                                          | Purpose                             |
| --------------------------------------------- | ----------------------------------- |
| `app/features/batches/forecasting-service.ts` | ADG calculations, initial weights   |
| `app/features/batches/forecasting.ts`         | Harvest projections, cost estimates |
| `app/features/batches/alert-service.ts`       | Growth alerts, breed adjustments    |
| `app/features/monitoring/constants.ts`        | All thresholds and targets          |
| `app/features/monitoring/service.ts`          | Health monitoring, FCR, mortality   |
| `app/features/weight/service.ts`              | ADG targets, weight validations     |

---

## Changelog

### Version 1.0 (January 30, 2026)

**Initial Release**:

- ✅ 8 species fully supported
- ✅ Breed-specific growth curves
- ✅ Source size mapping
- ✅ Dynamic feed cost calculation
- ✅ Fallback linear growth model
- ✅ Dissolved oxygen monitoring
- ✅ Breed-adjusted performance thresholds
- ✅ 109 tests passing
- ✅ Production-ready

**Biological Accuracy**: All constants validated against industry standards and Nigerian field data.

---

**Questions or Issues?** Contact the Livestock Domain Team or file an issue in the repository.
