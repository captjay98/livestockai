/**
 * Database Seed Script
 *
 * Creates initial admin user and comprehensive sample data for development/testing.
 * Data includes multiple farms, realistic batches (poultry & fish), expenses,
 * feed records, mortality, and sales based on real-world scenarios.
 *
 * Run with: bun run db:seed
 */

import bcrypt from 'bcrypt'
import { db } from './index'
import crypto from 'crypto'

// --- Constants & Configuration ---

const POULTRY_CONFIG = {
  batchSizeMin: 50,
  batchSizeMax: 60,
  costPerChickMin: 900,
  costPerChickMax: 1500,
  salePricePerKg: 600, // as per user request
  targetWeightAtSale: 2.5, // kg, estimated for 5-6 weeks broiler
  survivalRateMin: 0.90,
  survivalRateMax: 0.95,
  feeds: [
    { name: 'Ultima Plus Starter', cost: 24000, weight: 25, type: 'starter' },
    { name: 'Ultima Plus Finisher', cost: 24000, weight: 25, type: 'finisher' },
  ]
}

const FISH_CONFIG = {
  batchSizeMin: 500,
  batchSizeMax: 600,
  costPerFingerlingMin: 200,
  costPerFingerlingMax: 250,
  salePricePerKg: 3500,
  targetWeightAtSale: 1.5, // kg
  survivalRateMin: 0.90,
  survivalRateMax: 0.95,
  feeds: [
    { name: 'Aller Aqua (2mm)', cost: 32000, weight: 15, type: 'fish_feed' }, // Estimating price/weight based on context
    { name: 'Blue Crown', cost: 38000, weight: 15, type: 'fish_feed' },
  ]
}

// --- Helper Utilities ---

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// --- Seeding Logic ---

async function seed() {
  console.log('🌱 Starting comprehensive database seed...')

  try {
    // 1. Cleanup - Clear existing data (reverse order of dependencies)
    console.log('🧹 Clearing existing data...')
    await db.deleteFrom('mortality_records').execute()
    await db.deleteFrom('feed_records').execute()
    await db.deleteFrom('expenses').execute()
    await db.deleteFrom('sales').execute()
    await db.deleteFrom('batches').execute()
    await db.deleteFrom('user_farms').execute()
    await db.deleteFrom('farms').execute()
    await db.deleteFrom('suppliers').execute()
    await db.deleteFrom('customers').execute()
    // We keep users and accounts to avoid re-hashing generally, but let's just ensure admin exists

    // 2. Setup Admin User
    let adminUserId: string

    const existingAdmin = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', 'admin@jayfarms.com')
      .executeTakeFirst()

    if (existingAdmin) {
      adminUserId = existingAdmin.id
      console.log('Found existing admin user.')
    } else {
      const adminUser = await db
        .insertInto('users')
        .values({
          email: 'admin@jayfarms.com',
          name: 'Admin User',
          role: 'admin',
          emailVerified: true,
        })
        .returning(['id', 'email'])
        .executeTakeFirstOrThrow()

      adminUserId = adminUser.id

      const hashedPassword = await hashPassword('admin123')
      await db
        .insertInto('account')
        .values({
          id: crypto.randomUUID(),
          userId: adminUserId,
          accountId: adminUserId,
          providerId: 'credential',
          password: hashedPassword,
        })
        .execute()
      console.log('✅ Created admin user.')
    }

    // 3. Create Farms
    const farms = []
    const farmConfigs = [
      { name: 'Green Valley Farms', location: 'Abeokuta, Ogun', type: 'mixed' as const },
      { name: 'Sunrise Poultry', location: 'Ibadan, Oyo', type: 'poultry' as const },
      { name: 'Blue Waters Fishery', location: 'Epe, Lagos', type: 'fishery' as const },
    ]

    for (const config of farmConfigs) {
      const farm = await db
        .insertInto('farms')
        .values({
          name: config.name,
          location: config.location,
          type: config.type,
        })
        .returning(['id', 'name', 'type'])
        .executeTakeFirstOrThrow()

      farms.push(farm)

      // Assign admin
      await db
        .insertInto('user_farms')
        .values({ userId: adminUserId, farmId: farm.id })
        .execute()
    }
    console.log(`✅ Created ${farms.length} farms.`)

    // 4. Create Suppliers & Customers
    const supplier = await db
      .insertInto('suppliers')
      .values({
        name: 'AgroAllied Supplies Ltd',
        phone: '08012345678',
        location: 'Lagos',
        products: ['feed', 'medicine'],
      })
      .returning(['id', 'name'])
      .executeTakeFirstOrThrow()

    const customer = await db
      .insertInto('customers')
      .values({
        name: 'Mama Nkechi Frozen Foods',
        phone: '08098765432',
        location: 'Market Sq, Lagos',
      })
      .returning(['id', 'name'])
      .executeTakeFirstOrThrow()

    console.log('✅ Created suppliers and customers.')

    // 5. Generate Batches & Transactional Data
    const startDate = new Date('2024-01-01')
    const endDate = new Date()

    for (const farm of farms) {
      // Determine what kind of batches to create based on farm type
      const createPoultry = farm.type === 'poultry' || farm.type === 'mixed'
      const createFish = farm.type === 'fishery' || farm.type === 'mixed'

      if (createPoultry) {
        // Create 2-3 Poultry Batches (some active, some sold)
        const numBatches = randomInt(2, 3)
        for (let i = 0; i < numBatches; i++) {
          const isSold = i === 0 // Make the first one sold/completed
          const acquisitionDate = randomDate(startDate, new Date(endDate.getTime() - (isSold ? 60 : 30) * 24 * 60 * 60 * 1000))

          const initialQty = randomInt(POULTRY_CONFIG.batchSizeMin, POULTRY_CONFIG.batchSizeMax)
          const costPerUnit = randomFloat(POULTRY_CONFIG.costPerChickMin, POULTRY_CONFIG.costPerChickMax)
          const totalCost = initialQty * costPerUnit

          // Calculate mortality
          const survivalRate = randomFloat(POULTRY_CONFIG.survivalRateMin, POULTRY_CONFIG.survivalRateMax)
          const targetSurvival = Math.floor(initialQty * survivalRate)
          const totalMortality = initialQty - targetSurvival
          const currentQty = isSold ? 0 : targetSurvival // If active, simplified for now (mortality subtracted later)

          const batch = await db
            .insertInto('batches')
            .values({
              farmId: farm.id,
              livestockType: 'poultry',
              species: 'Broiler',
              initialQuantity: initialQty,
              currentQuantity: isSold ? 0 : initialQty, // Start full, reduce with mortality events
              acquisitionDate: acquisitionDate,
              costPerUnit: costPerUnit.toFixed(2),
              totalCost: totalCost.toFixed(2),
              status: isSold ? 'sold' : 'active',
            })
            .returning(['id', 'acquisitionDate', 'currentQuantity'])
            .executeTakeFirstOrThrow()

          // Record acquisition expense
          await db.insertInto('expenses').values({
            farmId: farm.id,
            batchId: batch.id,
            category: 'other', // stocking
            description: `Purchase of ${initialQty} Broiler Chicks`,
            amount: totalCost.toFixed(2),
            date: acquisitionDate,
            isRecurring: false,
            supplierId: null
          }).execute()

          // Generate Mortality
          let currentBatchQty = initialQty
          for (let m = 0; m < totalMortality; m++) {
            // Spread mortality over first 4 weeks
            const mortalityDate = new Date(acquisitionDate.getTime() + randomInt(1, 28) * 24 * 60 * 60 * 1000)
            if (mortalityDate > endDate) continue

            await db.insertInto('mortality_records').values({
              batchId: batch.id,
              quantity: 1,
              date: mortalityDate,
              cause: Math.random() > 0.7 ? 'disease' : 'unknown',
              notes: 'Routine loss',
            }).execute()
            currentBatchQty--
          }

          // Generate Feed Expenses
          // Assume ~4kg feed per bird over 6 weeks. 
          // Simplified: Buy feed every 2 weeks.
          const weeksActive = isSold ? 6 : Math.floor((endDate.getTime() - acquisitionDate.getTime()) / (7 * 24 * 60 * 60 * 1000))

          for (let w = 0; w < weeksActive; w += 2) {
            const feed = w < 3 ? POULTRY_CONFIG.feeds[0] : POULTRY_CONFIG.feeds[1] // Starter vs Finisher
            const feedDate = new Date(acquisitionDate.getTime() + w * 7 * 24 * 60 * 60 * 1000)
            if (feedDate > endDate) continue

            // Estimate consumption: ~10 bags for a batch of 50-60 over lifetime? 
            // Let's say we buy 2 bags every 2 weeks.
            const quantityBags = 2
            const expenseAmount = quantityBags * feed.cost

            const expense = await db.insertInto('expenses')
              .values({
                farmId: farm.id,
                batchId: batch.id,
                category: 'feed',
                description: `${quantityBags} bags of ${feed.name}`,
                amount: expenseAmount.toFixed(2),
                date: feedDate,
                supplierId: supplier.id,
                isRecurring: false,
              })
              .returning(['id'])
              .executeTakeFirstOrThrow()

            // Corresponding feed record (consumption - simplified to match purchase for now)
            await db.insertInto('feed_records').values({
              batchId: batch.id,
              feedType: feed.type as any,
              quantityKg: (quantityBags * feed.weight).toFixed(2),
              cost: expenseAmount.toFixed(2),
              date: feedDate,
              supplierId: supplier.id
            }).execute()
          }

          // Sales (if sold)
          if (isSold) {
            const saleWeightTotal = currentBatchQty * POULTRY_CONFIG.targetWeightAtSale
            const saleAmount = saleWeightTotal * POULTRY_CONFIG.salePricePerKg

            await db.insertInto('sales').values({
              farmId: farm.id,
              batchId: batch.id,
              customerId: customer.id,
              livestockType: 'poultry',
              quantity: currentBatchQty,
              unitPrice: POULTRY_CONFIG.salePricePerKg.toFixed(2),
              totalAmount: saleAmount.toFixed(2),
              date: new Date(acquisitionDate.getTime() + 6 * 7 * 24 * 60 * 60 * 1000), // Sold at 6 weeks
              notes: 'Bulk sale to market'
            }).execute()

            // Update batch status/qty if needed (already set to 0/sold in creation, but sync just in case logic changes)
            await db.updateTable('batches').set({ currentQuantity: 0 }).where('id', '=', batch.id).execute()
          } else {
            // Update current qty
            await db.updateTable('batches').set({ currentQuantity: currentBatchQty }).where('id', '=', batch.id).execute()
          }
        }
      }

      if (createFish) {
        // Create 2 Fish Batches
        const numBatches = 2
        for (let i = 0; i < numBatches; i++) {
          const isSold = i === 0
          // Fish take longer (4-6 months).
          const acquisitionDate = randomDate(startDate, new Date(endDate.getTime() - (isSold ? 160 : 30) * 24 * 60 * 60 * 1000))

          const initialQty = randomInt(FISH_CONFIG.batchSizeMin, FISH_CONFIG.batchSizeMax)
          const costPerUnit = randomFloat(FISH_CONFIG.costPerFingerlingMin, FISH_CONFIG.costPerFingerlingMax)
          const totalCost = initialQty * costPerUnit

          const batch = await db
            .insertInto('batches')
            .values({
              farmId: farm.id,
              livestockType: 'fish',
              species: 'Catfish',
              initialQuantity: initialQty,
              currentQuantity: isSold ? 0 : initialQty,
              acquisitionDate: acquisitionDate,
              costPerUnit: costPerUnit.toFixed(2),
              totalCost: totalCost.toFixed(2),
              status: isSold ? 'sold' : 'active',
            })
            .returning(['id', 'acquisitionDate'])
            .executeTakeFirstOrThrow()


          // Stocking Expense
          await db.insertInto('expenses').values({
            farmId: farm.id,
            batchId: batch.id,
            category: 'other',
            description: `Purchase of ${initialQty} Catfish Fingerlings`,
            amount: totalCost.toFixed(2),
            date: acquisitionDate,
            isRecurring: false,
            supplierId: null
          }).execute()

          // Mortality
          let currentBatchQty = initialQty
          const survivalRate = randomFloat(FISH_CONFIG.survivalRateMin, FISH_CONFIG.survivalRateMax)
          const totalMortality = Math.floor(initialQty * (1 - survivalRate))

          for (let m = 0; m < totalMortality; m++) {
            const mortalityDate = new Date(acquisitionDate.getTime() + randomInt(1, 90) * 24 * 60 * 60 * 1000)
            if (mortalityDate > endDate) continue

            await db.insertInto('mortality_records').values({
              batchId: batch.id,
              quantity: 1,
              date: mortalityDate,
              cause: 'other',
              notes: 'Water quality stress',
            }).execute()
            currentBatchQty--
          }

          // Feed Expenses
          // Simply: Buy 5 bags every month.
          const monthsActive = isSold ? 5 : Math.floor((endDate.getTime() - acquisitionDate.getTime()) / (30 * 24 * 60 * 60 * 1000))

          for (let m = 1; m <= monthsActive; m++) {
            const feed = m < 2 ? FISH_CONFIG.feeds[0] : FISH_CONFIG.feeds[1] // Aller first, then Blue Crown
            const feedDate = new Date(acquisitionDate.getTime() + m * 30 * 24 * 60 * 60 * 1000)
            if (feedDate > endDate) continue

            const quantityBags = 5
            const expenseAmount = quantityBags * feed.cost

            await db.insertInto('expenses')
              .values({
                farmId: farm.id,
                batchId: batch.id,
                category: 'feed',
                description: `${quantityBags} bags of ${feed.name}`,
                amount: expenseAmount.toFixed(2),
                date: feedDate,
                supplierId: supplier.id,
                isRecurring: false,
              })
              .execute()

            await db.insertInto('feed_records').values({
              batchId: batch.id,
              feedType: 'fish_feed',
              quantityKg: (quantityBags * feed.weight).toFixed(2),
              cost: expenseAmount.toFixed(2),
              date: feedDate,
              supplierId: supplier.id
            }).execute()
          }

          if (isSold) {
            const saleWeightTotal = currentBatchQty * FISH_CONFIG.targetWeightAtSale
            const saleAmount = saleWeightTotal * FISH_CONFIG.salePricePerKg

            await db.insertInto('sales').values({
              farmId: farm.id,
              batchId: batch.id,
              customerId: customer.id,
              livestockType: 'fish',
              quantity: currentBatchQty,
              unitPrice: FISH_CONFIG.salePricePerKg.toFixed(2),
              totalAmount: saleAmount.toFixed(2),
              date: new Date(acquisitionDate.getTime() + 5 * 30 * 24 * 60 * 60 * 1000), // 5 months
              notes: 'Harvest sale'
            }).execute()

            await db.updateTable('batches').set({ currentQuantity: 0 }).where('id', '=', batch.id).execute()
          } else {
            await db.updateTable('batches').set({ currentQuantity: currentBatchQty }).where('id', '=', batch.id).execute()
          }
        }
      }
    }

    console.log('✅ Generated batches and transactions for all farms.')

    console.log('\n🎉 Comprehensive database seed completed!')
    console.log('   Email: admin@jayfarms.com')
    console.log('   Password: admin123')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error // Ensure the process exits with error code
  } finally {
    await db.destroy()
  }
}

seed()
