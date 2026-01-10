/**
 * Realistic Farm Seeder - JayFarms Kaduna
 * 
 * Story: First-time farmer starting in Kaduna with small batches
 * - Broilers: 50-60 birds per batch, sold at 4-5 weeks (₦5-6k) or 8 weeks (₦10-12k)
 * - Catfish: 500-600 fingerlings, grown 4-5 months from jumbo, sold at ₦3,500/kg
 * 
 * Feed Pricing:
 * - Chicken: Ultima Plus ₦24,000/25kg
 * - Fish 2mm: Aller Aqua ₦67,000/15kg  
 * - Fish 4mm+: Blue Crown ₦38,000/15kg
 */

import { db } from './index'
import crypto from 'crypto'

// ============ CONFIG ============
const FARM_LOCATION = 'Kaduna, Kaduna State'
const START_DATE = new Date('2024-06-01') // Farm started 7 months ago

// Broiler Config
const BROILER = {
  batchSize: { min: 50, max: 60 },
  chickCost: { min: 800, max: 1200 }, // Day-old chick price
  feedPerBirdTotal: 4.5, // kg total feed consumption over 8 weeks
  mortalityRate: { week1: 0.05, week2_4: 0.02, week5_8: 0.01 },
  salePrice4_5Weeks: { min: 5000, max: 6000 },
  salePrice8Weeks: { min: 10000, max: 12000 },
  feed: { name: 'Ultima Plus', costPer25kg: 24000 },
}

// Catfish Config  
const CATFISH = {
  batchSize: { min: 500, max: 600 },
  fingerlingCost: { min: 80, max: 120 }, // Jumbo fingerling
  growthMonths: { min: 4, max: 5 },
  avgWeightAtHarvest: { min: 0.8, max: 1.5 }, // kg per fish
  salePricePerKg: 3500,
  mortalityRate: { month1: 0.08, month2_3: 0.03, month4_5: 0.02 },
  feed: {
    starter: { name: 'Aller Aqua 2mm', costPer15kg: 67000, months: [1, 2] },
    grower: { name: 'Blue Crown 4mm+', costPer15kg: 38000, months: [3, 4, 5] },
  },
}

// ============ HELPERS ============
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2)
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
const addMonths = (date: Date, months: number) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
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
    const tables = ['invoice_items', 'invoices', 'water_quality', 'weight_samples', 'treatments', 
      'vaccinations', 'egg_records', 'mortality_records', 'feed_records', 'feed_inventory',
      'expenses', 'sales', 'batches', 'user_farms', 'farms', 'suppliers', 'customers',
      'sessions', 'account', 'users']
    for (const t of tables) await db.deleteFrom(t as any).execute()
    console.log('✅ Cleared\n')

    // USER
    console.log('👤 Creating farm owner...')
    const owner = await db.insertInto('users').values({
      email: 'jay@jayfarms.com', name: 'Jamal Ibrahim', role: 'admin', emailVerified: true,
    }).returning(['id']).executeTakeFirstOrThrow()
    await db.insertInto('account').values({
      id: crypto.randomUUID(), userId: owner.id, accountId: owner.id,
      providerId: 'credential', password: await hashPassword('admin123'),
    }).execute()
    console.log('✅ Owner: jay@jayfarms.com\n')

    // FARM
    console.log('🏡 Creating farm...')
    const farm = await db.insertInto('farms').values({
      name: 'JayFarms Kaduna', location: FARM_LOCATION, type: 'mixed',
    }).returning(['id', 'name']).executeTakeFirstOrThrow()
    await db.insertInto('user_farms').values({ userId: owner.id, farmId: farm.id }).execute()
    console.log(`✅ ${farm.name}\n`)

    // SUPPLIERS
    console.log('🏭 Creating suppliers...')
    const suppliers = await db.insertInto('suppliers').values([
      { name: 'Kaduna Hatchery', phone: '08031234567', location: 'Kaduna', products: ['day-old chicks'] },
      { name: 'Ultima Feeds Kaduna', phone: '08032345678', location: 'Kaduna', products: ['poultry feed'] },
      { name: 'AquaLife Fisheries', phone: '08033456789', location: 'Kaduna', products: ['fingerlings', 'fish feed'] },
      { name: 'VetCare Kaduna', phone: '08034567890', location: 'Kaduna', products: ['vaccines', 'medicine'] },
    ]).returning(['id', 'name', 'products']).execute()
    const hatchery = suppliers.find(s => s.products.includes('day-old chicks'))!
    const feedSupplier = suppliers.find(s => s.products.includes('poultry feed'))!
    const fishSupplier = suppliers.find(s => s.products.includes('fingerlings'))!
    const vetSupplier = suppliers.find(s => s.products.includes('vaccines'))!
    console.log(`✅ ${suppliers.length} suppliers\n`)

    // CUSTOMERS
    console.log('👥 Creating customers...')
    const customers = await db.insertInto('customers').values([
      { name: 'Alhaji Garba - Kasuwan Rimi', phone: '08041234567', location: 'Kasuwan Rimi Market, Kaduna' },
      { name: 'Mama Joy Restaurant', phone: '08042345678', location: 'Barnawa, Kaduna', email: 'mamajoy@gmail.com' },
      { name: 'Fresh Fish Corner', phone: '08043456789', location: 'Kakuri Market, Kaduna' },
      { name: 'Kaduna Frozen Foods', phone: '08044567890', location: 'Tudun Wada, Kaduna' },
    ]).returning(['id', 'name']).execute()
    console.log(`✅ ${customers.length} customers\n`)

    // ============ BROILER BATCHES ============
    console.log('🐔 Creating broiler batches with full lifecycle...')
    
    // Batch 1: SOLD - Started June 2024, sold at 5 weeks (early July)
    const batch1Start = new Date('2024-06-10')
    const batch1Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch1ChickCost = randomFloat(BROILER.chickCost.min, BROILER.chickCost.max)
    
    const broilerBatch1 = await db.insertInto('batches').values({
      farmId: farm.id, livestockType: 'poultry', species: 'Broiler',
      initialQuantity: batch1Size, currentQuantity: 0,
      acquisitionDate: batch1Start,
      costPerUnit: batch1ChickCost.toFixed(2),
      totalCost: (batch1Size * batch1ChickCost).toFixed(2),
      status: 'sold',
    }).returning(['id', 'initialQuantity', 'acquisitionDate']).executeTakeFirstOrThrow()

    // Batch 1 mortality (realistic curve)
    let b1Alive = batch1Size
    const b1Mortality: any[] = []
    // Week 1: Higher mortality (5%)
    const b1Week1Deaths = Math.floor(batch1Size * BROILER.mortalityRate.week1)
    for (let i = 0; i < b1Week1Deaths; i++) {
      b1Mortality.push({
        batchId: broilerBatch1.id, quantity: 1,
        date: addDays(batch1Start, randomInt(1, 7)),
        cause: i < 2 ? 'disease' : 'unknown', notes: 'Early chick mortality',
      })
      b1Alive--
    }
    // Week 2-4: Lower mortality (2%)
    const b1Week2_4Deaths = Math.floor(batch1Size * BROILER.mortalityRate.week2_4)
    for (let i = 0; i < b1Week2_4Deaths; i++) {
      b1Mortality.push({
        batchId: broilerBatch1.id, quantity: 1,
        date: addDays(batch1Start, randomInt(8, 28)),
        cause: 'unknown', notes: null,
      })
      b1Alive--
    }
    if (b1Mortality.length > 0) await db.insertInto('mortality_records').values(b1Mortality).execute()

    // Batch 1 feed records (5 weeks worth)
    const b1Feed: any[] = []
    // Week 1-2: Starter
    b1Feed.push({
      batchId: broilerBatch1.id, feedType: 'starter',
      quantityKg: '25.00', cost: BROILER.feed.costPer25kg.toFixed(2),
      date: addDays(batch1Start, 0), supplierId: feedSupplier.id,
    })
    b1Feed.push({
      batchId: broilerBatch1.id, feedType: 'starter',
      quantityKg: '25.00', cost: BROILER.feed.costPer25kg.toFixed(2),
      date: addDays(batch1Start, 10), supplierId: feedSupplier.id,
    })
    // Week 3-5: Finisher
    b1Feed.push({
      batchId: broilerBatch1.id, feedType: 'finisher',
      quantityKg: '50.00', cost: (BROILER.feed.costPer25kg * 2).toFixed(2),
      date: addDays(batch1Start, 18), supplierId: feedSupplier.id,
    })
    b1Feed.push({
      batchId: broilerBatch1.id, feedType: 'finisher',
      quantityKg: '50.00', cost: (BROILER.feed.costPer25kg * 2).toFixed(2),
      date: addDays(batch1Start, 28), supplierId: feedSupplier.id,
    })
    await db.insertInto('feed_records').values(b1Feed).execute()

    // Batch 1 vaccinations
    await db.insertInto('vaccinations').values([
      { batchId: broilerBatch1.id, vaccineName: 'Newcastle (Lasota)', dateAdministered: addDays(batch1Start, 7), dosage: '1 drop/bird', notes: 'Day 7 vaccination' },
      { batchId: broilerBatch1.id, vaccineName: 'Gumboro', dateAdministered: addDays(batch1Start, 14), dosage: '1 drop/bird', notes: 'Day 14 vaccination' },
      { batchId: broilerBatch1.id, vaccineName: 'Newcastle Booster', dateAdministered: addDays(batch1Start, 21), dosage: '1 drop/bird', notes: 'Day 21 booster' },
    ]).execute()

    // Batch 1 weight samples
    await db.insertInto('weight_samples').values([
      { batchId: broilerBatch1.id, date: addDays(batch1Start, 7), sampleSize: 10, averageWeightKg: '0.180' },
      { batchId: broilerBatch1.id, date: addDays(batch1Start, 14), sampleSize: 10, averageWeightKg: '0.450' },
      { batchId: broilerBatch1.id, date: addDays(batch1Start, 21), sampleSize: 10, averageWeightKg: '0.850' },
      { batchId: broilerBatch1.id, date: addDays(batch1Start, 28), sampleSize: 10, averageWeightKg: '1.350' },
      { batchId: broilerBatch1.id, date: addDays(batch1Start, 35), sampleSize: 10, averageWeightKg: '1.800' },
    ]).execute()

    // Batch 1 SALE (sold at 5 weeks)
    const b1SalePrice = randomFloat(BROILER.salePrice4_5Weeks.min, BROILER.salePrice4_5Weeks.max)
    const b1SaleDate = addDays(batch1Start, 35)
    await db.insertInto('sales').values({
      farmId: farm.id, batchId: broilerBatch1.id, customerId: customers[0].id,
      livestockType: 'poultry', quantity: b1Alive,
      unitPrice: b1SalePrice.toFixed(2), totalAmount: (b1Alive * b1SalePrice).toFixed(2),
      date: b1SaleDate, notes: 'Sold at 5 weeks - good weight',
    }).execute()
    console.log(`   Batch 1: ${batch1Size} chicks → ${b1Alive} sold at 5 weeks`)

    // Batch 2: SOLD - Started August 2024, sold at 8 weeks (late September)
    const batch2Start = new Date('2024-08-05')
    const batch2Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch2ChickCost = randomFloat(BROILER.chickCost.min, BROILER.chickCost.max)
    
    const broilerBatch2 = await db.insertInto('batches').values({
      farmId: farm.id, livestockType: 'poultry', species: 'Broiler',
      initialQuantity: batch2Size, currentQuantity: 0,
      acquisitionDate: batch2Start,
      costPerUnit: batch2ChickCost.toFixed(2),
      totalCost: (batch2Size * batch2ChickCost).toFixed(2),
      status: 'sold',
    }).returning(['id', 'initialQuantity']).executeTakeFirstOrThrow()

    // Batch 2 mortality
    let b2Alive = batch2Size
    const b2Mortality: any[] = []
    const b2Week1Deaths = Math.floor(batch2Size * 0.04) // Slightly better this time
    for (let i = 0; i < b2Week1Deaths; i++) {
      b2Mortality.push({ batchId: broilerBatch2.id, quantity: 1, date: addDays(batch2Start, randomInt(1, 7)), cause: 'unknown', notes: null })
      b2Alive--
    }
    const b2LaterDeaths = Math.floor(batch2Size * 0.02)
    for (let i = 0; i < b2LaterDeaths; i++) {
      b2Mortality.push({ batchId: broilerBatch2.id, quantity: 1, date: addDays(batch2Start, randomInt(14, 50)), cause: 'unknown', notes: null })
      b2Alive--
    }
    if (b2Mortality.length > 0) await db.insertInto('mortality_records').values(b2Mortality).execute()

    // Batch 2 feed (8 weeks - more feed)
    await db.insertInto('feed_records').values([
      { batchId: broilerBatch2.id, feedType: 'starter', quantityKg: '25.00', cost: '24000.00', date: addDays(batch2Start, 0), supplierId: feedSupplier.id },
      { batchId: broilerBatch2.id, feedType: 'starter', quantityKg: '25.00', cost: '24000.00', date: addDays(batch2Start, 12), supplierId: feedSupplier.id },
      { batchId: broilerBatch2.id, feedType: 'finisher', quantityKg: '50.00', cost: '48000.00', date: addDays(batch2Start, 21), supplierId: feedSupplier.id },
      { batchId: broilerBatch2.id, feedType: 'finisher', quantityKg: '50.00', cost: '48000.00', date: addDays(batch2Start, 35), supplierId: feedSupplier.id },
      { batchId: broilerBatch2.id, feedType: 'finisher', quantityKg: '50.00', cost: '48000.00', date: addDays(batch2Start, 49), supplierId: feedSupplier.id },
    ]).execute()

    // Batch 2 vaccinations
    await db.insertInto('vaccinations').values([
      { batchId: broilerBatch2.id, vaccineName: 'Newcastle (Lasota)', dateAdministered: addDays(batch2Start, 7), dosage: '1 drop/bird', notes: null },
      { batchId: broilerBatch2.id, vaccineName: 'Gumboro', dateAdministered: addDays(batch2Start, 14), dosage: '1 drop/bird', notes: null },
      { batchId: broilerBatch2.id, vaccineName: 'Newcastle Booster', dateAdministered: addDays(batch2Start, 21), dosage: '1 drop/bird', notes: null },
    ]).execute()

    // Batch 2 weight samples (8 weeks)
    await db.insertInto('weight_samples').values([
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 7), sampleSize: 10, averageWeightKg: '0.200' },
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 14), sampleSize: 10, averageWeightKg: '0.480' },
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 21), sampleSize: 10, averageWeightKg: '0.900' },
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 28), sampleSize: 10, averageWeightKg: '1.400' },
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 42), sampleSize: 10, averageWeightKg: '2.200' },
      { batchId: broilerBatch2.id, date: addDays(batch2Start, 56), sampleSize: 10, averageWeightKg: '3.000' },
    ]).execute()

    // Batch 2 SALE (sold at 8 weeks - bigger birds, better price)
    const b2SalePrice = randomFloat(BROILER.salePrice8Weeks.min, BROILER.salePrice8Weeks.max)
    await db.insertInto('sales').values({
      farmId: farm.id, batchId: broilerBatch2.id, customerId: customers[1].id,
      livestockType: 'poultry', quantity: b2Alive,
      unitPrice: b2SalePrice.toFixed(2), totalAmount: (b2Alive * b2SalePrice).toFixed(2),
      date: addDays(batch2Start, 56), notes: 'Sold at 8 weeks - premium size',
    }).execute()
    console.log(`   Batch 2: ${batch2Size} chicks → ${b2Alive} sold at 8 weeks`)

    // Batch 3: ACTIVE - Started late November 2024, currently 6 weeks old
    const batch3Start = new Date('2024-11-25')
    const batch3Size = randomInt(BROILER.batchSize.min, BROILER.batchSize.max)
    const batch3ChickCost = randomFloat(BROILER.chickCost.min, BROILER.chickCost.max)
    
    let b3Alive = batch3Size
    const b3Deaths = Math.floor(batch3Size * 0.05)
    b3Alive -= b3Deaths

    const broilerBatch3 = await db.insertInto('batches').values({
      farmId: farm.id, livestockType: 'poultry', species: 'Broiler',
      initialQuantity: batch3Size, currentQuantity: b3Alive,
      acquisitionDate: batch3Start,
      costPerUnit: batch3ChickCost.toFixed(2),
      totalCost: (batch3Size * batch3ChickCost).toFixed(2),
      status: 'active',
    }).returning(['id']).executeTakeFirstOrThrow()

    // Batch 3 mortality
    const b3Mortality: any[] = []
    for (let i = 0; i < b3Deaths; i++) {
      b3Mortality.push({ batchId: broilerBatch3.id, quantity: 1, date: addDays(batch3Start, randomInt(1, 14)), cause: i < 2 ? 'disease' : 'unknown', notes: null })
    }
    if (b3Mortality.length > 0) await db.insertInto('mortality_records').values(b3Mortality).execute()

    // Batch 3 feed (6 weeks so far)
    await db.insertInto('feed_records').values([
      { batchId: broilerBatch3.id, feedType: 'starter', quantityKg: '25.00', cost: '24000.00', date: addDays(batch3Start, 0), supplierId: feedSupplier.id },
      { batchId: broilerBatch3.id, feedType: 'starter', quantityKg: '25.00', cost: '24000.00', date: addDays(batch3Start, 10), supplierId: feedSupplier.id },
      { batchId: broilerBatch3.id, feedType: 'finisher', quantityKg: '50.00', cost: '48000.00', date: addDays(batch3Start, 21), supplierId: feedSupplier.id },
      { batchId: broilerBatch3.id, feedType: 'finisher', quantityKg: '50.00', cost: '48000.00', date: addDays(batch3Start, 35), supplierId: feedSupplier.id },
    ]).execute()

    // Batch 3 vaccinations
    await db.insertInto('vaccinations').values([
      { batchId: broilerBatch3.id, vaccineName: 'Newcastle (Lasota)', dateAdministered: addDays(batch3Start, 7), dosage: '1 drop/bird', notes: null },
      { batchId: broilerBatch3.id, vaccineName: 'Gumboro', dateAdministered: addDays(batch3Start, 14), dosage: '1 drop/bird', notes: null },
      { batchId: broilerBatch3.id, vaccineName: 'Newcastle Booster', dateAdministered: addDays(batch3Start, 21), dosage: '1 drop/bird', notes: null },
    ]).execute()

    // Batch 3 weight samples
    await db.insertInto('weight_samples').values([
      { batchId: broilerBatch3.id, date: addDays(batch3Start, 7), sampleSize: 10, averageWeightKg: '0.190' },
      { batchId: broilerBatch3.id, date: addDays(batch3Start, 14), sampleSize: 10, averageWeightKg: '0.460' },
      { batchId: broilerBatch3.id, date: addDays(batch3Start, 21), sampleSize: 10, averageWeightKg: '0.880' },
      { batchId: broilerBatch3.id, date: addDays(batch3Start, 28), sampleSize: 10, averageWeightKg: '1.380' },
      { batchId: broilerBatch3.id, date: addDays(batch3Start, 42), sampleSize: 10, averageWeightKg: '2.100' },
    ]).execute()
    console.log(`   Batch 3: ${batch3Size} chicks → ${b3Alive} alive (6 weeks, ready for sale soon)\n`)

    // ============ CATFISH BATCHES ============
    console.log('🐟 Creating catfish batches with full lifecycle...')

    // Fish Batch 1: SOLD - Started June 2024, harvested October (4.5 months)
    const fishBatch1Start = new Date('2024-06-15')
    const fishBatch1Size = randomInt(CATFISH.batchSize.min, CATFISH.batchSize.max)
    const fishBatch1Cost = randomFloat(CATFISH.fingerlingCost.min, CATFISH.fingerlingCost.max)

    const catfishBatch1 = await db.insertInto('batches').values({
      farmId: farm.id, livestockType: 'fish', species: 'Catfish',
      initialQuantity: fishBatch1Size, currentQuantity: 0,
      acquisitionDate: fishBatch1Start,
      costPerUnit: fishBatch1Cost.toFixed(2),
      totalCost: (fishBatch1Size * fishBatch1Cost).toFixed(2),
      status: 'sold',
    }).returning(['id', 'initialQuantity']).executeTakeFirstOrThrow()

    // Fish Batch 1 mortality (realistic curve)
    let f1Alive = fishBatch1Size
    const f1Mortality: any[] = []
    // Month 1: Higher mortality (8%)
    const f1Month1Deaths = Math.floor(fishBatch1Size * CATFISH.mortalityRate.month1)
    for (let i = 0; i < f1Month1Deaths; i++) {
      f1Mortality.push({ batchId: catfishBatch1.id, quantity: 1, date: addDays(fishBatch1Start, randomInt(1, 30)), cause: i < 5 ? 'disease' : 'other', notes: 'Fingerling adjustment period' })
      f1Alive--
    }
    // Month 2-3: Lower mortality (3%)
    const f1Month2_3Deaths = Math.floor(fishBatch1Size * CATFISH.mortalityRate.month2_3)
    for (let i = 0; i < f1Month2_3Deaths; i++) {
      f1Mortality.push({ batchId: catfishBatch1.id, quantity: 1, date: addDays(fishBatch1Start, randomInt(31, 90)), cause: 'unknown', notes: null })
      f1Alive--
    }
    // Month 4-5: Minimal mortality (2%)
    const f1Month4_5Deaths = Math.floor(fishBatch1Size * CATFISH.mortalityRate.month4_5)
    for (let i = 0; i < f1Month4_5Deaths; i++) {
      f1Mortality.push({ batchId: catfishBatch1.id, quantity: 1, date: addDays(fishBatch1Start, randomInt(91, 135)), cause: 'unknown', notes: null })
      f1Alive--
    }
    if (f1Mortality.length > 0) await db.insertInto('mortality_records').values(f1Mortality).execute()

    // Fish Batch 1 feed records
    await db.insertInto('feed_records').values([
      // Month 1-2: Aller Aqua 2mm (starter)
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch1Start, 0), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch1Start, 15), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch1Start, 30), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch1Start, 45), supplierId: fishSupplier.id },
      // Month 3-5: Blue Crown 4mm+ (grower)
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '30.00', cost: '76000.00', date: addDays(fishBatch1Start, 60), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '30.00', cost: '76000.00', date: addDays(fishBatch1Start, 75), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '45.00', cost: '114000.00', date: addDays(fishBatch1Start, 90), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '45.00', cost: '114000.00', date: addDays(fishBatch1Start, 110), supplierId: fishSupplier.id },
      { batchId: catfishBatch1.id, feedType: 'fish_feed', quantityKg: '45.00', cost: '114000.00', date: addDays(fishBatch1Start, 125), supplierId: fishSupplier.id },
    ]).execute()

    // Fish Batch 1 water quality (weekly readings)
    const f1WaterQuality: any[] = []
    for (let week = 1; week <= 19; week++) {
      f1WaterQuality.push({
        batchId: catfishBatch1.id, date: addDays(fishBatch1Start, week * 7),
        ph: randomFloat(6.8, 7.8).toFixed(2),
        temperatureCelsius: randomFloat(26, 30).toFixed(2),
        dissolvedOxygenMgL: randomFloat(5.5, 8.0).toFixed(2),
        ammoniaMgL: randomFloat(0.01, 0.3).toFixed(3),
        notes: week % 4 === 0 ? 'Water change done' : null,
      })
    }
    await db.insertInto('water_quality').values(f1WaterQuality).execute()

    // Fish Batch 1 weight samples
    await db.insertInto('weight_samples').values([
      { batchId: catfishBatch1.id, date: addDays(fishBatch1Start, 30), sampleSize: 20, averageWeightKg: '0.080' },
      { batchId: catfishBatch1.id, date: addDays(fishBatch1Start, 60), sampleSize: 20, averageWeightKg: '0.200' },
      { batchId: catfishBatch1.id, date: addDays(fishBatch1Start, 90), sampleSize: 20, averageWeightKg: '0.450' },
      { batchId: catfishBatch1.id, date: addDays(fishBatch1Start, 120), sampleSize: 20, averageWeightKg: '0.800' },
      { batchId: catfishBatch1.id, date: addDays(fishBatch1Start, 135), sampleSize: 20, averageWeightKg: '1.100' },
    ]).execute()

    // Fish Batch 1 SALE (harvested at 4.5 months)
    const f1AvgWeight = randomFloat(0.9, 1.2)
    const f1TotalKg = f1Alive * f1AvgWeight
    await db.insertInto('sales').values({
      farmId: farm.id, batchId: catfishBatch1.id, customerId: customers[2].id,
      livestockType: 'fish', quantity: Math.round(f1TotalKg),
      unitPrice: CATFISH.salePricePerKg.toFixed(2),
      totalAmount: (f1TotalKg * CATFISH.salePricePerKg).toFixed(2),
      date: addDays(fishBatch1Start, 135), notes: `${f1Alive} fish @ avg ${f1AvgWeight.toFixed(2)}kg = ${f1TotalKg.toFixed(0)}kg total`,
    }).execute()
    console.log(`   Batch 1: ${fishBatch1Size} fingerlings → ${f1Alive} harvested (${f1TotalKg.toFixed(0)}kg @ ₦3,500/kg)`)

    // Fish Batch 2: ACTIVE - Started September 2024, currently 4 months old
    const fishBatch2Start = new Date('2024-09-01')
    const fishBatch2Size = randomInt(CATFISH.batchSize.min, CATFISH.batchSize.max)
    const fishBatch2Cost = randomFloat(CATFISH.fingerlingCost.min, CATFISH.fingerlingCost.max)

    let f2Alive = fishBatch2Size
    const f2TotalDeaths = Math.floor(fishBatch2Size * 0.10) // 10% mortality so far
    f2Alive -= f2TotalDeaths

    const catfishBatch2 = await db.insertInto('batches').values({
      farmId: farm.id, livestockType: 'fish', species: 'Catfish',
      initialQuantity: fishBatch2Size, currentQuantity: f2Alive,
      acquisitionDate: fishBatch2Start,
      costPerUnit: fishBatch2Cost.toFixed(2),
      totalCost: (fishBatch2Size * fishBatch2Cost).toFixed(2),
      status: 'active',
    }).returning(['id']).executeTakeFirstOrThrow()

    // Fish Batch 2 mortality
    const f2Mortality: any[] = []
    for (let i = 0; i < f2TotalDeaths; i++) {
      const day = i < Math.floor(f2TotalDeaths * 0.6) ? randomInt(1, 30) : randomInt(31, 120)
      f2Mortality.push({ batchId: catfishBatch2.id, quantity: 1, date: addDays(fishBatch2Start, day), cause: 'unknown', notes: null })
    }
    if (f2Mortality.length > 0) await db.insertInto('mortality_records').values(f2Mortality).execute()

    // Fish Batch 2 feed (4 months)
    await db.insertInto('feed_records').values([
      // Month 1-2: Aller Aqua 2mm
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch2Start, 0), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch2Start, 15), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch2Start, 30), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '15.00', cost: '67000.00', date: addDays(fishBatch2Start, 50), supplierId: fishSupplier.id },
      // Month 3-4: Blue Crown 4mm+
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '30.00', cost: '76000.00', date: addDays(fishBatch2Start, 65), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '30.00', cost: '76000.00', date: addDays(fishBatch2Start, 80), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '45.00', cost: '114000.00', date: addDays(fishBatch2Start, 100), supplierId: fishSupplier.id },
      { batchId: catfishBatch2.id, feedType: 'fish_feed', quantityKg: '45.00', cost: '114000.00', date: addDays(fishBatch2Start, 115), supplierId: fishSupplier.id },
    ]).execute()

    // Fish Batch 2 water quality
    const f2WaterQuality: any[] = []
    for (let week = 1; week <= 17; week++) {
      f2WaterQuality.push({
        batchId: catfishBatch2.id, date: addDays(fishBatch2Start, week * 7),
        ph: randomFloat(6.8, 7.8).toFixed(2),
        temperatureCelsius: randomFloat(26, 30).toFixed(2),
        dissolvedOxygenMgL: randomFloat(5.5, 8.0).toFixed(2),
        ammoniaMgL: randomFloat(0.01, 0.25).toFixed(3),
        notes: null,
      })
    }
    await db.insertInto('water_quality').values(f2WaterQuality).execute()

    // Fish Batch 2 weight samples
    await db.insertInto('weight_samples').values([
      { batchId: catfishBatch2.id, date: addDays(fishBatch2Start, 30), sampleSize: 20, averageWeightKg: '0.075' },
      { batchId: catfishBatch2.id, date: addDays(fishBatch2Start, 60), sampleSize: 20, averageWeightKg: '0.180' },
      { batchId: catfishBatch2.id, date: addDays(fishBatch2Start, 90), sampleSize: 20, averageWeightKg: '0.420' },
      { batchId: catfishBatch2.id, date: addDays(fishBatch2Start, 120), sampleSize: 20, averageWeightKg: '0.750' },
    ]).execute()
    console.log(`   Batch 2: ${fishBatch2Size} fingerlings → ${f2Alive} alive (4 months, harvest in ~3-4 weeks)\n`)

    // ============ EXPENSES ============
    console.log('💸 Creating expenses...')
    const expenses: any[] = []
    
    // Chick purchases (linked to batches)
    expenses.push(
      { farmId: farm.id, batchId: broilerBatch1.id, category: 'other', amount: (batch1Size * batch1ChickCost).toFixed(2), date: batch1Start, description: `${batch1Size} day-old broiler chicks`, supplierId: hatchery.id, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch2.id, category: 'other', amount: (batch2Size * batch2ChickCost).toFixed(2), date: batch2Start, description: `${batch2Size} day-old broiler chicks`, supplierId: hatchery.id, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch3.id, category: 'other', amount: (batch3Size * batch3ChickCost).toFixed(2), date: batch3Start, description: `${batch3Size} day-old broiler chicks`, supplierId: hatchery.id, isRecurring: false },
    )
    
    // Fingerling purchases
    expenses.push(
      { farmId: farm.id, batchId: catfishBatch1.id, category: 'other', amount: (fishBatch1Size * fishBatch1Cost).toFixed(2), date: fishBatch1Start, description: `${fishBatch1Size} jumbo catfish fingerlings`, supplierId: fishSupplier.id, isRecurring: false },
      { farmId: farm.id, batchId: catfishBatch2.id, category: 'other', amount: (fishBatch2Size * fishBatch2Cost).toFixed(2), date: fishBatch2Start, description: `${fishBatch2Size} jumbo catfish fingerlings`, supplierId: fishSupplier.id, isRecurring: false },
    )

    // Vaccines & Medicine
    expenses.push(
      { farmId: farm.id, batchId: broilerBatch1.id, category: 'medicine', amount: '5500.00', date: addDays(batch1Start, 5), description: 'Newcastle + Gumboro vaccines', supplierId: vetSupplier.id, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch2.id, category: 'medicine', amount: '5500.00', date: addDays(batch2Start, 5), description: 'Newcastle + Gumboro vaccines', supplierId: vetSupplier.id, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch3.id, category: 'medicine', amount: '6000.00', date: addDays(batch3Start, 5), description: 'Newcastle + Gumboro vaccines', supplierId: vetSupplier.id, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch2.id, category: 'medicine', amount: '3500.00', date: addDays(batch2Start, 25), description: 'Vitamin supplement', supplierId: vetSupplier.id, isRecurring: false },
    )

    // Monthly utilities (electricity for fish pond aerators, water)
    const months = ['2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01']
    for (const month of months) {
      expenses.push({
        farmId: farm.id, batchId: null, category: 'utilities',
        amount: randomFloat(8000, 15000).toFixed(2),
        date: new Date(`${month}-25`),
        description: 'Electricity & Water', supplierId: null, isRecurring: true,
      })
    }

    // Equipment purchases
    expenses.push(
      { farmId: farm.id, batchId: null, category: 'equipment', amount: '45000.00', date: new Date('2024-06-05'), description: 'Feeders and drinkers (poultry)', supplierId: null, isRecurring: false },
      { farmId: farm.id, batchId: null, category: 'equipment', amount: '85000.00', date: new Date('2024-06-10'), description: 'Fish pond aerator', supplierId: null, isRecurring: false },
      { farmId: farm.id, batchId: null, category: 'equipment', amount: '25000.00', date: new Date('2024-09-15'), description: 'Replacement feeders', supplierId: null, isRecurring: false },
    )

    // Transport costs
    expenses.push(
      { farmId: farm.id, batchId: broilerBatch1.id, category: 'transport', amount: '8000.00', date: addDays(batch1Start, 35), description: 'Transport to market (Batch 1 sale)', supplierId: null, isRecurring: false },
      { farmId: farm.id, batchId: broilerBatch2.id, category: 'transport', amount: '10000.00', date: addDays(batch2Start, 56), description: 'Transport to customer (Batch 2 sale)', supplierId: null, isRecurring: false },
      { farmId: farm.id, batchId: catfishBatch1.id, category: 'transport', amount: '15000.00', date: addDays(fishBatch1Start, 135), description: 'Fish harvest transport', supplierId: null, isRecurring: false },
    )

    // Labor (casual workers for harvest)
    expenses.push(
      { farmId: farm.id, batchId: catfishBatch1.id, category: 'labor', amount: '20000.00', date: addDays(fishBatch1Start, 135), description: 'Harvest labor (4 workers)', supplierId: null, isRecurring: false },
    )

    await db.insertInto('expenses').values(expenses).execute()
    console.log(`✅ ${expenses.length} expenses\n`)

    // ============ INVOICES ============
    console.log('📄 Creating invoices...')
    
    // Invoice for Batch 1 broiler sale
    const inv1 = await db.insertInto('invoices').values({
      invoiceNumber: 'INV-2024-001',
      customerId: customers[0].id, farmId: farm.id,
      totalAmount: (b1Alive * b1SalePrice).toFixed(2),
      status: 'paid', date: b1SaleDate,
      dueDate: addDays(b1SaleDate, 7), notes: 'Paid in full - cash',
    }).returning(['id']).executeTakeFirstOrThrow()
    await db.insertInto('invoice_items').values({
      invoiceId: inv1.id, description: `Broiler Chickens (5 weeks) x ${b1Alive}`,
      quantity: b1Alive, unitPrice: b1SalePrice.toFixed(2), total: (b1Alive * b1SalePrice).toFixed(2),
    }).execute()

    // Invoice for Batch 2 broiler sale
    const inv2 = await db.insertInto('invoices').values({
      invoiceNumber: 'INV-2024-002',
      customerId: customers[1].id, farmId: farm.id,
      totalAmount: (b2Alive * b2SalePrice).toFixed(2),
      status: 'paid', date: addDays(batch2Start, 56),
      dueDate: addDays(batch2Start, 63), notes: 'Paid via transfer',
    }).returning(['id']).executeTakeFirstOrThrow()
    await db.insertInto('invoice_items').values({
      invoiceId: inv2.id, description: `Broiler Chickens (8 weeks, premium) x ${b2Alive}`,
      quantity: b2Alive, unitPrice: b2SalePrice.toFixed(2), total: (b2Alive * b2SalePrice).toFixed(2),
    }).execute()

    // Invoice for Fish Batch 1 sale
    const f1TotalAmount = f1TotalKg * CATFISH.salePricePerKg
    const inv3 = await db.insertInto('invoices').values({
      invoiceNumber: 'INV-2024-003',
      customerId: customers[2].id, farmId: farm.id,
      totalAmount: f1TotalAmount.toFixed(2),
      status: 'paid', date: addDays(fishBatch1Start, 135),
      dueDate: addDays(fishBatch1Start, 142), notes: 'Bulk purchase - paid cash',
    }).returning(['id']).executeTakeFirstOrThrow()
    await db.insertInto('invoice_items').values({
      invoiceId: inv3.id, description: `Catfish (${f1TotalKg.toFixed(0)}kg @ ₦3,500/kg)`,
      quantity: Math.round(f1TotalKg), unitPrice: '3500.00', total: f1TotalAmount.toFixed(2),
    }).execute()

    console.log('✅ 3 invoices (all paid)\n')

    // ============ FEED INVENTORY ============
    console.log('📦 Setting up feed inventory...')
    await db.insertInto('feed_inventory').values([
      { farmId: farm.id, feedType: 'starter', quantityKg: '50.00', minThresholdKg: '25.00' },
      { farmId: farm.id, feedType: 'finisher', quantityKg: '75.00', minThresholdKg: '50.00' },
      { farmId: farm.id, feedType: 'fish_feed', quantityKg: '30.00', minThresholdKg: '15.00' },
    ]).execute()
    console.log('✅ Feed inventory set\n')

    // ============ SUMMARY ============
    console.log('═'.repeat(55))
    console.log('🎉 JAYFARMS KADUNA - REALISTIC SEED COMPLETE!')
    console.log('═'.repeat(55))
    console.log('\n📊 Farm Summary:')
    console.log('   🐔 Broiler Batches:')
    console.log(`      • Batch 1: ${batch1Size} → ${b1Alive} SOLD (5 weeks) @ ₦${b1SalePrice.toLocaleString()}`)
    console.log(`      • Batch 2: ${batch2Size} → ${b2Alive} SOLD (8 weeks) @ ₦${b2SalePrice.toLocaleString()}`)
    console.log(`      • Batch 3: ${batch3Size} → ${b3Alive} ACTIVE (6 weeks, ready for sale)`)
    console.log('   🐟 Catfish Batches:')
    console.log(`      • Batch 1: ${fishBatch1Size} → ${f1Alive} SOLD (${f1TotalKg.toFixed(0)}kg @ ₦3,500)`)
    console.log(`      • Batch 2: ${fishBatch2Size} → ${f2Alive} ACTIVE (4 months, harvest soon)`)
    console.log('\n💰 Revenue Generated:')
    console.log(`   • Broiler Sales: ₦${((b1Alive * b1SalePrice) + (b2Alive * b2SalePrice)).toLocaleString()}`)
    console.log(`   • Fish Sales: ₦${f1TotalAmount.toLocaleString()}`)
    console.log('\n🔐 Login: jay@jayfarms.com / admin123\n')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

seed()
