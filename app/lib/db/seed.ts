/**
 * Comprehensive Database Seed Script (Optimized with Batch Inserts)
 * Run with: bun run db:seed
 */

import { db } from './index'
import crypto from 'crypto'

// Web Crypto API password hashing
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const hashArray = new Uint8Array(hash)
  const combined = new Uint8Array(salt.length + hashArray.length)
  combined.set(salt)
  combined.set(hashArray, salt.length)
  return btoa(String.fromCharCode(...combined))
}

// Helpers
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)
const randomDateBetween = (daysAgoStart: number, daysAgoEnd: number) => {
  const start = daysAgo(daysAgoStart)
  const end = daysAgo(daysAgoEnd)
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function seed() {
  console.log('🌱 Starting COMPREHENSIVE database seed...\n')

  try {
    // ========== CLEANUP ==========
    console.log('🧹 Clearing existing data...')
    await db.deleteFrom('invoice_items').execute()
    await db.deleteFrom('invoices').execute()
    await db.deleteFrom('water_quality').execute()
    await db.deleteFrom('weight_samples').execute()
    await db.deleteFrom('treatments').execute()
    await db.deleteFrom('vaccinations').execute()
    await db.deleteFrom('egg_records').execute()
    await db.deleteFrom('mortality_records').execute()
    await db.deleteFrom('feed_records').execute()
    await db.deleteFrom('feed_inventory').execute()
    await db.deleteFrom('expenses').execute()
    await db.deleteFrom('sales').execute()
    await db.deleteFrom('batches').execute()
    await db.deleteFrom('user_farms').execute()
    await db.deleteFrom('farms').execute()
    await db.deleteFrom('suppliers').execute()
    await db.deleteFrom('customers').execute()
    await db.deleteFrom('sessions').execute()
    await db.deleteFrom('account').execute()
    await db.deleteFrom('users').execute()
    console.log('✅ Cleared\n')

    // ========== USERS ==========
    console.log('👤 Creating users...')
    const [adminUser, staffUser] = await db.insertInto('users').values([
      { email: 'admin@jayfarms.com', name: 'Jamal Ibrahim', role: 'admin', emailVerified: true },
      { email: 'staff@jayfarms.com', name: 'Chidi Okonkwo', role: 'staff', emailVerified: true },
    ]).returning(['id', 'email']).execute()

    await db.insertInto('account').values([
      { id: crypto.randomUUID(), userId: adminUser.id, accountId: adminUser.id, providerId: 'credential', password: await hashPassword('admin123') },
      { id: crypto.randomUUID(), userId: staffUser.id, accountId: staffUser.id, providerId: 'credential', password: await hashPassword('staff123') },
    ]).execute()
    console.log('✅ 2 users\n')

    // ========== SUPPLIERS ==========
    console.log('🏭 Creating suppliers...')
    const suppliers = await db.insertInto('suppliers').values([
      { name: 'AgroAllied Supplies Ltd', phone: '08012345678', location: 'Lagos', products: ['feed', 'medicine', 'equipment'] },
      { name: 'Ultima Feeds Nigeria', phone: '08023456789', location: 'Ibadan', products: ['feed'] },
      { name: 'VetCare Pharmaceuticals', phone: '08034567890', location: 'Abeokuta', products: ['medicine', 'vaccines'] },
      { name: 'FarmTech Equipment', phone: '08045678901', location: 'Lagos', products: ['equipment'] },
      { name: 'Aller Aqua Nigeria', phone: '08056789012', location: 'Port Harcourt', products: ['feed'] },
    ]).returning(['id', 'name']).execute()
    console.log(`✅ ${suppliers.length} suppliers\n`)

    // ========== CUSTOMERS ==========
    console.log('👥 Creating customers...')
    const customers = await db.insertInto('customers').values([
      { name: 'Mama Nkechi Frozen Foods', phone: '08098765432', location: 'Mile 12 Market, Lagos', email: 'nkechi@gmail.com' },
      { name: 'Alhaji Musa Poultry', phone: '08087654321', location: 'Kano', email: null },
      { name: 'ChopBar Restaurant Chain', phone: '08076543210', location: 'Victoria Island, Lagos', email: 'orders@chopbar.ng' },
      { name: 'FreshMart Supermarket', phone: '08065432109', location: 'Lekki, Lagos', email: 'procurement@freshmart.ng' },
      { name: 'Iya Basira Fish Market', phone: '08054321098', location: 'Epe, Lagos', email: null },
      { name: 'Golden Eggs Distributors', phone: '08043210987', location: 'Ibadan', email: 'goldeneggs@yahoo.com' },
      { name: 'Hotel Prestige', phone: '08032109876', location: 'Abuja', email: 'kitchen@hotelprestige.com' },
    ]).returning(['id', 'name']).execute()
    console.log(`✅ ${customers.length} customers\n`)

    // ========== FARMS ==========
    console.log('� Creating farms...')
    const farms = await db.insertInto('farms').values([
      { name: 'JayFarms Abeokuta', location: 'Abeokuta, Ogun State', type: 'mixed' },
      { name: 'JayFarms Ibadan', location: 'Ibadan, Oyo State', type: 'poultry' },
      { name: 'JayFarms Epe', location: 'Epe, Lagos State', type: 'fishery' },
    ]).returning(['id', 'name', 'type']).execute()

    const userFarmValues = farms.flatMap(f => [
      { userId: adminUser.id, farmId: f.id },
      { userId: staffUser.id, farmId: f.id },
    ])
    await db.insertInto('user_farms').values(userFarmValues).execute()
    console.log(`✅ ${farms.length} farms\n`)

    // ========== BATCHES ==========
    console.log('�🐟 Creating batches...')
    const batchValues: any[] = []
    for (const farm of farms) {
      if (farm.type === 'poultry' || farm.type === 'mixed') {
        batchValues.push(
          { farmId: farm.id, livestockType: 'poultry', species: 'Broiler', initialQuantity: 500, currentQuantity: 0, acquisitionDate: daysAgo(90), costPerUnit: '1200.00', totalCost: '600000.00', status: 'sold' },
          { farmId: farm.id, livestockType: 'poultry', species: 'Broiler', initialQuantity: 600, currentQuantity: 572, acquisitionDate: daysAgo(35), costPerUnit: '1350.00', totalCost: '810000.00', status: 'active' },
          { farmId: farm.id, livestockType: 'poultry', species: 'Layer', initialQuantity: 300, currentQuantity: 285, acquisitionDate: daysAgo(180), costPerUnit: '800.00', totalCost: '240000.00', status: 'active' },
        )
      }
      if (farm.type === 'fishery' || farm.type === 'mixed') {
        batchValues.push(
          { farmId: farm.id, livestockType: 'fish', species: 'Catfish', initialQuantity: 2000, currentQuantity: 0, acquisitionDate: daysAgo(200), costPerUnit: '150.00', totalCost: '300000.00', status: 'sold' },
          { farmId: farm.id, livestockType: 'fish', species: 'Catfish', initialQuantity: 3000, currentQuantity: 2820, acquisitionDate: daysAgo(90), costPerUnit: '180.00', totalCost: '540000.00', status: 'active' },
          { farmId: farm.id, livestockType: 'fish', species: 'Tilapia', initialQuantity: 1500, currentQuantity: 1420, acquisitionDate: daysAgo(120), costPerUnit: '100.00', totalCost: '150000.00', status: 'active' },
        )
      }
    }
    const batches = await db.insertInto('batches').values(batchValues).returning(['id', 'farmId', 'livestockType', 'species']).execute()
    console.log(`✅ ${batches.length} batches\n`)

    // ========== FEED INVENTORY ==========
    console.log('📦 Creating feed inventory...')
    const feedInvValues: any[] = []
    for (const farm of farms) {
      const types = farm.type === 'fishery' ? ['fish_feed'] : farm.type === 'poultry' ? ['starter', 'grower', 'finisher', 'layer_mash'] : ['starter', 'grower', 'finisher', 'layer_mash', 'fish_feed']
      for (const t of types) {
        feedInvValues.push({ farmId: farm.id, feedType: t, quantityKg: randomFloat(100, 500).toFixed(2), minThresholdKg: '50.00' })
      }
    }
    await db.insertInto('feed_inventory').values(feedInvValues).execute()
    console.log('✅ Feed inventory\n')

    // ========== MORTALITY (batch insert) ==========
    console.log('� Creating mortality records...')
    const mortalityValues: any[] = []
    const causes = ['disease', 'predator', 'weather', 'unknown', 'other']
    for (const batch of batches) {
      for (let i = 0; i < randomInt(5, 12); i++) {
        mortalityValues.push({
          batchId: batch.id, quantity: randomInt(1, 5), date: randomDateBetween(180, 1),
          cause: randomChoice(causes), notes: randomChoice(['Found dead', 'Heat stress', 'Unknown', null]),
        })
      }
    }
    await db.insertInto('mortality_records').values(mortalityValues).execute()
    console.log(`✅ ${mortalityValues.length} mortality records\n`)

    // ========== FEED RECORDS (batch insert) ==========
    console.log('🌾 Creating feed records...')
    const feedValues: any[] = []
    for (const batch of batches) {
      const types = batch.livestockType === 'poultry' ? ['starter', 'grower', 'finisher'] : ['fish_feed']
      for (let i = 0; i < randomInt(8, 15); i++) {
        feedValues.push({
          batchId: batch.id, feedType: randomChoice(types), quantityKg: randomFloat(20, 100).toFixed(2),
          cost: randomFloat(15000, 50000).toFixed(2), date: randomDateBetween(180, 1), supplierId: randomChoice(suppliers).id,
        })
      }
    }
    await db.insertInto('feed_records').values(feedValues).execute()
    console.log(`✅ ${feedValues.length} feed records\n`)

    // ========== EGG RECORDS (batch insert) ==========
    console.log('🥚 Creating egg records...')
    const eggValues: any[] = []
    const layerBatches = batches.filter(b => b.species === 'Layer')
    for (const batch of layerBatches) {
      for (let d = 90; d >= 1; d--) {
        const collected = randomInt(200, 280)
        eggValues.push({
          batchId: batch.id, date: daysAgo(d), quantityCollected: collected,
          quantityBroken: randomInt(2, 10), quantitySold: randomInt(150, collected - 10),
        })
      }
    }
    if (eggValues.length > 0) await db.insertInto('egg_records').values(eggValues).execute()
    console.log(`✅ ${eggValues.length} egg records\n`)

    // ========== WEIGHT SAMPLES (batch insert) ==========
    console.log('⚖️ Creating weight samples...')
    const weightValues: any[] = []
    for (const batch of batches) {
      for (let i = 0; i < randomInt(5, 10); i++) {
        weightValues.push({
          batchId: batch.id, date: randomDateBetween(150, 1), sampleSize: randomInt(10, 30),
          averageWeightKg: (batch.livestockType === 'poultry' ? randomFloat(0.5, 3.0) : randomFloat(0.3, 2.0)).toFixed(3),
        })
      }
    }
    await db.insertInto('weight_samples').values(weightValues).execute()
    console.log(`✅ ${weightValues.length} weight samples\n`)

    // ========== VACCINATIONS (batch insert) ==========
    console.log('💉 Creating vaccinations...')
    const vaccValues: any[] = []
    const vaccines = [
      { name: 'Newcastle Disease (Lasota)', dosage: '1 drop per bird' },
      { name: 'Gumboro (IBD)', dosage: '1 drop per bird' },
      { name: 'Fowl Pox', dosage: 'Wing web' },
    ]
    for (const batch of batches.filter(b => b.livestockType === 'poultry')) {
      for (const v of vaccines) {
        vaccValues.push({
          batchId: batch.id, vaccineName: v.name, dateAdministered: randomDateBetween(150, 30),
          dosage: v.dosage, nextDueDate: null, notes: 'Administered successfully',
        })
      }
    }
    if (vaccValues.length > 0) await db.insertInto('vaccinations').values(vaccValues).execute()
    console.log(`✅ ${vaccValues.length} vaccinations\n`)

    // ========== TREATMENTS (batch insert) ==========
    console.log('💊 Creating treatments...')
    const treatValues: any[] = []
    const treatments = [
      { med: 'Tylosin', reason: 'Respiratory infection', dosage: '1g per liter', withdrawal: 7 },
      { med: 'Amprolium', reason: 'Coccidiosis prevention', dosage: '0.5g per liter', withdrawal: 5 },
      { med: 'Vitamin supplement', reason: 'Stress recovery', dosage: '2ml per liter', withdrawal: 0 },
    ]
    for (const batch of batches) {
      for (let i = 0; i < randomInt(1, 3); i++) {
        const t = randomChoice(treatments)
        treatValues.push({
          batchId: batch.id, medicationName: t.med, reason: t.reason, date: randomDateBetween(120, 5),
          dosage: t.dosage, withdrawalDays: t.withdrawal, notes: 'Treatment completed',
        })
      }
    }
    await db.insertInto('treatments').values(treatValues).execute()
    console.log(`✅ ${treatValues.length} treatments\n`)

    // ========== WATER QUALITY (batch insert) ==========
    console.log('💧 Creating water quality...')
    const waterValues: any[] = []
    for (const batch of batches.filter(b => b.livestockType === 'fish')) {
      for (let w = 16; w >= 1; w--) {
        waterValues.push({
          batchId: batch.id, date: daysAgo(w * 7), ph: randomFloat(6.5, 8.5).toFixed(2),
          temperatureCelsius: randomFloat(25, 32).toFixed(2), dissolvedOxygenMgL: randomFloat(5, 9).toFixed(2),
          ammoniaMgL: randomFloat(0, 0.5).toFixed(3), notes: randomChoice(['Normal', 'Adjusted pH', null]),
        })
      }
    }
    if (waterValues.length > 0) await db.insertInto('water_quality').values(waterValues).execute()
    console.log(`✅ ${waterValues.length} water quality records\n`)

    // ========== EXPENSES (batch insert) ==========
    console.log('💸 Creating expenses...')
    const expenseValues: any[] = []
    const expCats = [
      { cat: 'feed', desc: 'Feed purchase', min: 50000, max: 200000 },
      { cat: 'medicine', desc: 'Medication', min: 5000, max: 30000 },
      { cat: 'equipment', desc: 'Equipment', min: 10000, max: 100000 },
      { cat: 'utilities', desc: 'Electricity/Water', min: 15000, max: 50000 },
      { cat: 'labor', desc: 'Staff wages', min: 50000, max: 150000 },
      { cat: 'transport', desc: 'Transport', min: 5000, max: 30000 },
    ]
    for (const farm of farms) {
      const farmBatches = batches.filter(b => b.farmId === farm.id)
      for (let m = 6; m >= 1; m--) {
        for (const e of expCats) {
          if (Math.random() > 0.25) {
            expenseValues.push({
              farmId: farm.id, batchId: randomChoice([null, ...farmBatches.map(b => b.id)]),
              category: e.cat, amount: randomFloat(e.min, e.max).toFixed(2), date: randomDateBetween(m * 30, (m - 1) * 30),
              description: e.desc, supplierId: e.cat === 'feed' ? randomChoice(suppliers).id : null, isRecurring: e.cat === 'utilities' || e.cat === 'labor',
            })
          }
        }
      }
    }
    await db.insertInto('expenses').values(expenseValues).execute()
    console.log(`✅ ${expenseValues.length} expenses\n`)

    // ========== SALES (batch insert) ==========
    console.log('💰 Creating sales...')
    const salesValues: any[] = []
    for (const farm of farms) {
      const farmBatches = batches.filter(b => b.farmId === farm.id)
      // Poultry sales
      for (const batch of farmBatches.filter(b => b.livestockType === 'poultry' && b.species === 'Broiler')) {
        for (let i = 0; i < randomInt(3, 6); i++) {
          const qty = randomInt(20, 100)
          const price = randomFloat(5000, 7000)
          salesValues.push({
            farmId: farm.id, batchId: batch.id, customerId: randomChoice(customers).id, livestockType: 'poultry',
            quantity: qty, unitPrice: price.toFixed(2), totalAmount: (qty * price).toFixed(2),
            date: randomDateBetween(90, 1), notes: randomChoice(['Cash', 'Delivered', null]),
          })
        }
      }
      // Egg sales
      for (const batch of farmBatches.filter(b => b.species === 'Layer')) {
        for (let i = 0; i < randomInt(15, 25); i++) {
          const qty = randomInt(5, 30)
          const price = randomFloat(2500, 3500)
          salesValues.push({
            farmId: farm.id, batchId: batch.id, customerId: randomChoice(customers).id, livestockType: 'eggs',
            quantity: qty, unitPrice: price.toFixed(2), totalAmount: (qty * price).toFixed(2),
            date: randomDateBetween(60, 1), notes: 'Crates',
          })
        }
      }
      // Fish sales
      for (const batch of farmBatches.filter(b => b.livestockType === 'fish')) {
        for (let i = 0; i < randomInt(3, 5); i++) {
          const qty = randomInt(50, 300)
          const price = batch.species === 'Catfish' ? randomFloat(3000, 4000) : randomFloat(2000, 2800)
          salesValues.push({
            farmId: farm.id, batchId: batch.id, customerId: randomChoice(customers).id, livestockType: 'fish',
            quantity: qty, unitPrice: price.toFixed(2), totalAmount: (qty * price).toFixed(2),
            date: randomDateBetween(120, 1), notes: `${batch.species} per kg`,
          })
        }
      }
    }
    await db.insertInto('sales').values(salesValues).execute()
    console.log(`✅ ${salesValues.length} sales\n`)

    // ========== INVOICES (batch insert) ==========
    console.log('📄 Creating invoices...')
    let invoiceCount = 0
    for (const farm of farms) {
      for (let i = 0; i < 10; i++) {
        const customer = randomChoice(customers)
        const invoiceDate = randomDateBetween(90, 1)
        const items = []
        let total = 0
        for (let j = 0; j < randomInt(1, 4); j++) {
          const itemType = randomChoice(['Broiler Chicken', 'Eggs (crate)', 'Catfish (kg)', 'Tilapia (kg)'])
          const qty = randomInt(5, 50)
          const price = itemType.includes('Chicken') ? randomFloat(5000, 7000) : itemType.includes('Eggs') ? randomFloat(2500, 3500) : randomFloat(2500, 4000)
          const itemTotal = qty * price
          total += itemTotal
          items.push({ description: itemType, quantity: qty, unitPrice: price.toFixed(2), total: itemTotal.toFixed(2) })
        }
        const invoice = await db.insertInto('invoices').values({
          invoiceNumber: `INV-${Date.now()}-${farm.id.slice(0, 4)}-${i}`,
          customerId: customer.id, farmId: farm.id, totalAmount: total.toFixed(2),
          status: randomChoice(['unpaid', 'partial', 'paid', 'paid', 'paid']),
          date: invoiceDate, dueDate: new Date(invoiceDate.getTime() + 14 * 24 * 60 * 60 * 1000), notes: null,
        }).returning(['id']).executeTakeFirstOrThrow()
        
        await db.insertInto('invoice_items').values(items.map(it => ({ invoiceId: invoice.id, ...it }))).execute()
        invoiceCount++
      }
    }
    console.log(`✅ ${invoiceCount} invoices\n`)

    // ========== SUMMARY ==========
    console.log('═'.repeat(50))
    console.log('🎉 COMPREHENSIVE SEED COMPLETED!')
    console.log('═'.repeat(50))
    console.log('\n🔐 Login:')
    console.log('   Admin: admin@jayfarms.com / admin123')
    console.log('   Staff: staff@jayfarms.com / staff123\n')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

seed()
