# Dev Seeder Validation Checklist

## Pre-Run Checks
- [ ] DATABASE_URL is set in .env
- [ ] Database is accessible
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No ESLint errors: `bun run lint`

## Run Seeder
```bash
bun run db:seed:dev
```

## Expected Output
```
🌱 Seeding OpenLivestock Demo Data (5 Nigerian Farms)
📅 Reference date: 2026-01-14
🧹 Clearing existing data...
✅ Cleared

👤 Creating farm owner...
  ✅ Admin user created

⚙️  Creating user settings...
  ✅ User settings (NGN)

🏪 Creating suppliers...
  ✅ 5 suppliers

👥 Creating customers...
  ✅ 8 customers

🏡 Creating Farm 1: Sunrise Poultry Farm (Kaduna)...
  ✅ Farm 1: Sunrise Poultry (1 broiler batch)

🏡 Creating Farm 2: Blue Waters Fish Farm (Ibadan)...
  ✅ Farm 2: Blue Waters Fish (1 catfish batch)

🏡 Creating Farm 3: Green Valley Mixed Farm (Jos)...
  ✅ Farm 3: Green Valley Mixed (1 broiler, 1 catfish)

🏡 Creating Farm 4: Savanna Livestock Ranch (Kano)...
  ✅ Farm 4: Savanna Livestock (cattle, goats)

🏡 Creating Farm 5: Golden Hive Apiary (Enugu)...
  ✅ Farm 5: Golden Hive Apiary (1 bee colony)

📦 Adding inventory for all farms...
  ✅ Inventory added

🔔 Adding notifications for all farms...
  ✅ Notifications added

✅ Seeding complete!

📊 Summary:
  - 5 farms (Poultry, Fish, Mixed, Livestock, Bees)
  - 8 batches across all 6 livestock types
  - 8 customers (all types)
  - 5 suppliers (all types)
  - Complete interconnected records
  - New structures: tarpaulin ponds, kraal, hives
  - New sale units: head, liter, kg, colony
  - Nigerian payment methods (60% mobile_money)

🔐 Login: admin@openlivestock.local / password123
```

## Post-Run Verification

### Database Queries
```bash
# Check farms
bun run db:query "SELECT id, name, location, type FROM farms ORDER BY name"
# Expected: 5 farms

# Check farm modules
bun run db:query "SELECT f.name, fm.moduleKey FROM farm_modules fm JOIN farms f ON f.id = fm.farmId ORDER BY f.name, fm.moduleKey"
# Expected: 8 module records

# Check batches
bun run db:query "SELECT f.name, b.batchName, b.livestockType, b.species, b.currentQuantity FROM batches b JOIN farms f ON f.id = b.farmId ORDER BY f.name"
# Expected: 8 batches

# Check structures
bun run db:query "SELECT f.name, s.name, s.type FROM structures s JOIN farms f ON f.id = s.farmId ORDER BY f.name, s.name"
# Expected: 11 structures (including tarpaulin, kraal, hive)

# Check customers
bun run db:query "SELECT name, customerType FROM customers ORDER BY name"
# Expected: 8 customers (all 7 types)

# Check suppliers
bun run db:query "SELECT name, supplierType FROM suppliers ORDER BY name"
# Expected: 5 suppliers (all types)

# Check sales with new unit types
bun run db:query "SELECT f.name, s.livestockType, s.quantity, s.unitType, s.paymentMethod FROM sales s JOIN farms f ON f.id = s.farmId ORDER BY f.name"
# Expected: 8+ sales (head, liter, kg, bird units; mobile_money, cash, transfer)

# Check notifications
bun run db:query "SELECT f.name, n.type, n.title FROM notifications n JOIN farms f ON f.id = n.farmId ORDER BY f.name"
# Expected: 4 notifications

# Check inventory
bun run db:query "SELECT f.name, fi.feedType, fi.quantityKg, fi.minThresholdKg FROM feed_inventory fi JOIN farms f ON f.id = fi.farmId ORDER BY f.name, fi.feedType"
# Expected: 7 feed inventory records
```

### UI Verification
1. [ ] Login with admin@openlivestock.local / password123
2. [ ] Dashboard shows 5 farms
3. [ ] Farm selector shows all 5 farms
4. [ ] Navigate to each farm and verify:
   - [ ] Farm 1: Poultry module enabled, 1 broiler batch
   - [ ] Farm 2: Aquaculture module enabled, 1 catfish batch
   - [ ] Farm 3: Both modules enabled, 2 batches
   - [ ] Farm 4: Cattle/Goats/Sheep modules enabled, 2 batches
   - [ ] Farm 5: Bees module enabled, 1 bee colony
5. [ ] Check structures page - verify tarpaulin, kraal, hive types
6. [ ] Check sales page - verify head, liter, kg units
7. [ ] Check customers page - verify processor, government types
8. [ ] Check notifications - verify 4 notifications
9. [ ] Check inventory - verify low stock alerts

### New Enum Values Verification
- [ ] Structure types: tarpaulin (2), kraal (1), hive (2)
- [ ] Mortality causes: suffocation, injury
- [ ] Sale units: head, liter, kg, colony
- [ ] Payment methods: mobile_money (60%), cash (30%), transfer (10%)
- [ ] Customer types: processor, government
- [ ] Livestock types: All 6 (poultry, fish, cattle, goats, sheep, bees)

### Data Quality Checks
- [ ] All batches have currentQuantity <= initialQuantity
- [ ] All sales have valid customerId
- [ ] All batches have valid structureId
- [ ] All feed_records have valid supplierId
- [ ] All notifications have valid farmId
- [ ] All dates are realistic (not in future)
- [ ] All monetary values are positive
- [ ] All foreign keys resolve correctly

## Issues to Watch For
- [ ] Database connection timeout
- [ ] Duplicate key violations
- [ ] Foreign key constraint violations
- [ ] Invalid enum values
- [ ] Null constraint violations
- [ ] TypeScript type mismatches

## Success Criteria
✅ Seeder runs without errors
✅ All 5 farms created
✅ All 8 batches created
✅ All tables populated
✅ All new enum values used
✅ UI displays all data correctly
✅ No console errors
✅ Login works
✅ Navigation works

## Rollback (if needed)
```bash
# Restore old seeder
cp app/lib/db/seed-dev.backup.ts app/lib/db/seed-dev.ts

# Or reset database
bun run db:reset
bun run db:seed  # Run production seeder instead
```
