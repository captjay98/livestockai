# Constants & Enums Audit - Coverage & Granularity Analysis

## Overview
Analysis of all enum/constant types in the database schema to identify gaps and recommend additions for better coverage and granularity.

---

## 1. Structure Types ⚠️ NEEDS UPDATE

**Current** (9 types):
```typescript
'house' | 'pond' | 'pen' | 'cage' | 'barn' | 'pasture' | 'hive' | 'milking_parlor' | 'shearing_shed'
```

**Recommended** (14 types) - Add 5:
```typescript
'house'           // Poultry - deep litter
'cage'            // Poultry - battery cage
'pond'            // Fish - earthen, concrete
'tank'            // Fish - concrete, fiberglass ⭐ ADD
'tarpaulin'       // Fish - tarp ponds (popular in Nigeria) ⭐ ADD
'raceway'         // Fish - flow-through systems ⭐ ADD
'pen'             // Goats, sheep, cattle
'barn'            // General shelter
'feedlot'         // Cattle - intensive feeding ⭐ ADD
'pasture'         // Grazing
'kraal'           // Traditional African enclosure ⭐ ADD
'hive'            // Bees
'milking_parlor'  // Dairy cattle
'shearing_shed'   // Sheep wool
```

**Rationale**: Tarpaulin ponds very common in Nigerian fish farming. Kraal is traditional African structure. Tank/raceway for modern aquaculture.

---

## 2. Mortality Causes ⚠️ NEEDS UPDATE

**Current** (5 types):
```typescript
'disease' | 'predator' | 'weather' | 'unknown' | 'other'
```

**Recommended** (10 types) - Add 5:
```typescript
'disease'         // Existing
'predator'        // Existing
'weather'         // Existing - heat stress, cold, flooding
'starvation'      // Feed shortage ⭐ ADD
'injury'          // Fighting, handling ⭐ ADD
'poisoning'       // Contaminated feed/water ⭐ ADD
'suffocation'     // Overcrowding, poor ventilation ⭐ ADD
'culling'         // Intentional removal ⭐ ADD
'unknown'         // Existing
'other'           // Existing
```

**Rationale**: Better mortality tracking for analytics. Starvation/suffocation common in intensive farming. Culling is management decision, not mortality.

---

## 3. Feed Types ✅ GOOD COVERAGE

**Current** (11 types):
```typescript
'starter' | 'grower' | 'finisher' | 'layer_mash' | 'fish_feed' | 
'cattle_feed' | 'goat_feed' | 'sheep_feed' | 'hay' | 'silage' | 'bee_feed'
```

**Status**: ✅ Comprehensive coverage for all 6 livestock types

**Optional additions**:
- `'concentrate'` - High-protein supplement
- `'mineral_lick'` - Salt/mineral blocks
- `'fodder'` - Fresh cut grass

**Recommendation**: Keep as-is. Current types sufficient.

---

## 4. Sale Unit Types ⚠️ NEEDS UPDATE

**Current** (4 types):
```typescript
'bird' | 'kg' | 'crate' | 'piece'
```

**Recommended** (8 types) - Add 4:
```typescript
'bird'            // Poultry - per bird
'kg'              // Weight-based
'crate'           // Eggs - 30 eggs
'piece'           // Individual items
'liter'           // Milk, honey ⭐ ADD
'head'            // Cattle, goats, sheep (industry standard) ⭐ ADD
'colony'          // Bees - selling colonies ⭐ ADD
'fleece'          // Sheep - wool per animal ⭐ ADD
```

**Rationale**: 'head' is standard for cattle/goat/sheep sales. Liter for milk/honey. Colony for bee sales.

---

## 5. Sale Livestock Types ⚠️ NEEDS UPDATE

**Current** (7 types):
```typescript
'poultry' | 'fish' | 'eggs' | 'cattle' | 'goats' | 'sheep' | 'honey' | 'milk' | 'wool'
```

**Recommended** (11 types) - Add 4:
```typescript
'poultry'         // Existing
'fish'            // Existing
'eggs'            // Existing
'cattle'          // Existing
'goats'           // Existing
'sheep'           // Existing
'honey'           // Existing
'milk'            // Existing
'wool'            // Existing
'beeswax'         // Bee product ⭐ ADD
'propolis'        // Bee product ⭐ ADD
'royal_jelly'     // Bee product ⭐ ADD
'manure'          // Organic fertilizer ⭐ ADD
```

**Rationale**: Beekeeping has multiple products. Manure is valuable byproduct (organic farming).

---

## 6. Expense Categories ✅ GOOD COVERAGE

**Current** (15 types):
```typescript
'feed' | 'medicine' | 'equipment' | 'utilities' | 'labor' | 'transport' | 
'livestock' | 'livestock_chicken' | 'livestock_fish' | 'livestock_cattle' | 
'livestock_goats' | 'livestock_sheep' | 'livestock_bees' | 
'maintenance' | 'marketing' | 'other'
```

**Status**: ✅ Comprehensive coverage

**Optional additions**:
- `'insurance'` - Livestock insurance
- `'veterinary'` - Separate from medicine (consultation fees)
- `'rent'` - Land/facility rental

**Recommendation**: Add `'insurance'` and `'veterinary'` for better financial tracking.

---

## 7. Customer Types ⚠️ NEEDS UPDATE

**Current** (4 types):
```typescript
'individual' | 'restaurant' | 'retailer' | 'wholesaler'
```

**Recommended** (7 types) - Add 3:
```typescript
'individual'      // Existing - direct consumers
'restaurant'      // Existing - food service
'retailer'        // Existing - shops
'wholesaler'      // Existing - bulk buyers
'processor'       // Slaughterhouses, processing plants ⭐ ADD
'exporter'        // International buyers ⭐ ADD
'government'      // Government contracts ⭐ ADD
```

**Rationale**: Processors are major buyers. Government contracts common in Nigeria. Exporters for larger operations.

---

## 8. Supplier Types ✅ GOOD COVERAGE

**Current** (10 types):
```typescript
'hatchery' | 'feed_mill' | 'pharmacy' | 'equipment' | 'fingerlings' | 
'cattle_dealer' | 'goat_dealer' | 'sheep_dealer' | 'bee_supplier' | 'other'
```

**Status**: ✅ Comprehensive coverage for all livestock types

**Optional additions**:
- `'veterinary_clinic'` - Separate from pharmacy
- `'transport_service'` - Livestock haulers

**Recommendation**: Keep as-is. Current types sufficient.

---

## 9. Payment Methods ⚠️ NEEDS UPDATE

**Current** (3 types):
```typescript
'cash' | 'transfer' | 'credit'
```

**Recommended** (6 types) - Add 3:
```typescript
'cash'            // Existing
'transfer'        // Existing - bank transfer
'credit'          // Existing - payment terms
'mobile_money'    // MTN, Airtel Money (very common in Nigeria) ⭐ ADD
'check'           // Bank checks ⭐ ADD
'card'            // Debit/credit card ⭐ ADD
```

**Rationale**: Mobile money (MTN, Airtel) extremely popular in Nigeria. Check still used for large transactions.

---

## 10. Medication Units ✅ GOOD COVERAGE

**Current** (6 types):
```typescript
'vial' | 'bottle' | 'sachet' | 'ml' | 'g' | 'tablet'
```

**Status**: ✅ Comprehensive coverage

**Optional additions**:
- `'kg'` - Bulk medications
- `'liter'` - Large volume liquids

**Recommendation**: Add `'kg'` and `'liter'` for bulk purchases.

---

## 11. Batch Status ✅ GOOD COVERAGE

**Current** (3 types):
```typescript
'active' | 'depleted' | 'sold'
```

**Status**: ✅ Adequate coverage

**Optional additions**:
- `'quarantine'` - Disease isolation
- `'transferred'` - Moved to another farm

**Recommendation**: Keep as-is. Current types sufficient.

---

## 12. Structure Status ✅ GOOD COVERAGE

**Current** (3 types):
```typescript
'active' | 'empty' | 'maintenance'
```

**Status**: ✅ Adequate coverage

**Recommendation**: Keep as-is.

---

## Summary of Recommendations

### High Priority (Better Coverage)
1. **Structure Types**: Add 5 types (tank, tarpaulin, raceway, feedlot, kraal)
2. **Mortality Causes**: Add 5 types (starvation, injury, poisoning, suffocation, culling)
3. **Sale Unit Types**: Add 4 types (liter, head, colony, fleece)
4. **Payment Methods**: Add 3 types (mobile_money, check, card)

### Medium Priority (Better Granularity)
5. **Sale Livestock Types**: Add 4 types (beeswax, propolis, royal_jelly, manure)
6. **Customer Types**: Add 3 types (processor, exporter, government)
7. **Expense Categories**: Add 2 types (insurance, veterinary)
8. **Medication Units**: Add 2 types (kg, liter)

### Total Additions: 28 new enum values across 8 categories

---

## Implementation Impact

**Database Migration**: Required for all changes
**Seeder Updates**: Required to use new types
**UI Updates**: Dropdowns need new options
**Validation**: Update Zod schemas

**Estimated Time**: 1-2 hours for all changes
