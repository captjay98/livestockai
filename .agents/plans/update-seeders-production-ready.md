# Feature: Update Seeders for Production Readiness

## Feature Description

Update production and dev seeders to support all 6 livestock types, integrate with module system, create realistic Nigerian demo farms, and expand database enums for better coverage and granularity.

## Problem Statement

Current seeders have critical gaps:
1. Missing 4 livestock types (cattle, goats, sheep, bees)
2. No farm_modules integration (farms can't create batches)
3. Only 1 demo farm (not realistic)
4. Market prices in production seeder (should be removed)
5. USD default currency (should be NGN)
6. **Limited enum coverage** - missing common options in 8 categories

## Solution Statement

**Production Seeder**:
- Remove market prices
- Change default currency to NGN
- Add growth standards for all 6 livestock types
- Add farm_modules when creating farms

**Dev Seeder**:
- Create 4-5 realistic Nigerian farms with different module combinations
- Add demo batches for all 6 livestock types
- Realistic Nigerian locations, prices, transactions

**Database Schema**:
- Expand 8 enum types with 28 new values for better coverage
- Update migration to add new enum values

## Feature Metadata

**Feature Type**: Data/Infrastructure
**Estimated Complexity**: Medium
**Primary Systems Affected**: Seeders, Modules
**Dependencies**: Module system (already implemented)

---

## REALISTIC FARM SCENARIOS

### Farm 1: "Sunrise Poultry Farm" - Kaduna
**Modules**: Poultry only
**Focus**: Large-scale broiler and layer production
**Batches**: 3-4 broiler batches, 2 layer batches
**Location**: Kaduna, Nigeria

### Farm 2: "Blue Waters Fish Farm" - Ibadan
**Modules**: Aquaculture only
**Focus**: Catfish and tilapia production
**Batches**: 2-3 catfish batches, 1-2 tilapia batches
**Location**: Ibadan, Oyo State

### Farm 3: "Green Valley Mixed Farm" - Jos
**Modules**: Poultry + Aquaculture
**Focus**: Integrated poultry-fish farming
**Batches**: 2 broiler, 1 layer, 2 catfish
**Location**: Jos, Plateau State

### Farm 4: "Savanna Livestock Ranch" - Kano
**Modules**: Cattle + Goats + Sheep
**Focus**: Ruminant livestock production
**Batches**: 1-2 cattle, 2 goat, 1 sheep
**Location**: Kano, Nigeria

### Farm 5: "Golden Hive Apiary" - Enugu
**Modules**: Bees only
**Focus**: Honey production
**Batches**: 3-5 bee colonies
**Location**: Enugu, Nigeria

---

## GROWTH STANDARDS DATA

### Cattle (Angus/Holstein)
- Birth: 40kg
- 6 months: 180kg
- 12 months: 350kg
- 18 months: 500kg
- 24 months: 650kg (market weight)

### Goats (Boer/Kalahari)
- Birth: 3kg
- 3 months: 15kg
- 6 months: 25kg
- 9 months: 35kg
- 12 months: 45kg (market weight)

### Sheep (Merino/Dorper)
- Birth: 4kg
- 3 months: 18kg
- 6 months: 30kg
- 9 months: 42kg
- 12 months: 55kg (market weight)

### Bees (Colony strength)
- Month 0: 10,000 bees
- Month 3: 30,000 bees
- Month 6: 50,000 bees
- Month 9: 60,000 bees
- Month 12: 70,000 bees (mature colony)

---

## DATABASE ENUM EXPANSIONS

Based on comprehensive audit (see `.agents/constants-audit.md`), expand 8 enum types:

### 1. Structure Types (Add 5)
```typescript
// Current: 9 types
// Add: 'tank', 'tarpaulin', 'raceway', 'feedlot', 'kraal'
```

### 2. Mortality Causes (Add 5)
```typescript
// Current: 5 types
// Add: 'starvation', 'injury', 'poisoning', 'suffocation', 'culling'
```

### 3. Sale Unit Types (Add 4)
```typescript
// Current: 4 types
// Add: 'liter', 'head', 'colony', 'fleece'
```

### 4. Payment Methods (Add 3)
```typescript
// Current: 3 types
// Add: 'mobile_money', 'check', 'card'
```

### 5. Sale Livestock Types (Add 4)
```typescript
// Current: 9 types
// Add: 'beeswax', 'propolis', 'royal_jelly', 'manure'
```

### 6. Customer Types (Add 3)
```typescript
// Current: 4 types
// Add: 'processor', 'exporter', 'government'
```

### 7. Expense Categories (Add 2)
```typescript
// Current: 15 types
// Add: 'insurance', 'veterinary'
```

### 8. Medication Units (Add 2)
```typescript
// Current: 6 types
// Add: 'kg', 'liter'
```

**Total**: 28 new enum values

---

## STEP-BY-STEP TASKS

### Task 0: Update database types with new enums

- **FILE**: `app/lib/db/types.ts`
- **UPDATE**: All 8 enum types with new values
- **VALIDATE**: `npx tsc --noEmit`

### Task 1: Update DEFAULT_SETTINGS to NGN

- **FILE**: `app/features/settings/currency-presets.ts`
- **CHANGE**: Default currency from USD to NGN
```typescript
export const DEFAULT_SETTINGS = {
  currencyCode: 'NGN',
  currencySymbol: '₦',
  // ... rest
}
```
- **VALIDATE**: `npx tsc --noEmit`

### Task 2: Update production seeder

- **FILE**: `app/lib/db/seed.ts`
- **REMOVE**: Market prices section (lines ~150-220)
- **ADD**: Growth standards for cattle, goats, sheep, bees
- **PATTERN**: Follow existing `generateBroilerGrowthStandards()` pattern
- **VALIDATE**: `bun run db:seed` (test run)

### Task 3: Update dev seeder - Add farm_modules helper

- **FILE**: `app/lib/db/seed-dev.ts`
- **ADD**: Helper function to create farm with modules
```typescript
async function createFarmWithModules(
  userId: string,
  farmData: { name: string; location: string; type: string },
  modules: Array<'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'>
) {
  const farm = await db.insertInto('farms').values(farmData).returningAll().executeTakeFirstOrThrow()
  
  await db.insertInto('user_farms').values({ userId, farmId: farm.id, role: 'owner' }).execute()
  
  await db.insertInto('farm_modules').values(
    modules.map(moduleKey => ({ farmId: farm.id, moduleKey, enabled: true }))
  ).execute()
  
  return farm
}
```

### Task 4: Create 5 realistic farms

- **FILE**: `app/lib/db/seed-dev.ts`
- **REPLACE**: Single farm creation with 5 farms
- **USE**: `createFarmWithModules` helper
- **LOCATIONS**: Kaduna, Ibadan, Jos, Kano, Enugu

### Task 5: Add demo batches for all livestock types

- **FILE**: `app/lib/db/seed-dev.ts`
- **ADD**: Batch creation for cattle, goats, sheep, bees
- **PATTERN**: Follow existing broiler/catfish patterns
- **DATA**: Realistic Nigerian livestock operations

### Task 6: Add structures for new livestock types

- **FILE**: `app/lib/db/seed-dev.ts`
- **ADD**: Structures for each farm
  - Poultry: Houses
  - Fish: Ponds
  - Cattle: Barns, Pastures
  - Goats/Sheep: Pens
  - Bees: Hives

### Task 7: Validate and test

- **RUN**: `bun run db:reset && bun run db:seed`
- **RUN**: `bun run db:reset && bun run db:seed:dev`
- **CHECK**: All farms created with correct modules
- **CHECK**: All livestock types have batches
- **CHECK**: New enum values used in demo data
- **VALIDATE**: `npx tsc --noEmit && bun run lint`

---

## ACCEPTANCE CRITERIA

- [ ] Database types updated with 28 new enum values
- [ ] DEFAULT_SETTINGS uses NGN currency
- [ ] Production seeder has NO market prices
- [ ] Production seeder has growth standards for all 6 livestock types
- [ ] Dev seeder creates 5 realistic farms
- [ ] Each farm has appropriate farm_modules records
- [ ] Demo batches exist for all 6 livestock types
- [ ] All farms have realistic Nigerian locations
- [ ] New enum values used in demo data (mobile_money, tarpaulin, etc.)
- [ ] TypeScript compiles without errors
- [ ] Both seeders run successfully

---

## SEEDING IMPACT ANALYSIS

### How New Enums Affect Seeding

**Structure Types**:
- ✅ Use `tarpaulin` for Nigerian fish farms (very common)
- ✅ Use `kraal` for traditional cattle/goat farms
- ✅ Use `tank` for modern fish operations
- ✅ Use `feedlot` for intensive cattle operations

**Mortality Causes**:
- ✅ Add realistic mortality records with varied causes
- ✅ Use `starvation` for feed shortage scenarios
- ✅ Use `suffocation` for overcrowding incidents
- ✅ Use `culling` for management decisions

**Sale Unit Types**:
- ✅ Use `head` for cattle/goat/sheep sales (industry standard)
- ✅ Use `liter` for milk and honey sales
- ✅ Use `colony` for bee colony sales
- ✅ Use `fleece` for wool sales

**Payment Methods**:
- ✅ Use `mobile_money` for most Nigerian transactions (MTN, Airtel)
- ✅ Use `cash` for small transactions
- ✅ Use `transfer` for large transactions
- ✅ Use `card` occasionally

**Sale Livestock Types**:
- ✅ Add honey, beeswax, propolis sales for bee farms
- ✅ Add milk sales for dairy cattle
- ✅ Add wool sales for sheep
- ✅ Add manure sales as byproduct

**Customer Types**:
- ✅ Add `processor` customers (slaughterhouses)
- ✅ Add `government` for institutional sales
- ✅ Keep `restaurant`, `retailer`, `wholesaler` mix

**Expense Categories**:
- ✅ Add `veterinary` expenses (consultation fees)
- ✅ Add `insurance` expenses for larger farms

**Medication Units**:
- ✅ Use `kg` and `liter` for bulk medication purchases

### Demo Data Distribution

**Farm 1 (Poultry)**: 
- Structures: `house`, `cage`
- Sales: `bird`, `kg`, `crate` (eggs)
- Payments: `mobile_money`, `cash`

**Farm 2 (Fish)**:
- Structures: `pond`, `tarpaulin`, `tank`
- Sales: `kg`
- Payments: `mobile_money`, `transfer`

**Farm 3 (Mixed)**:
- Structures: `house`, `pond`
- Sales: `bird`, `kg`, `crate`
- Payments: `mobile_money`, `cash`, `card`

**Farm 4 (Livestock)**:
- Structures: `kraal`, `barn`, `feedlot`, `pasture`
- Sales: `head`, `kg`
- Payments: `transfer`, `check`
- Customers: `processor`, `government`

**Farm 5 (Bees)**:
- Structures: `hive`
- Sales: `liter` (honey), `kg` (beeswax), `colony`
- Payments: `mobile_money`, `cash`

---

## VALIDATION COMMANDS

```bash
# Test production seeder
bun run db:reset
bun run db:seed

# Test dev seeder
bun run db:reset
bun run db:seed:dev

# Verify data
bun run db:query "SELECT name, type FROM farms"
bun run db:query "SELECT farmId, moduleKey FROM farm_modules"
bun run db:query "SELECT species, COUNT(*) FROM growth_standards GROUP BY species"
```

---

## NOTES

**Estimated Time**: 3-4 hours (increased due to enum updates)

**Nigerian Locations**:
- Kaduna (North-Central) - Poultry hub
- Ibadan (South-West) - Fish farming
- Jos (North-Central) - Mixed farming
- Kano (North-West) - Livestock
- Enugu (South-East) - Beekeeping

**Realistic Batch Sizes**:
- Broilers: 50-100 birds
- Layers: 100-200 birds
- Catfish: 500-1000 fingerlings
- Tilapia: 300-500 fingerlings
- Cattle: 5-10 animals
- Goats: 20-30 animals
- Sheep: 15-25 animals
- Bees: 1 colony = 1 batch
