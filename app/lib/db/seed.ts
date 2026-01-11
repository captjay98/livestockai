/**
 * Realistic Farm Seeder - JayFarms Kaduna
 *
 * Story: First-time farmer starting in Kaduna with small batches
 * - Broilers: 50-60 birds per batch, sold at 5 weeks (₦5,500) or 8 weeks (₦10,500)
 * - Catfish: 500-600 jumbo (10-12cm), grown 4-5 months, sold at ₦3,500/kg
 *
 * Feed Pricing:
 * - Chicken: Ultima Plus ₦24,000/25kg
 * - Fish 2mm: Aller Aqua ₦67,000/15kg (first month)
 * - Fish 3mm+: Blue Crown ₦38,000/15kg (month 2 onwards)
 *
 * Jumbo Catfish: 10-12cm size, ~15-25g starting weight
 */

import crypto from 'node:crypto'
import { db } from './index'

// ============ CONFIG ============
const FARM_LOCATION = 'Kaduna, Kaduna State'

// Broiler Config
const BROILER = {
  batchSize: { min: 50, max: 60 },
  chickCostNormal: 850,
  chickCostPremium: 1500,
  mortalityRate: { week1: 0.05, week2_4: 0.02, week5_8: 0.01 },
  salePrice5Weeks: 5500,
  salePrice8Weeks: 10500,
  feed: { name: 'Ultima Plus', costPer25kg: 24000 },
}

// Catfish Config - JUMBO size (10-12cm, ~15-25g)
const CATFISH = {
  batchSize: { min: 500, max: 600 },
  jumboCost: 200,
  jumboSizeCm: '10-12cm',
  jumboWeightG: 20,
  growthMonths: { min: 4, max: 5 },
  avgWeightAtHarvest: { min: 0.8, max: 1.5 },
  salePricePerKg: 3500,
  mortalityRate: { month1: 0.08, month2_3: 0.03, month4_5: 0.02 },
  feed: {
    starter: { name: 'Aller Aqua 2mm', costPer15kg: 67000 },
    grower: { name: 'Blue Crown 3mm+', costPer15kg: 38000 },
  },
}

// ============ HELPERS ============
const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) =>
  +(Math.random() * (max - min) + min).toFixed(2)
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  const combined = new Uint8Array(16 + 32)
  combined.set(salt)
  combined.set(new Uint8Array(hash), 16)
  return btoa(String.fromCharCode(...combined))
}

// ============ MAIN SEED ============
async function seed() {
  console.log('🌱 Seeding JayFarms Kaduna - Realistic Farm Data\n')

  try {
    // CLEANUP
    console.log('🧹 Clearing existing data...')
    const tables = [
      'invoice_items',
      'invoices',
      'water_quality',
      'weight_samples',
      'treatments',
      'vaccinations',
      'egg_records',
      'mortality_records',
      'feed_records',
      'feed_inventory',
      'medication_inventory',
      'expenses',
      'sales',
      'batches',
      'structures',
      'user_farms',
      'farms',
      'suppliers',
      'customers',
      'sessions',
      'account',
      'users',
    ]
    for (const t of tables) await db.deleteFrom(t as any).execute()
    console.log('✅ Cleared\n')

    // USER
    console.log('👤 Creating farm owner...')
    // Create Default Admin
    const adminUser = await db
      .insertInto('users')
      .values({
        id: 'user_admin',
        name: 'Farm Administrator',
        email: 'admin@openlivestock.local',
        password_hash:
          '$2a$10$wKz0o./nFk.o.i.i.i.i.u.u.u.u.u.u.u.u.u.u.u.u.u.u', // 'password' (placeholder hash)
        role: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .returningAll()
      .executeTakeFirstOrThrow()

    console.log('  ✅ Admin user created/verified')

    // FARM
    console.log('🏡 Creating farm...')
    const farm = await db
      .insertInto('farms')
      .values({
        id: 'farm_001',
        name: 'Demo Farm A (Poultry)',
        location: 'Demo Location',
        type: 'poultry',
        size_sqm: 1000,
        capacity: 5000,
        status: 'active',
        ownerId: adminUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .returningAll()
      .executeTakeFirstOrThrow()

    const farm2 = await db
      .insertInto('farms')
      .values({
        id: 'farm_002',
        name: 'Demo Farm B (Aquaculture)',
        location: 'Demo Location',
        type: 'aquaculture',
        size_sqm: 2000,
        capacity: 10000,
        status: 'active',
        ownerId: adminUser.id,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict((oc) => oc.column('id').doNothing())
      .returningAll()
      .executeTakeFirstOrThrow()
    await db
      .insertInto('user_farms')
      .values({ userId: adminUser.id, farmId: farm.id })
      .execute()
    console.log(`✅ ${farm.name}\n`)

    // STRUCTURES (Houses and Ponds)
    console.log('🏠 Creating structures...')
    const structures = await db
      .insertInto('structures')
      .values([
        {
          farmId: farm.id,
          name: 'Broiler House A',
          type: 'house',
          capacity: 100,
          areaSqm: '50.00',
          status: 'active',
          notes: 'Main broiler house',
        },
        {
          farmId: farm.id,
          name: 'Broiler House B',
          type: 'house',
          capacity: 80,
          areaSqm: '40.00',
          status: 'active',
          notes: 'Secondary broiler house',
        },
        {
          farmId: farm.id,
          name: 'Pond 1',
          type: 'pond',
          capacity: 800,
          areaSqm: '100.00',
          status: 'active',
          notes: 'Main catfish pond',
        },
        {
          farmId: farm.id,
          name: 'Pond 2',
          type: 'pond',
          capacity: 600,
          areaSqm: '80.00',
          status: 'active',
          notes: 'Secondary catfish pond',
        },
      ])
      .returning(['id', 'name', 'type'])
      .execute()
    const houseA = structures.find((s) => s.name === 'Broiler House A')!
    const houseB = structures.find((s) => s.name === 'Broiler House B')!
    const pond1 = structures.find((s) => s.name === 'Pond 1')!
    const pond2 = structures.find((s) => s.name === 'Pond 2')!
    console.log(`✅ ${structures.length} structures (2 houses, 2 ponds)\n`)

    // SUPPLIERS (with supplierType)
    console.log('🏭 Creating suppliers...')
    const suppliers = await db
      .insertInto('suppliers')
      .values([
        {
          name: 'Kaduna Hatchery',
          phone: '08031234567',
          location: 'Kaduna',
          products: ['day-old chicks'],
          supplierType: 'hatchery',
        },
        {
          name: 'Ultima Feeds Kaduna',
          phone: '08032345678',
          location: 'Kaduna',
          products: ['poultry feed'],
          supplierType: 'feed_mill',
        },
        {
          name: 'AquaLife Fisheries',
          phone: '08033456789',
          location: 'Kaduna',
          products: ['jumbo catfish', 'fish feed'],
          supplierType: 'fingerlings',
        },
        {
          name: 'VetCare Kaduna',
          phone: '08034567890',
          location: 'Kaduna',
          products: ['vaccines', 'medicine'],
          supplierType: 'pharmacy',
        },
      ])
      .returning(['id', 'name', 'products'])
      .execute()
    const hatchery = suppliers.find((s) =>
      s.products.includes('day-old chicks'),
    )!
    const feedSupplier = suppliers.find((s) =>
      s.products.includes('poultry feed'),
    )!
    const fishSupplier = suppliers.find((s) =>
      s.products.includes('jumbo catfish'),
    )!
    const vetSupplier = suppliers.find((s) => s.products.includes('vaccines'))!
    console.log(`✅ ${suppliers.length} suppliers\n`)

    // CUSTOMERS (with customerType)
    console.log('👥 Creating customers...')
    const customers = await db
      .insertInto('customers')
      .values([
        {
          name: 'Alhaji Garba - Kasuwan Rimi',
          phone: '08041234567',
          location: 'Kasuwan Rimi Market, Kaduna',
          customerType: 'wholesaler',
        },
        {
          name: 'Mama Joy Restaurant',
          phone: '08042345678',
          location: 'Barnawa, Kaduna',
          email: 'mamajoy@gmail.com',
          customerType: 'restaurant',
        },
        {
          name: 'Fresh Fish Corner',
          phone: '08043456789',
          location: 'Kakuri Market, Kaduna',
          customerType: 'retailer',
        },
        {
          name: 'Kaduna Frozen Foods',
          phone: '08044567890',
          location: 'Tudun Wada, Kaduna',
          customerType: 'wholesaler',
        },
      ])
      .returning(['id', 'name'])
      .execute()
    console.log(`✅ ${customers.length} customers\n`)

    // ============ BROILER BATCHES ============
    console.log('🐔 Creating broiler batches with full lifecycle...')

    // Batch 1: SOLD - Started June 2024, sold at 5 weeks (early July) - Normal price
    const batch1Start = new Date('2024-06-10')
    const batch1Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch1ChickCost = BROILER.chickCostNormal
    const batch1TargetHarvest = addDays(batch1Start, 35) // 5 weeks

    const broilerBatch1 = await db
      .insertInto('batches')
      .values({
        farmId: farm.id,
        batchName: 'JUN-2024-BR-01',
        livestockType: 'poultry',
        species: 'Broiler',
        sourceSize: 'day-old',
        initialQuantity: batch1Size,
        currentQuantity: 0,
        acquisitionDate: batch1Start,
        costPerUnit: batch1ChickCost.toFixed(2),
        totalCost: (batch1Size * batch1ChickCost).toFixed(2),
        status: 'sold',
        supplierId: hatchery.id,
        structureId: houseA.id,
        targetHarvestDate: batch1TargetHarvest,
        notes: 'First broiler batch - sold at 5 weeks',
      })
      .returning(['id', 'initialQuantity', 'acquisitionDate'])
      .executeTakeFirstOrThrow()

    // Batch 1 mortality
    let b1Alive = batch1Size
    const b1Mortality: Array<any> = []
    const b1Week1Deaths = Math.floor(batch1Size * BROILER.mortalityRate.week1)
    for (let i = 0; i < b1Week1Deaths; i++) {
      b1Mortality.push({
        batchId: broilerBatch1.id,
        quantity: 1,
        date: addDays(batch1Start, randomInt(1, 7)),
        cause: i < 2 ? 'disease' : 'unknown',
        notes: 'Early chick mortality',
      })
      b1Alive--
    }
    const b1Week2_4Deaths = Math.floor(
      batch1Size * BROILER.mortalityRate.week2_4,
    )
    for (let i = 0; i < b1Week2_4Deaths; i++) {
      b1Mortality.push({
        batchId: broilerBatch1.id,
        quantity: 1,
        date: addDays(batch1Start, randomInt(8, 28)),
        cause: 'unknown',
        notes: null,
      })
      b1Alive--
    }
    if (b1Mortality.length > 0)
      await db.insertInto('mortality_records').values(b1Mortality).execute()

    // Batch 1 feed records (with brandName, bagSizeKg, numberOfBags)
    await db
      .insertInto('feed_records')
      .values([
        {
          batchId: broilerBatch1.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: BROILER.feed.costPer25kg.toFixed(2),
          date: addDays(batch1Start, 0),
          supplierId: feedSupplier.id,
          notes: 'Initial starter feed',
        },
        {
          batchId: broilerBatch1.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: BROILER.feed.costPer25kg.toFixed(2),
          date: addDays(batch1Start, 10),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch1.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: (BROILER.feed.costPer25kg * 2).toFixed(2),
          date: addDays(batch1Start, 18),
          supplierId: feedSupplier.id,
          notes: 'Switched to finisher',
        },
        {
          batchId: broilerBatch1.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: (BROILER.feed.costPer25kg * 2).toFixed(2),
          date: addDays(batch1Start, 28),
          supplierId: feedSupplier.id,
          notes: null,
        },
      ])
      .execute()

    // Batch 1 vaccinations
    await db
      .insertInto('vaccinations')
      .values([
        {
          batchId: broilerBatch1.id,
          vaccineName: 'Newcastle (Lasota)',
          dateAdministered: addDays(batch1Start, 7),
          dosage: '1 drop/bird',
          notes: 'Day 7 vaccination',
        },
        {
          batchId: broilerBatch1.id,
          vaccineName: 'Gumboro',
          dateAdministered: addDays(batch1Start, 14),
          dosage: '1 drop/bird',
          notes: 'Day 14 vaccination',
        },
        {
          batchId: broilerBatch1.id,
          vaccineName: 'Newcastle Booster',
          dateAdministered: addDays(batch1Start, 21),
          dosage: '1 drop/bird',
          notes: 'Day 21 booster',
        },
      ])
      .execute()

    // Batch 1 weight samples (with min/max)
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: broilerBatch1.id,
          date: addDays(batch1Start, 7),
          sampleSize: 10,
          averageWeightKg: '0.180',
          minWeightKg: '0.150',
          maxWeightKg: '0.210',
          notes: 'Week 1',
        },
        {
          batchId: broilerBatch1.id,
          date: addDays(batch1Start, 14),
          sampleSize: 10,
          averageWeightKg: '0.450',
          minWeightKg: '0.380',
          maxWeightKg: '0.520',
          notes: 'Week 2',
        },
        {
          batchId: broilerBatch1.id,
          date: addDays(batch1Start, 21),
          sampleSize: 10,
          averageWeightKg: '0.850',
          minWeightKg: '0.720',
          maxWeightKg: '0.980',
          notes: 'Week 3',
        },
        {
          batchId: broilerBatch1.id,
          date: addDays(batch1Start, 28),
          sampleSize: 10,
          averageWeightKg: '1.350',
          minWeightKg: '1.150',
          maxWeightKg: '1.550',
          notes: 'Week 4',
        },
        {
          batchId: broilerBatch1.id,
          date: addDays(batch1Start, 35),
          sampleSize: 10,
          averageWeightKg: '1.800',
          minWeightKg: '1.550',
          maxWeightKg: '2.050',
          notes: 'Week 5 - Sale weight',
        },
      ])
      .execute()

    // Batch 1 SALE (with new fields)
    const b1SaleDate = addDays(batch1Start, 35)
    const b1Sale = await db
      .insertInto('sales')
      .values({
        farmId: farm.id,
        batchId: broilerBatch1.id,
        customerId: customers[0].id,
        livestockType: 'poultry',
        quantity: b1Alive,
        unitPrice: BROILER.salePrice5Weeks.toFixed(2),
        totalAmount: (b1Alive * BROILER.salePrice5Weeks).toFixed(2),
        unitType: 'bird',
        ageWeeks: 5,
        averageWeightKg: '1.800',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        date: b1SaleDate,
        notes: 'Sold at 5 weeks - good weight',
      })
      .returning(['id', 'totalAmount'])
      .executeTakeFirstOrThrow()
    console.log(
      `   Batch 1: ${batch1Size} chicks @ ₦${batch1ChickCost} → ${b1Alive} sold at 5 weeks @ ₦${BROILER.salePrice5Weeks}`,
    )

    // Batch 2: SOLD - Started August 2024, sold at 8 weeks - Normal price
    const batch2Start = new Date('2024-08-05')
    const batch2Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch2ChickCost = BROILER.chickCostNormal
    const batch2TargetHarvest = addDays(batch2Start, 56) // 8 weeks

    const broilerBatch2 = await db
      .insertInto('batches')
      .values({
        farmId: farm.id,
        batchName: 'AUG-2024-BR-01',
        livestockType: 'poultry',
        species: 'Broiler',
        sourceSize: 'day-old',
        initialQuantity: batch2Size,
        currentQuantity: 0,
        acquisitionDate: batch2Start,
        costPerUnit: batch2ChickCost.toFixed(2),
        totalCost: (batch2Size * batch2ChickCost).toFixed(2),
        status: 'sold',
        supplierId: hatchery.id,
        structureId: houseA.id,
        targetHarvestDate: batch2TargetHarvest,
        notes: 'Second batch - grown to 8 weeks for premium price',
      })
      .returning(['id', 'initialQuantity'])
      .executeTakeFirstOrThrow()

    // Batch 2 mortality
    let b2Alive = batch2Size
    const b2Mortality: Array<any> = []
    const b2Week1Deaths = Math.floor(batch2Size * 0.04)
    for (let i = 0; i < b2Week1Deaths; i++) {
      b2Mortality.push({
        batchId: broilerBatch2.id,
        quantity: 1,
        date: addDays(batch2Start, randomInt(1, 7)),
        cause: 'unknown',
        notes: null,
      })
      b2Alive--
    }
    const b2LaterDeaths = Math.floor(batch2Size * 0.02)
    for (let i = 0; i < b2LaterDeaths; i++) {
      b2Mortality.push({
        batchId: broilerBatch2.id,
        quantity: 1,
        date: addDays(batch2Start, randomInt(14, 50)),
        cause: 'unknown',
        notes: null,
      })
      b2Alive--
    }
    if (b2Mortality.length > 0)
      await db.insertInto('mortality_records').values(b2Mortality).execute()

    // Batch 2 feed (with brandName, bagSizeKg, numberOfBags)
    await db
      .insertInto('feed_records')
      .values([
        {
          batchId: broilerBatch2.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: '24000.00',
          date: addDays(batch2Start, 0),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: '24000.00',
          date: addDays(batch2Start, 12),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: '48000.00',
          date: addDays(batch2Start, 21),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: '48000.00',
          date: addDays(batch2Start, 35),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: '48000.00',
          date: addDays(batch2Start, 49),
          supplierId: feedSupplier.id,
          notes: null,
        },
      ])
      .execute()

    // Batch 2 vaccinations
    await db
      .insertInto('vaccinations')
      .values([
        {
          batchId: broilerBatch2.id,
          vaccineName: 'Newcastle (Lasota)',
          dateAdministered: addDays(batch2Start, 7),
          dosage: '1 drop/bird',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          vaccineName: 'Gumboro',
          dateAdministered: addDays(batch2Start, 14),
          dosage: '1 drop/bird',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          vaccineName: 'Newcastle Booster',
          dateAdministered: addDays(batch2Start, 21),
          dosage: '1 drop/bird',
          notes: null,
        },
      ])
      .execute()

    // Batch 2 weight samples
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 7),
          sampleSize: 10,
          averageWeightKg: '0.200',
          minWeightKg: '0.170',
          maxWeightKg: '0.230',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 14),
          sampleSize: 10,
          averageWeightKg: '0.480',
          minWeightKg: '0.400',
          maxWeightKg: '0.560',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 21),
          sampleSize: 10,
          averageWeightKg: '0.900',
          minWeightKg: '0.780',
          maxWeightKg: '1.020',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 28),
          sampleSize: 10,
          averageWeightKg: '1.400',
          minWeightKg: '1.200',
          maxWeightKg: '1.600',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 42),
          sampleSize: 10,
          averageWeightKg: '2.200',
          minWeightKg: '1.900',
          maxWeightKg: '2.500',
          notes: null,
        },
        {
          batchId: broilerBatch2.id,
          date: addDays(batch2Start, 56),
          sampleSize: 10,
          averageWeightKg: '3.000',
          minWeightKg: '2.600',
          maxWeightKg: '3.400',
          notes: 'Week 8 - Sale weight',
        },
      ])
      .execute()

    // Batch 2 SALE
    const b2SaleDate = addDays(batch2Start, 56)
    const b2Sale = await db
      .insertInto('sales')
      .values({
        farmId: farm.id,
        batchId: broilerBatch2.id,
        customerId: customers[1].id,
        livestockType: 'poultry',
        quantity: b2Alive,
        unitPrice: BROILER.salePrice8Weeks.toFixed(2),
        totalAmount: (b2Alive * BROILER.salePrice8Weeks).toFixed(2),
        unitType: 'bird',
        ageWeeks: 8,
        averageWeightKg: '3.000',
        paymentStatus: 'paid',
        paymentMethod: 'transfer',
        date: b2SaleDate,
        notes: 'Sold at 8 weeks - premium size',
      })
      .returning(['id', 'totalAmount'])
      .executeTakeFirstOrThrow()
    console.log(
      `   Batch 2: ${batch2Size} chicks @ ₦${batch2ChickCost} → ${b2Alive} sold at 8 weeks @ ₦${BROILER.salePrice8Weeks}`,
    )

    // Batch 3: ACTIVE - Started late November 2024 - PREMIUM price (scarce month)
    const batch3Start = new Date('2024-11-25')
    const batch3Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch3ChickCost = BROILER.chickCostPremium // Premium month!
    const batch3TargetHarvest = addDays(batch3Start, 56) // Planning for 8 weeks

    let b3Alive = batch3Size
    const b3Deaths = Math.floor(batch3Size * 0.05)
    b3Alive -= b3Deaths

    const broilerBatch3 = await db
      .insertInto('batches')
      .values({
        farmId: farm.id,
        batchName: 'NOV-2024-BR-01',
        livestockType: 'poultry',
        species: 'Broiler',
        sourceSize: 'day-old',
        initialQuantity: batch3Size,
        currentQuantity: b3Alive,
        acquisitionDate: batch3Start,
        costPerUnit: batch3ChickCost.toFixed(2),
        totalCost: (batch3Size * batch3ChickCost).toFixed(2),
        status: 'active',
        supplierId: hatchery.id,
        structureId: houseB.id,
        targetHarvestDate: batch3TargetHarvest,
        notes: 'Premium price month - December/Christmas demand',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()

    // Batch 3 mortality
    const b3Mortality: Array<any> = []
    for (let i = 0; i < b3Deaths; i++) {
      b3Mortality.push({
        batchId: broilerBatch3.id,
        quantity: 1,
        date: addDays(batch3Start, randomInt(1, 14)),
        cause: i < 2 ? 'disease' : 'unknown',
        notes: null,
      })
    }
    if (b3Mortality.length > 0)
      await db.insertInto('mortality_records').values(b3Mortality).execute()

    // Batch 3 feed
    await db
      .insertInto('feed_records')
      .values([
        {
          batchId: broilerBatch3.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: '24000.00',
          date: addDays(batch3Start, 0),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          feedType: 'starter',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 1,
          quantityKg: '25.00',
          cost: '24000.00',
          date: addDays(batch3Start, 10),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: '48000.00',
          date: addDays(batch3Start, 21),
          supplierId: feedSupplier.id,
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          feedType: 'finisher',
          brandName: 'Ultima Plus',
          bagSizeKg: 25,
          numberOfBags: 2,
          quantityKg: '50.00',
          cost: '48000.00',
          date: addDays(batch3Start, 35),
          supplierId: feedSupplier.id,
          notes: null,
        },
      ])
      .execute()

    // Batch 3 vaccinations
    await db
      .insertInto('vaccinations')
      .values([
        {
          batchId: broilerBatch3.id,
          vaccineName: 'Newcastle (Lasota)',
          dateAdministered: addDays(batch3Start, 7),
          dosage: '1 drop/bird',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          vaccineName: 'Gumboro',
          dateAdministered: addDays(batch3Start, 14),
          dosage: '1 drop/bird',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          vaccineName: 'Newcastle Booster',
          dateAdministered: addDays(batch3Start, 21),
          dosage: '1 drop/bird',
          notes: null,
        },
      ])
      .execute()

    // Batch 3 weight samples
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: broilerBatch3.id,
          date: addDays(batch3Start, 7),
          sampleSize: 10,
          averageWeightKg: '0.190',
          minWeightKg: '0.160',
          maxWeightKg: '0.220',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          date: addDays(batch3Start, 14),
          sampleSize: 10,
          averageWeightKg: '0.460',
          minWeightKg: '0.380',
          maxWeightKg: '0.540',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          date: addDays(batch3Start, 21),
          sampleSize: 10,
          averageWeightKg: '0.880',
          minWeightKg: '0.750',
          maxWeightKg: '1.010',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          date: addDays(batch3Start, 28),
          sampleSize: 10,
          averageWeightKg: '1.380',
          minWeightKg: '1.180',
          maxWeightKg: '1.580',
          notes: null,
        },
        {
          batchId: broilerBatch3.id,
          date: addDays(batch3Start, 42),
          sampleSize: 10,
          averageWeightKg: '2.100',
          minWeightKg: '1.800',
          maxWeightKg: '2.400',
          notes: 'Week 6 - Growing well',
        },
      ])
      .execute()
    console.log(
      `   Batch 3: ${batch3Size} chicks @ ₦${batch3ChickCost} (premium) → ${b3Alive} alive (6 weeks)\n`,
    )

    // ============ CATFISH BATCHES ============
    console.log('🐟 Creating catfish batches (JUMBO 10-12cm)...')

    // Fish Batch 1: SOLD - Started June 2024, harvested October (4.5 months)
    const fishBatch1Start = new Date('2024-06-15')
    const fishBatch1Size = randomInt(
      CATFISH.batchSize.min,
      CATFISH.batchSize.max,
    )
    const fishBatch1TargetHarvest = addDays(fishBatch1Start, 135) // ~4.5 months

    const catfishBatch1 = await db
      .insertInto('batches')
      .values({
        farmId: farm.id,
        batchName: 'JUN-2024-CF-01',
        livestockType: 'fish',
        species: 'Catfish',
        sourceSize: 'jumbo (10-12cm)',
        initialQuantity: fishBatch1Size,
        currentQuantity: 0,
        acquisitionDate: fishBatch1Start,
        costPerUnit: CATFISH.jumboCost.toFixed(2),
        totalCost: (fishBatch1Size * CATFISH.jumboCost).toFixed(2),
        status: 'sold',
        supplierId: fishSupplier.id,
        structureId: pond1.id,
        targetHarvestDate: fishBatch1TargetHarvest,
        notes: 'First catfish batch - jumbo size for faster growth',
      })
      .returning(['id', 'initialQuantity'])
      .executeTakeFirstOrThrow()

    // Fish Batch 1 mortality
    let f1Alive = fishBatch1Size
    const f1Mortality: Array<any> = []
    const f1Month1Deaths = Math.floor(
      fishBatch1Size * CATFISH.mortalityRate.month1,
    )
    for (let i = 0; i < f1Month1Deaths; i++) {
      f1Mortality.push({
        batchId: catfishBatch1.id,
        quantity: 1,
        date: addDays(fishBatch1Start, randomInt(1, 30)),
        cause: i < 5 ? 'disease' : 'other',
        notes: 'Adjustment period',
      })
      f1Alive--
    }
    const f1Month2_3Deaths = Math.floor(
      fishBatch1Size * CATFISH.mortalityRate.month2_3,
    )
    for (let i = 0; i < f1Month2_3Deaths; i++) {
      f1Mortality.push({
        batchId: catfishBatch1.id,
        quantity: 1,
        date: addDays(fishBatch1Start, randomInt(31, 90)),
        cause: 'unknown',
        notes: null,
      })
      f1Alive--
    }
    const f1Month4_5Deaths = Math.floor(
      fishBatch1Size * CATFISH.mortalityRate.month4_5,
    )
    for (let i = 0; i < f1Month4_5Deaths; i++) {
      f1Mortality.push({
        batchId: catfishBatch1.id,
        quantity: 1,
        date: addDays(fishBatch1Start, randomInt(91, 135)),
        cause: 'unknown',
        notes: null,
      })
      f1Alive--
    }
    if (f1Mortality.length > 0)
      await db.insertInto('mortality_records').values(f1Mortality).execute()

    // Fish Batch 1 feed - Aller Aqua 2mm first month, then Blue Crown 3mm+
    await db
      .insertInto('feed_records')
      .values([
        // Month 1: Aller Aqua 2mm @ ₦67,000/15kg
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Aller Aqua 2mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '67000.00',
          date: addDays(fishBatch1Start, 0),
          supplierId: fishSupplier.id,
          notes: 'Starter feed - 2mm pellets',
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Aller Aqua 2mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '67000.00',
          date: addDays(fishBatch1Start, 15),
          supplierId: fishSupplier.id,
          notes: null,
        },
        // Month 2+: Blue Crown 3mm+ @ ₦38,000/15kg
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 3mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '38000.00',
          date: addDays(fishBatch1Start, 35),
          supplierId: fishSupplier.id,
          notes: 'Switched to grower feed',
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 3mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '38000.00',
          date: addDays(fishBatch1Start, 50),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 4mm',
          bagSizeKg: 15,
          numberOfBags: 2,
          quantityKg: '30.00',
          cost: '76000.00',
          date: addDays(fishBatch1Start, 70),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 4mm',
          bagSizeKg: 15,
          numberOfBags: 2,
          quantityKg: '30.00',
          cost: '76000.00',
          date: addDays(fishBatch1Start, 90),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 6mm',
          bagSizeKg: 15,
          numberOfBags: 3,
          quantityKg: '45.00',
          cost: '114000.00',
          date: addDays(fishBatch1Start, 110),
          supplierId: fishSupplier.id,
          notes: 'Finisher feed',
        },
        {
          batchId: catfishBatch1.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 6mm',
          bagSizeKg: 15,
          numberOfBags: 3,
          quantityKg: '45.00',
          cost: '114000.00',
          date: addDays(fishBatch1Start, 125),
          supplierId: fishSupplier.id,
          notes: null,
        },
      ])
      .execute()

    // Fish Batch 1 water quality
    const f1WaterQuality: Array<any> = []
    for (let week = 1; week <= 19; week++) {
      f1WaterQuality.push({
        batchId: catfishBatch1.id,
        date: addDays(fishBatch1Start, week * 7),
        ph: randomFloat(6.8, 7.8).toFixed(2),
        temperatureCelsius: randomFloat(26, 30).toFixed(2),
        dissolvedOxygenMgL: randomFloat(5.5, 8.0).toFixed(2),
        ammoniaMgL: randomFloat(0.01, 0.3).toFixed(3),
        notes: week % 4 === 0 ? 'Water change done' : null,
      })
    }
    await db.insertInto('water_quality').values(f1WaterQuality).execute()

    // Fish Batch 1 weight samples (starting from ~20g jumbo)
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 0),
          sampleSize: 20,
          averageWeightKg: '0.020',
          minWeightKg: '0.015',
          maxWeightKg: '0.025',
          notes: 'Jumbo starting weight',
        },
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 30),
          sampleSize: 20,
          averageWeightKg: '0.080',
          minWeightKg: '0.060',
          maxWeightKg: '0.100',
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 60),
          sampleSize: 20,
          averageWeightKg: '0.200',
          minWeightKg: '0.150',
          maxWeightKg: '0.250',
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 90),
          sampleSize: 20,
          averageWeightKg: '0.450',
          minWeightKg: '0.350',
          maxWeightKg: '0.550',
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 120),
          sampleSize: 20,
          averageWeightKg: '0.800',
          minWeightKg: '0.650',
          maxWeightKg: '0.950',
          notes: null,
        },
        {
          batchId: catfishBatch1.id,
          date: addDays(fishBatch1Start, 135),
          sampleSize: 20,
          averageWeightKg: '1.100',
          minWeightKg: '0.900',
          maxWeightKg: '1.300',
          notes: 'Harvest weight',
        },
      ])
      .execute()

    // Fish Batch 1 SALE (sold by kg)
    const f1AvgWeight = randomFloat(0.9, 1.2)
    const f1TotalKg = Math.round(f1Alive * f1AvgWeight)
    const f1SaleDate = addDays(fishBatch1Start, 135)
    const f1Sale = await db
      .insertInto('sales')
      .values({
        farmId: farm.id,
        batchId: catfishBatch1.id,
        customerId: customers[2].id,
        livestockType: 'fish',
        quantity: f1TotalKg,
        unitPrice: CATFISH.salePricePerKg.toFixed(2),
        totalAmount: (f1TotalKg * CATFISH.salePricePerKg).toFixed(2),
        unitType: 'kg',
        ageWeeks: 19,
        averageWeightKg: f1AvgWeight.toFixed(3),
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        date: f1SaleDate,
        notes: `${f1Alive} fish @ avg ${f1AvgWeight.toFixed(2)}kg = ${f1TotalKg}kg total`,
      })
      .returning(['id', 'totalAmount'])
      .executeTakeFirstOrThrow()
    console.log(
      `   Batch 1: ${fishBatch1Size} jumbo @ ₦${CATFISH.jumboCost} → ${f1Alive} harvested (${f1TotalKg}kg @ ₦${CATFISH.salePricePerKg}/kg)`,
    )

    // Fish Batch 2: ACTIVE - Started September 2024, currently 4 months old
    const fishBatch2Start = new Date('2024-09-01')
    const fishBatch2Size = randomInt(
      CATFISH.batchSize.min,
      CATFISH.batchSize.max,
    )
    const fishBatch2TargetHarvest = addDays(fishBatch2Start, 150) // ~5 months

    let f2Alive = fishBatch2Size
    const f2TotalDeaths = Math.floor(fishBatch2Size * 0.1)
    f2Alive -= f2TotalDeaths

    const catfishBatch2 = await db
      .insertInto('batches')
      .values({
        farmId: farm.id,
        batchName: 'SEP-2024-CF-01',
        livestockType: 'fish',
        species: 'Catfish',
        sourceSize: 'jumbo (10-12cm)',
        initialQuantity: fishBatch2Size,
        currentQuantity: f2Alive,
        acquisitionDate: fishBatch2Start,
        costPerUnit: CATFISH.jumboCost.toFixed(2),
        totalCost: (fishBatch2Size * CATFISH.jumboCost).toFixed(2),
        status: 'active',
        supplierId: fishSupplier.id,
        structureId: pond2.id,
        targetHarvestDate: fishBatch2TargetHarvest,
        notes: 'Second catfish batch - targeting January harvest',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()

    // Fish Batch 2 mortality
    const f2Mortality: Array<any> = []
    for (let i = 0; i < f2TotalDeaths; i++) {
      const day =
        i < Math.floor(f2TotalDeaths * 0.6)
          ? randomInt(1, 30)
          : randomInt(31, 120)
      f2Mortality.push({
        batchId: catfishBatch2.id,
        quantity: 1,
        date: addDays(fishBatch2Start, day),
        cause: 'unknown',
        notes: null,
      })
    }
    if (f2Mortality.length > 0)
      await db.insertInto('mortality_records').values(f2Mortality).execute()

    // Fish Batch 2 feed - Aller Aqua first month, then Blue Crown
    await db
      .insertInto('feed_records')
      .values([
        // Month 1: Aller Aqua 2mm @ ₦67,000/15kg
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Aller Aqua 2mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '67000.00',
          date: addDays(fishBatch2Start, 0),
          supplierId: fishSupplier.id,
          notes: 'Starter feed',
        },
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Aller Aqua 2mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '67000.00',
          date: addDays(fishBatch2Start, 15),
          supplierId: fishSupplier.id,
          notes: null,
        },
        // Month 2+: Blue Crown 3mm+ @ ₦38,000/15kg
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 3mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '38000.00',
          date: addDays(fishBatch2Start, 35),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 3mm',
          bagSizeKg: 15,
          numberOfBags: 1,
          quantityKg: '15.00',
          cost: '38000.00',
          date: addDays(fishBatch2Start, 50),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 4mm',
          bagSizeKg: 15,
          numberOfBags: 2,
          quantityKg: '30.00',
          cost: '76000.00',
          date: addDays(fishBatch2Start, 70),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 4mm',
          bagSizeKg: 15,
          numberOfBags: 2,
          quantityKg: '30.00',
          cost: '76000.00',
          date: addDays(fishBatch2Start, 90),
          supplierId: fishSupplier.id,
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          feedType: 'fish_feed',
          brandName: 'Blue Crown 6mm',
          bagSizeKg: 15,
          numberOfBags: 3,
          quantityKg: '45.00',
          cost: '114000.00',
          date: addDays(fishBatch2Start, 110),
          supplierId: fishSupplier.id,
          notes: null,
        },
      ])
      .execute()

    // Fish Batch 2 water quality
    const f2WaterQuality: Array<any> = []
    for (let week = 1; week <= 17; week++) {
      f2WaterQuality.push({
        batchId: catfishBatch2.id,
        date: addDays(fishBatch2Start, week * 7),
        ph: randomFloat(6.8, 7.8).toFixed(2),
        temperatureCelsius: randomFloat(26, 30).toFixed(2),
        dissolvedOxygenMgL: randomFloat(5.5, 8.0).toFixed(2),
        ammoniaMgL: randomFloat(0.01, 0.25).toFixed(3),
        notes: null,
      })
    }
    await db.insertInto('water_quality').values(f2WaterQuality).execute()

    // Fish Batch 2 weight samples
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: catfishBatch2.id,
          date: addDays(fishBatch2Start, 0),
          sampleSize: 20,
          averageWeightKg: '0.020',
          minWeightKg: '0.015',
          maxWeightKg: '0.025',
          notes: 'Jumbo starting weight',
        },
        {
          batchId: catfishBatch2.id,
          date: addDays(fishBatch2Start, 30),
          sampleSize: 20,
          averageWeightKg: '0.075',
          minWeightKg: '0.055',
          maxWeightKg: '0.095',
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          date: addDays(fishBatch2Start, 60),
          sampleSize: 20,
          averageWeightKg: '0.180',
          minWeightKg: '0.140',
          maxWeightKg: '0.220',
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          date: addDays(fishBatch2Start, 90),
          sampleSize: 20,
          averageWeightKg: '0.420',
          minWeightKg: '0.340',
          maxWeightKg: '0.500',
          notes: null,
        },
        {
          batchId: catfishBatch2.id,
          date: addDays(fishBatch2Start, 120),
          sampleSize: 20,
          averageWeightKg: '0.750',
          minWeightKg: '0.600',
          maxWeightKg: '0.900',
          notes: 'Month 4 - growing well',
        },
      ])
      .execute()
    console.log(
      `   Batch 2: ${fishBatch2Size} jumbo @ ₦${CATFISH.jumboCost} → ${f2Alive} alive (4 months, harvest soon)\n`,
    )

    // ============ EXPENSES ============
    console.log('💸 Creating expenses...')
    const expenses: Array<any> = []

    // Chick purchases (linked to batches) - using 'livestock' category
    expenses.push(
      {
        farmId: farm.id,
        batchId: broilerBatch1.id,
        category: 'livestock',
        amount: (batch1Size * batch1ChickCost).toFixed(2),
        date: batch1Start,
        description: `${batch1Size} day-old broiler chicks @ ₦${batch1ChickCost}`,
        supplierId: hatchery.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch2.id,
        category: 'livestock',
        amount: (batch2Size * batch2ChickCost).toFixed(2),
        date: batch2Start,
        description: `${batch2Size} day-old broiler chicks @ ₦${batch2ChickCost}`,
        supplierId: hatchery.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch3.id,
        category: 'livestock',
        amount: (batch3Size * batch3ChickCost).toFixed(2),
        date: batch3Start,
        description: `${batch3Size} day-old broiler chicks @ ₦${batch3ChickCost} (premium)`,
        supplierId: hatchery.id,
        isRecurring: false,
      },
    )

    // Jumbo catfish purchases - using 'livestock' category
    expenses.push(
      {
        farmId: farm.id,
        batchId: catfishBatch1.id,
        category: 'livestock',
        amount: (fishBatch1Size * CATFISH.jumboCost).toFixed(2),
        date: fishBatch1Start,
        description: `${fishBatch1Size} jumbo catfish (10-12cm) @ ₦${CATFISH.jumboCost}`,
        supplierId: fishSupplier.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: catfishBatch2.id,
        category: 'livestock',
        amount: (fishBatch2Size * CATFISH.jumboCost).toFixed(2),
        date: fishBatch2Start,
        description: `${fishBatch2Size} jumbo catfish (10-12cm) @ ₦${CATFISH.jumboCost}`,
        supplierId: fishSupplier.id,
        isRecurring: false,
      },
    )

    // Vaccines & Medicine
    expenses.push(
      {
        farmId: farm.id,
        batchId: broilerBatch1.id,
        category: 'medicine',
        amount: '5500.00',
        date: addDays(batch1Start, 5),
        description: 'Newcastle + Gumboro vaccines',
        supplierId: vetSupplier.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch2.id,
        category: 'medicine',
        amount: '5500.00',
        date: addDays(batch2Start, 5),
        description: 'Newcastle + Gumboro vaccines',
        supplierId: vetSupplier.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch3.id,
        category: 'medicine',
        amount: '6000.00',
        date: addDays(batch3Start, 5),
        description: 'Newcastle + Gumboro vaccines',
        supplierId: vetSupplier.id,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch2.id,
        category: 'medicine',
        amount: '3500.00',
        date: addDays(batch2Start, 25),
        description: 'Vitamin supplement',
        supplierId: vetSupplier.id,
        isRecurring: false,
      },
    )

    // Monthly utilities
    const months = [
      '2024-06',
      '2024-07',
      '2024-08',
      '2024-09',
      '2024-10',
      '2024-11',
      '2024-12',
      '2025-01',
    ]
    for (const month of months) {
      expenses.push({
        farmId: farm.id,
        batchId: null,
        category: 'utilities',
        amount: randomFloat(8000, 15000).toFixed(2),
        date: new Date(`${month}-25`),
        description: 'Electricity & Water',
        supplierId: null,
        isRecurring: true,
      })
    }

    // Equipment
    expenses.push(
      {
        farmId: farm.id,
        batchId: null,
        category: 'equipment',
        amount: '45000.00',
        date: new Date('2024-06-05'),
        description: 'Feeders and drinkers (poultry)',
        supplierId: null,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: null,
        category: 'equipment',
        amount: '85000.00',
        date: new Date('2024-06-10'),
        description: 'Fish pond aerator',
        supplierId: null,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: null,
        category: 'equipment',
        amount: '25000.00',
        date: new Date('2024-09-15'),
        description: 'Replacement feeders',
        supplierId: null,
        isRecurring: false,
      },
    )

    // Transport
    expenses.push(
      {
        farmId: farm.id,
        batchId: broilerBatch1.id,
        category: 'transport',
        amount: '8000.00',
        date: b1SaleDate,
        description: 'Transport to market (Batch 1 sale)',
        supplierId: null,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: broilerBatch2.id,
        category: 'transport',
        amount: '10000.00',
        date: b2SaleDate,
        description: 'Transport to customer (Batch 2 sale)',
        supplierId: null,
        isRecurring: false,
      },
      {
        farmId: farm.id,
        batchId: catfishBatch1.id,
        category: 'transport',
        amount: '15000.00',
        date: f1SaleDate,
        description: 'Fish harvest transport',
        supplierId: null,
        isRecurring: false,
      },
    )

    // Labor
    expenses.push({
      farmId: farm.id,
      batchId: catfishBatch1.id,
      category: 'labor',
      amount: '20000.00',
      date: f1SaleDate,
      description: 'Harvest labor (4 workers)',
      supplierId: null,
      isRecurring: false,
    })

    await db.insertInto('expenses').values(expenses).execute()
    console.log(`✅ ${expenses.length} expenses\n`)

    // ============ INVOICES ============
    console.log('📄 Creating invoices...')

    // Invoice for Batch 1 broiler sale
    const inv1 = await db
      .insertInto('invoices')
      .values({
        invoiceNumber: 'INV-2024-001',
        customerId: customers[0].id,
        farmId: farm.id,
        totalAmount: (b1Alive * BROILER.salePrice5Weeks).toFixed(2),
        status: 'paid',
        date: b1SaleDate,
        dueDate: addDays(b1SaleDate, 7),
        notes: 'Paid in full - cash',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()
    await db
      .insertInto('invoice_items')
      .values({
        invoiceId: inv1.id,
        description: `Broiler Chickens (5 weeks, ~1.8kg) x ${b1Alive}`,
        quantity: b1Alive,
        unitPrice: BROILER.salePrice5Weeks.toFixed(2),
        total: (b1Alive * BROILER.salePrice5Weeks).toFixed(2),
      })
      .execute()

    // Link sale to invoice
    await db
      .updateTable('sales')
      .set({ invoiceId: inv1.id })
      .where('id', '=', b1Sale.id)
      .execute()

    // Invoice for Batch 2 broiler sale
    const inv2 = await db
      .insertInto('invoices')
      .values({
        invoiceNumber: 'INV-2024-002',
        customerId: customers[1].id,
        farmId: farm.id,
        totalAmount: (b2Alive * BROILER.salePrice8Weeks).toFixed(2),
        status: 'paid',
        date: b2SaleDate,
        dueDate: addDays(b2SaleDate, 7),
        notes: 'Paid via transfer',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()
    await db
      .insertInto('invoice_items')
      .values({
        invoiceId: inv2.id,
        description: `Broiler Chickens (8 weeks, ~3.0kg premium) x ${b2Alive}`,
        quantity: b2Alive,
        unitPrice: BROILER.salePrice8Weeks.toFixed(2),
        total: (b2Alive * BROILER.salePrice8Weeks).toFixed(2),
      })
      .execute()

    // Link sale to invoice
    await db
      .updateTable('sales')
      .set({ invoiceId: inv2.id })
      .where('id', '=', b2Sale.id)
      .execute()

    // Invoice for Fish Batch 1 sale
    const f1TotalAmount = f1TotalKg * CATFISH.salePricePerKg
    const inv3 = await db
      .insertInto('invoices')
      .values({
        invoiceNumber: 'INV-2024-003',
        customerId: customers[2].id,
        farmId: farm.id,
        totalAmount: f1TotalAmount.toFixed(2),
        status: 'paid',
        date: f1SaleDate,
        dueDate: addDays(f1SaleDate, 7),
        notes: 'Bulk purchase - paid cash',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()
    await db
      .insertInto('invoice_items')
      .values({
        invoiceId: inv3.id,
        description: `Catfish (${f1TotalKg}kg @ ₦${CATFISH.salePricePerKg}/kg)`,
        quantity: f1TotalKg,
        unitPrice: CATFISH.salePricePerKg.toFixed(2),
        total: f1TotalAmount.toFixed(2),
      })
      .execute()

    // Link sale to invoice
    await db
      .updateTable('sales')
      .set({ invoiceId: inv3.id })
      .where('id', '=', f1Sale.id)
      .execute()

    console.log('✅ 3 invoices (all paid)\n')

    // ============ FEED INVENTORY ============
    console.log('📦 Setting up feed inventory...')
    await db
      .insertInto('feed_inventory')
      .values([
        {
          farmId: farm.id,
          feedType: 'starter',
          quantityKg: '50.00',
          minThresholdKg: '25.00',
        },
        {
          farmId: farm.id,
          feedType: 'finisher',
          quantityKg: '75.00',
          minThresholdKg: '50.00',
        },
        {
          farmId: farm.id,
          feedType: 'fish_feed',
          quantityKg: '30.00',
          minThresholdKg: '15.00',
        },
      ])
      .execute()
    console.log('✅ Feed inventory set\n')

    // ============ MEDICATION INVENTORY ============
    console.log('💊 Setting up medication inventory...')
    await db
      .insertInto('medication_inventory')
      .values([
        {
          farmId: farm.id,
          medicationName: 'Newcastle Vaccine (Lasota)',
          quantity: 5,
          unit: 'vial',
          expiryDate: new Date('2025-06-30'),
          minThreshold: 2,
        },
        {
          farmId: farm.id,
          medicationName: 'Gumboro Vaccine',
          quantity: 3,
          unit: 'vial',
          expiryDate: new Date('2025-05-15'),
          minThreshold: 2,
        },
        {
          farmId: farm.id,
          medicationName: 'Vitamin Supplement',
          quantity: 2,
          unit: 'bottle',
          expiryDate: new Date('2025-12-31'),
          minThreshold: 1,
        },
        {
          farmId: farm.id,
          medicationName: 'Antibiotics (Oxytetracycline)',
          quantity: 10,
          unit: 'sachet',
          expiryDate: new Date('2025-08-20'),
          minThreshold: 5,
        },
      ])
      .execute()
    console.log('✅ Medication inventory set\n')

    // ============ LOGS & FORECASTING ============
    console.log('📈 Seeding growth standards & market prices...')

    // 1. Growth Standards (Cobb500 Broiler - Weekly reference points interpolated daily would be ideal, but for now strict weekly points or simple linear interp in logic)
    // We will insert daily points for smoother charts if we pre-calculate them here.
    const cobb500Data: Array<{ day: number; weight: number }> = []
    // Approx weights: d0=42, d7=180, d14=450, d21=900, d28=1500, d35=2000, d42=2800, d49=3600, d56=4500
    const cobbPoints = [42, 180, 450, 900, 1500, 2000, 2800, 3600, 4500]
    for (let i = 0; i < cobbPoints.length - 1; i++) {
      const startDay = i * 7
      const endDay = (i + 1) * 7
      const startWeight = cobbPoints[i]
      const endWeight = cobbPoints[i + 1]
      for (let d = 0; d < 7; d++) {
        const day = startDay + d
        const weight = Math.round(
          startWeight + ((endWeight - startWeight) / 7) * d,
        )
        cobb500Data.push({ day, weight })
      }
    }
    // Add final day
    cobb500Data.push({ day: 56, weight: 4500 })

    await db
      .insertInto('growth_standards')
      .values(
        cobb500Data.map((d) => ({
          species: 'Broiler',
          day: d.day,
          expected_weight_g: d.weight,
        })),
      )
      .execute()

    // 2. Growth Standards (Catfish - Monthly simplified to daily)
    // Month 0=10g, M1=50g, M2=200g, M3=500g, M4=900g, M5=1200g, M6=1500g
    const catfishData: Array<{ day: number; weight: number }> = []
    const fishPoints = [10, 50, 200, 500, 900, 1200, 1500] // Monthly points (0, 30, 60, 90...)
    for (let i = 0; i < fishPoints.length - 1; i++) {
      const startDay = i * 30
      const endDay = (i + 1) * 30
      const startWeight = fishPoints[i]
      const endWeight = fishPoints[i + 1]
      for (let d = 0; d < 30; d++) {
        const day = startDay + d
        const weight = Math.round(
          startWeight + ((endWeight - startWeight) / 30) * d,
        )
        catfishData.push({ day, weight })
      }
    }
    // Add final day
    catfishData.push({ day: 180, weight: 1500 })

    await db
      .insertInto('growth_standards')
      .values(
        catfishData.map((d) => ({
          species: 'Catfish',
          day: d.day,
          expected_weight_g: d.weight,
        })),
      )
      .execute()

    // 3. Market Prices
    await db
      .insertInto('market_prices')
      .values([
        {
          species: 'Broiler',
          size_category: '1.5kg-1.8kg',
          price_per_unit: '4500',
        }, // ~2500-3000/kg
        {
          species: 'Broiler',
          size_category: '1.8kg-2.2kg',
          price_per_unit: '5500',
        },
        {
          species: 'Broiler',
          size_category: '2.5kg+',
          price_per_unit: '10500',
        }, // Premium Jumbo
        {
          species: 'Catfish',
          size_category: 'Melange (400-600g)',
          price_per_unit: '2500',
        }, // Per kg
        {
          species: 'Catfish',
          size_category: 'Table Size (600g-1kg)',
          price_per_unit: '3000',
        }, // Per kg
        {
          species: 'Catfish',
          size_category: 'Jumbo (1kg+)',
          price_per_unit: '3500',
        }, // Per kg
      ])
      .execute()

    console.log('✅ Growth standards & market prices set\n')

    // ============ SUMMARY ============
    const totalBroilerRevenue =
      b1Alive * BROILER.salePrice5Weeks + b2Alive * BROILER.salePrice8Weeks
    const totalFishRevenue = f1TotalAmount

    console.log('═'.repeat(60))
    console.log('🎉 JAYFARMS KADUNA - REALISTIC SEED COMPLETE!')
    console.log('═'.repeat(60))
    console.log('\n📊 Farm Summary:')
    console.log('   🏠 Structures: 2 broiler houses, 2 fish ponds')
    console.log('   🐔 Broiler Batches:')
    console.log(
      `      • JUN-2024-BR-01: ${batch1Size} @ ₦${batch1ChickCost} → ${b1Alive} SOLD (5wks) @ ₦${BROILER.salePrice5Weeks}`,
    )
    console.log(
      `      • AUG-2024-BR-01: ${batch2Size} @ ₦${batch2ChickCost} → ${b2Alive} SOLD (8wks) @ ₦${BROILER.salePrice8Weeks}`,
    )
    console.log(
      `      • NOV-2024-BR-01: ${batch3Size} @ ₦${batch3ChickCost} (premium) → ${b3Alive} ACTIVE`,
    )
    console.log('   🐟 Catfish Batches (Jumbo 10-12cm):')
    console.log(
      `      • JUN-2024-CF-01: ${fishBatch1Size} @ ₦${CATFISH.jumboCost} → ${f1Alive} SOLD (${f1TotalKg}kg @ ₦${CATFISH.salePricePerKg})`,
    )
    console.log(
      `      • SEP-2024-CF-01: ${fishBatch2Size} @ ₦${CATFISH.jumboCost} → ${f2Alive} ACTIVE`,
    )
    console.log('\n💰 Revenue Generated:')
    console.log(`   • Broiler Sales: ₦${totalBroilerRevenue.toLocaleString()}`)
    console.log(`   • Fish Sales: ₦${totalFishRevenue.toLocaleString()}`)
    console.log(
      `   • TOTAL: ₦${(totalBroilerRevenue + totalFishRevenue).toLocaleString()}`,
    )
    console.log('\n📈 Active Inventory:')
    console.log(`   • ${b3Alive} broilers (ready for sale)`)
    console.log(`   • ${f2Alive} catfish (harvest in ~3-4 weeks)`)
    console.log('\n🔮 Growth & Markets:')
    console.log('   • Imported Cobb500 & Catfish Growth Standards')
    console.log('   • Updated Market Prices for Kaduna')
    console.log('\n🔐 Login: jay@jayfarms.com / admin123\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
