# Seeding Strategy Discussion - Enum Expansion Impact

## Overview

We're adding 28 new enum values across 8 categories. This document discusses how these changes affect our seeding strategy and what realistic demo data should look like.

---

## Key Questions

### 1. Should we use ALL new enum values in demo data?

**Recommendation**: No - use selectively for realism

**Rationale**:

- Demo should show common scenarios, not every option
- Too much variety makes demo confusing
- Focus on Nigerian market patterns

**Example - Payment Methods**:

```typescript
// ✅ Use in demo (common in Nigeria)
'mobile_money' - 60% of transactions (MTN, Airtel)
'cash' - 30% of transactions
'transfer' - 10% of transactions

// ❌ Don't use in demo (less common)
'card' - rare in rural Nigeria
'check' - mostly large businesses
'credit' - not typical for farm sales
```

### 2. Which structure types should each farm use?

**Farm 1: Sunrise Poultry (Kaduna)**

- `house` (2-3 deep litter houses)
- `cage` (1 battery cage unit for layers)

**Farm 2: Blue Waters Fish (Ibadan)**

- `tarpaulin` (2-3 tarp ponds) ⭐ Nigerian favorite
- `pond` (1 concrete pond)
- `tank` (1 concrete tank for fingerlings)

**Farm 3: Green Valley Mixed (Jos)**

- `house` (1 poultry house)
- `pond` (1 earthen pond)
- `tarpaulin` (1 tarp pond)

**Farm 4: Savanna Livestock (Kano)**

- `kraal` (1 traditional enclosure) ⭐ Cultural relevance
- `barn` (1 shelter barn)
- `pasture` (2 grazing areas)
- `feedlot` (1 intensive feeding area)

**Farm 5: Golden Hive Apiary (Enugu)**

- `hive` (5-10 Langstroth hives)

### 3. What mortality causes should we seed?

**Realistic distribution**:

```typescript
// Common causes (use in demo)
'disease' - 50% (Newcastle, coccidiosis, etc.)
'predator' - 15% (snakes, rats, birds)
'weather' - 10% (heat stress, flooding)
'suffocation' - 10% (overcrowding, poor ventilation) ⭐
'injury' - 5% (fighting, handling) ⭐
'unknown' - 10%

// Less common (don't use in demo)
'starvation' - rare (only in crisis)
'poisoning' - rare (contamination)
'culling' - management decision, not mortality
```

### 4. What sale unit types for each livestock?

**Poultry**:

- `bird` - live bird sales
- `kg` - dressed weight
- `crate` - eggs (30 eggs per crate)

**Fish**:

- `kg` - standard for catfish/tilapia

**Cattle**:

- `head` - industry standard ⭐
- `kg` - live weight or carcass

**Goats/Sheep**:

- `head` - industry standard ⭐
- `kg` - live weight

**Bees**:

- `liter` - honey ⭐
- `kg` - beeswax ⭐
- `colony` - selling colonies ⭐

**Dairy/Wool**:

- `liter` - milk ⭐
- `fleece` - wool per sheep ⭐

### 5. What customer types should we seed?

**Farm 1 (Poultry)**:

- `individual` (40%) - direct consumers
- `restaurant` (30%) - food service
- `retailer` (20%) - shops
- `wholesaler` (10%) - bulk buyers

**Farm 2 (Fish)**:

- `restaurant` (50%) - major buyers
- `retailer` (30%)
- `wholesaler` (20%)

**Farm 4 (Livestock)**:

- `processor` (50%) - slaughterhouses ⭐
- `wholesaler` (30%)
- `government` (20%) - institutional contracts ⭐

**Farm 5 (Bees)**:

- `individual` (60%) - direct sales
- `retailer` (40%) - health shops

### 6. What expense categories should we add?

**All farms should have**:

- `feed` - primary expense
- `medicine` - health costs
- `labor` - workers
- `utilities` - water, electricity
- `transport` - logistics

**Add for larger farms**:

- `veterinary` - consultation fees ⭐
- `insurance` - livestock insurance ⭐
- `maintenance` - facility repairs

---

## Recommended Seeding Approach

### Production Seeder (Minimal)

**Use**: Only standard/common enum values

- Structure types: Keep existing 9
- Mortality causes: Keep existing 5
- Payment methods: Keep existing 3
- **Reason**: Production seeder is reference data only

### Dev Seeder (Comprehensive)

**Use**: All new enum values where realistic

- Structure types: Use all 14 (show variety)
- Mortality causes: Use 6-7 common ones
- Payment methods: Focus on `mobile_money` (60%), `cash` (30%), `transfer` (10%)
- Sale units: Use appropriate for each livestock type
- Customer types: Use all 7 (show variety)
- **Reason**: Demo should showcase system capabilities

---

## Nigerian Market Specifics

### Payment Methods Priority

1. **Mobile Money** (60%) - MTN Mobile Money, Airtel Money
2. **Cash** (30%) - Still dominant in rural areas
3. **Bank Transfer** (10%) - Larger transactions

### Structure Types Priority

1. **Tarpaulin ponds** - Most affordable for fish farming
2. **Kraal** - Traditional, culturally relevant
3. **Deep litter houses** - Standard for poultry
4. **Earthen ponds** - Common for catfish

### Customer Types Priority

1. **Individual** - Direct farm sales
2. **Restaurant** - Major buyers for fish/poultry
3. **Retailer** - Local shops
4. **Processor** - For cattle/goats

---

## Implementation Strategy

### Phase 1: Update Types (30 min)

- Update `app/lib/db/types.ts` with all 28 new enum values
- Validate TypeScript

### Phase 2: Update Production Seeder (30 min)

- Change DEFAULT_SETTINGS to NGN
- Remove market prices
- Add growth standards for cattle/goats/sheep/bees
- Keep enum usage minimal

### Phase 3: Update Dev Seeder (2-3 hours)

- Create 5 farms with modules
- Add structures using new types
- Create batches for all 6 livestock types
- Add transactions using new enum values
- Focus on Nigerian market patterns

### Phase 4: Validate (30 min)

- Test both seeders
- Verify data quality
- Check enum usage

**Total Time**: 3-4 hours

---

## Questions for Discussion

1. **Mobile Money**: Should we add `mobile_money` as the DEFAULT payment method in Nigerian demo?
2. **Tarpaulin**: Should this be the primary structure type for fish farms in demo?
3. **Kraal**: Should we use this for all traditional livestock farms?
4. **Enum Scope**: Should production seeder use new enums or keep minimal?

---

## Recommendation

**For Production Seeder**: Keep enum usage minimal (existing values only)
**For Dev Seeder**: Use new enums extensively to showcase Nigerian market reality

This approach:

- ✅ Keeps production seeder universal
- ✅ Makes dev seeder Nigerian-focused
- ✅ Shows system capabilities
- ✅ Reflects real market patterns
