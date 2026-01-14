/**
 * Development/Demo Farm Seeder - OpenLivestock Manager
 * 
 * Creates 5 realistic Nigerian farms showcasing all 6 livestock types:
 * 1. Sunrise Poultry Farm (Kaduna) - Poultry only
 * 2. Blue Waters Fish Farm (Ibadan) - Aquaculture only  
 * 3. Green Valley Mixed Farm (Jos) - Poultry + Aquaculture
 * 4. Savanna Livestock Ranch (Kano) - Cattle + Goats + Sheep
 * 5. Golden Hive Apiary (Enugu) - Bees only
 * 
 * Run: bun run db:seed:dev
 */

import { db } from '../index'
import { createUserWithAuth } from './helpers'

// Default settings for Nigerian demo
const DEFAULT_SETTINGS = {
  currencyCode: 'NGN',
  currencySymbol: '₦',
  currencyDecimals: 2,
  currencySymbolPosition: 'before' as const,
  thousandSeparator: ',',
  decimalSeparator: '.',
  dateFormat: 'DD/MM/YYYY' as const,
  timeFormat: '24h' as const,
  firstDayOfWeek: 1,
  weightUnit: 'kg' as const,
  areaUnit: 'sqm' as const,
  temperatureUnit: 'celsius' as const,
  language: 'en' as const,
  theme: 'system' as const,
  lowStockThresholdPercent: 20,
  mortalityAlertPercent: 10,
  mortalityAlertQuantity: 5,
  notifications: {
    lowStock: true,
    highMortality: true,
    invoiceDue: true,
    batchHarvest: true,
  },
  defaultPaymentTermsDays: 30,
  fiscalYearStartMonth: 1,
  dashboardCards: {
    inventory: true,
    revenue: true,
    expenses: true,
    profit: true,
    mortality: true,
    feed: true,
  },
}

// ============ DATE HELPERS ============
const TODAY = new Date()
const daysAgo = (days: number) => new Date(TODAY.getTime() - days * 24 * 60 * 60 * 1000)
const monthsAgo = (months: number) => {
  const d = new Date(TODAY)
  d.setMonth(d.getMonth() - months)
  return d
}

// ============ RANDOM HELPERS ============
const pickPayment = () => {
  const r = Math.random()
  if (r < 0.6) return 'mobile_money' // 60% - MTN/Airtel Money
  if (r < 0.9) return 'cash' // 30%
  return 'transfer' // 10%
}

// ============ MAIN SEED ============
export async function seedDev() {
  console.log('🌱 Seeding OpenLivestock Demo Data (5 Nigerian Farms)\n')
  console.log(`📅 Reference date: ${TODAY.toISOString().split('T')[0]}\n`)

  try {
    // ============ CLEANUP ============
    console.log('🧹 Clearing existing data...')
    const tables = [
      'notifications',
      'invoice_items',
      'invoices',
      'sales',
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
      'batches',
      'structures',
      'farm_modules',
      'user_farms',
      'farms',
      'suppliers',
      'customers',
      'user_settings',
      'sessions',
      'account',
      'users',
    ]
    for (const t of tables) await db.deleteFrom(t as any).execute()
    console.log('✅ Cleared\n')

    // ============ USER ============
    console.log('👤 Creating farm owner...')
    const user = await createUserWithAuth(db, {
      email: 'admin@openlivestock.local',
      password: 'password123',
      name: 'Farm Administrator',
      role: 'admin',
    })
    console.log('  ✅ Admin user created\n')

    // ============ USER SETTINGS (NGN) ============
    console.log('⚙️  Creating user settings...')
    await db
      .insertInto('user_settings')
      .values({
        userId: user.userId,
        ...DEFAULT_SETTINGS,
        currencyCode: 'NGN',
        currencySymbol: '₦',
        dateFormat: 'DD/MM/YYYY',
      })
      .execute()
    console.log('  ✅ User settings (NGN)\n')

    // ============ SUPPLIERS ============
    console.log('🏪 Creating suppliers...')
    const suppliers = await db
      .insertInto('suppliers')
      .values([
        {
          name: 'Zartech Hatchery',
          phone: '+234-803-123-4567',
          email: 'sales@zartech.ng',
          location: 'Ibadan, Oyo State',
          products: ['Day-old chicks', 'Point-of-lay pullets'],
          supplierType: 'hatchery',
        },
        {
          name: 'Aller Aqua Nigeria',
          phone: '+234-805-234-5678',
          email: 'info@alleraqua.ng',
          location: 'Lagos',
          products: ['Fish feed', 'Catfish fingerlings'],
          supplierType: 'fingerlings',
        },
        {
          name: 'Animal Care Pharmacy',
          phone: '+234-807-345-6789',
          email: 'orders@animalcare.ng',
          location: 'Kaduna',
          products: ['Vaccines', 'Antibiotics', 'Vitamins'],
          supplierType: 'pharmacy',
        },
        {
          name: 'Fulani Cattle Traders',
          phone: '+234-809-456-7890',
          location: 'Kano',
          products: ['Cattle', 'Goats', 'Sheep'],
          supplierType: 'cattle_dealer',
        },
        {
          name: 'Bee Supplies Nigeria',
          phone: '+234-811-567-8901',
          email: 'info@beesupplies.ng',
          location: 'Enugu',
          products: ['Bee colonies', 'Hive equipment', 'Bee feed'],
          supplierType: 'bee_supplier',
        },
      ])
      .returningAll()
      .execute()
    console.log(`  ✅ ${suppliers.length} suppliers\n`)

    // ============ CUSTOMERS ============
    console.log('👥 Creating customers...')
    const customers = await db
      .insertInto('customers')
      .values([
        // Poultry customers
        {
          name: 'Mama Ngozi',
          phone: '+234-802-111-2222',
          location: 'Kaduna Market',
          customerType: 'individual',
        },
        {
          name: 'Chicken Republic',
          phone: '+234-803-222-3333',
          email: 'procurement@chickenrepublic.ng',
          location: 'Abuja',
          customerType: 'restaurant',
        },
        {
          name: 'Shoprite Kaduna',
          phone: '+234-804-333-4444',
          email: 'meat@shoprite.ng',
          location: 'Kaduna',
          customerType: 'retailer',
        },
        // Fish customers
        {
          name: 'Yellow Chilli Restaurant',
          phone: '+234-805-444-5555',
          email: 'chef@yellowchilli.ng',
          location: 'Ibadan',
          customerType: 'restaurant',
        },
        {
          name: 'Fish Wholesalers Ltd',
          phone: '+234-806-555-6666',
          location: 'Lagos',
          customerType: 'wholesaler',
        },
        // Livestock customers
        {
          name: 'Kano Abattoir',
          phone: '+234-807-666-7777',
          location: 'Kano',
          customerType: 'processor',
        },
        {
          name: 'Federal Ministry of Agriculture',
          phone: '+234-808-777-8888',
          email: 'procurement@fmard.gov.ng',
          location: 'Abuja',
          customerType: 'government',
        },
        // Honey customers
        {
          name: 'Organic Health Store',
          phone: '+234-809-888-9999',
          email: 'orders@organichealth.ng',
          location: 'Enugu',
          customerType: 'retailer',
        },
      ])
      .returningAll()
      .execute()
    console.log(`  ✅ ${customers.length} customers\n`)

    // ============ FARM 1: SUNRISE POULTRY (KADUNA) ============
    console.log('🏡 Creating Farm 1: Sunrise Poultry Farm (Kaduna)...')
    const farm1 = await db
      .insertInto('farms')
      .values({
        name: 'Sunrise Poultry Farm',
        location: 'Kaduna, Kaduna State',
        type: 'poultry',
        contactPhone: '+234-803-100-0001',
        notes: 'Specialized broiler and layer production',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({ userId: user.userId, farmId: farm1.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([{ farmId: farm1.id, moduleKey: 'poultry', enabled: true }])
      .execute()

    // Structures
    const f1Structures = await db
      .insertInto('structures')
      .values([
        {
          farmId: farm1.id,
          name: 'Deep Litter House A',
          type: 'house',
          capacity: 200,
          areaSqm: '100.00',
          status: 'active',
        },
        {
          farmId: farm1.id,
          name: 'Deep Litter House B',
          type: 'house',
          capacity: 150,
          areaSqm: '75.00',
          status: 'active',
        },
        {
          farmId: farm1.id,
          name: 'Battery Cage Unit',
          type: 'cage',
          capacity: 300,
          areaSqm: '50.00',
          status: 'active',
        },
      ])
      .returningAll()
      .execute()

    // Batch 1: Broiler (8 weeks old, ready for sale)
    const f1b1 = await db
      .insertInto('batches')
      .values({
        farmId: farm1.id,
        batchName: 'BR-JAN-001',
        livestockType: 'poultry',
        species: 'broiler',
        sourceSize: 'day-old',
        initialQuantity: 100,
        currentQuantity: 92,
        acquisitionDate: daysAgo(56), // 8 weeks ago
        costPerUnit: '850.00',
        totalCost: '85000.00',
        status: 'active',
        structureId: f1Structures[0].id,
        supplierId: suppliers[0].id,
        targetHarvestDate: TODAY,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Mortality for Batch 1
    await db
      .insertInto('mortality_records')
      .values([
        {
          batchId: f1b1.id,
          quantity: 5,
          date: daysAgo(50),
          cause: 'disease',
          notes: 'Coccidiosis outbreak',
        },
        {
          batchId: f1b1.id,
          quantity: 2,
          date: daysAgo(30),
          cause: 'suffocation',
          notes: 'Overcrowding during heat wave',
        },
        {
          batchId: f1b1.id,
          quantity: 1,
          date: daysAgo(10),
          cause: 'injury',
        },
      ])
      .execute()

    // Feed for Batch 1
    await db
      .insertInto('feed_records')
      .values([
        {
          batchId: f1b1.id,
          feedType: 'starter',
          brandName: 'Vital Feed',
          quantityKg: '50.00',
          cost: '30000.00',
          date: daysAgo(55),
          supplierId: suppliers[0].id,
        },
        {
          batchId: f1b1.id,
          feedType: 'grower',
          brandName: 'Vital Feed',
          quantityKg: '100.00',
          cost: '55000.00',
          date: daysAgo(35),
          supplierId: suppliers[0].id,
        },
        {
          batchId: f1b1.id,
          feedType: 'finisher',
          brandName: 'Vital Feed',
          quantityKg: '150.00',
          cost: '75000.00',
          date: daysAgo(15),
          supplierId: suppliers[0].id,
        },
      ])
      .execute()

    // Vaccinations for Batch 1
    await db
      .insertInto('vaccinations')
      .values([
        {
          batchId: f1b1.id,
          vaccineName: 'Newcastle Disease (Lasota)',
          dateAdministered: daysAgo(49),
          dosage: '1 drop per bird',
          nextDueDate: daysAgo(35),
        },
        {
          batchId: f1b1.id,
          vaccineName: 'Gumboro',
          dateAdministered: daysAgo(42),
          dosage: '1 drop per bird',
        },
      ])
      .execute()

    // Weight samples for Batch 1
    await db
      .insertInto('weight_samples')
      .values([
        {
          batchId: f1b1.id,
          date: daysAgo(42),
          sampleSize: 10,
          averageWeightKg: '0.350',
          minWeightKg: '0.300',
          maxWeightKg: '0.400',
        },
        {
          batchId: f1b1.id,
          date: daysAgo(28),
          sampleSize: 10,
          averageWeightKg: '0.850',
          minWeightKg: '0.750',
          maxWeightKg: '0.950',
        },
        {
          batchId: f1b1.id,
          date: daysAgo(14),
          sampleSize: 10,
          averageWeightKg: '1.500',
          minWeightKg: '1.350',
          maxWeightKg: '1.650',
        },
        {
          batchId: f1b1.id,
          date: daysAgo(7),
          sampleSize: 10,
          averageWeightKg: '2.100',
          minWeightKg: '1.900',
          maxWeightKg: '2.300',
        },
      ])
      .execute()

    // Sales for Batch 1
    const f1b1Sale = await db
      .insertInto('sales')
      .values({
        farmId: farm1.id,
        batchId: f1b1.id,
        customerId: customers[1].id, // Chicken Republic
        livestockType: 'poultry',
        quantity: 50,
        unitPrice: '5500.00',
        totalAmount: '275000.00',
        unitType: 'bird',
        ageWeeks: 8,
        averageWeightKg: '2.100',
        paymentStatus: 'paid',
        paymentMethod: pickPayment(),
        date: daysAgo(3),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Invoice for sale
    const f1Invoice1 = await db
      .insertInto('invoices')
      .values({
        invoiceNumber: 'INV-2026-001',
        customerId: customers[1].id,
        farmId: farm1.id,
        totalAmount: '275000.00',
        status: 'paid',
        date: daysAgo(3),
        dueDate: daysAgo(-7),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('invoice_items')
      .values({
        invoiceId: f1Invoice1.id,
        description: '50 broilers @ 8 weeks (2.1kg avg)',
        quantity: 50,
        unitPrice: '5500.00',
        total: '275000.00',
      })
      .execute()

    // Link sale to invoice
    await db
      .updateTable('sales')
      .set({ invoiceId: f1Invoice1.id })
      .where('id', '=', f1b1Sale.id)
      .execute()

    console.log('  ✅ Farm 1: Sunrise Poultry (1 broiler batch)\n')

    // ============ EXPENSES ============
    console.log('💰 Creating expenses...')
    await db
      .insertInto('expenses')
      .values([
        {
          farmId: farm1.id,
          batchId: f1b1.id,
          category: 'livestock_chicken',
          amount: '85000.00',
          date: daysAgo(56),
          description: '100 day-old chicks',
          supplierId: suppliers[0].id,
          isRecurring: false,
        },
        {
          farmId: farm1.id,
          batchId: f1b1.id,
          category: 'feed',
          amount: '160000.00',
          date: daysAgo(40),
          description: 'Feed (starter, grower, finisher)',
          supplierId: suppliers[0].id,
          isRecurring: false,
        },
        {
          farmId: farm1.id,
          batchId: f1b1.id,
          category: 'medicine',
          amount: '15000.00',
          date: daysAgo(49),
          description: 'Vaccines and vitamins',
          supplierId: suppliers[2].id,
          isRecurring: false,
        },
        {
          farmId: farm1.id,
          category: 'utilities',
          amount: '25000.00',
          date: daysAgo(30),
          description: 'Electricity bill',
          isRecurring: true,
        },
        {
          farmId: farm1.id,
          category: 'labor',
          amount: '60000.00',
          date: daysAgo(30),
          description: 'Farm worker salary',
          isRecurring: true,
        },
      ])
      .execute()
    console.log('  ✅ Expenses created\n')

    // ============ INVENTORY ============
    console.log('📦 Creating inventory...')
    await db
      .insertInto('feed_inventory')
      .values([
        {
          farmId: farm1.id,
          feedType: 'starter',
          quantityKg: '25.00',
          minThresholdKg: '50.00',
        },
        {
          farmId: farm1.id,
          feedType: 'finisher',
          quantityKg: '100.00',
          minThresholdKg: '100.00',
        },
      ])
      .execute()

    await db
      .insertInto('medication_inventory')
      .values([
        {
          farmId: farm1.id,
          medicationName: 'Newcastle Vaccine',
          quantity: 5,
          unit: 'vial',
          expiryDate: new Date('2026-12-31'),
          minThreshold: 10,
        },
        {
          farmId: farm1.id,
          medicationName: 'Antibiotics (Oxytetracycline)',
          quantity: 3,
          unit: 'bottle',
          expiryDate: new Date('2026-06-30'),
          minThreshold: 5,
        },
      ])
      .execute()
    console.log('  ✅ Inventory created\n')

    // ============ NOTIFICATIONS ============
    console.log('🔔 Creating notifications...')
    await db
      .insertInto('notifications')
      .values([
        {
          userId: user.userId,
          farmId: farm1.id,
          type: 'lowStock',
          title: 'Low Feed Stock',
          message: 'Starter feed is below minimum threshold (25kg / 50kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: { feedType: 'starter', currentKg: 25, minKg: 50 },
        },
        {
          userId: user.userId,
          farmId: farm1.id,
          type: 'batchHarvest',
          title: 'Batch Ready for Harvest',
          message: 'BR-JAN-001 has reached target harvest date',
          read: false,
          actionUrl: `/batches/${f1b1.id}`,
          metadata: { batchId: f1b1.id, batchName: 'BR-JAN-001' },
        },
      ])
      .execute()
    console.log('  ✅ Notifications created\n')

    // ============ FARM 2: BLUE WATERS FISH (IBADAN) ============
    console.log('🏡 Creating Farm 2: Blue Waters Fish Farm (Ibadan)...')
    const farm2 = await db
      .insertInto('farms')
      .values({
        name: 'Blue Waters Fish Farm',
        location: 'Ibadan, Oyo State',
        type: 'fishery',
        contactPhone: '+234-805-200-0002',
        notes: 'Catfish and tilapia production using tarpaulin ponds',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({ userId: user.userId, farmId: farm2.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([{ farmId: farm2.id, moduleKey: 'aquaculture', enabled: true }])
      .execute()

    // Structures - tarpaulin ponds (Nigerian favorite)
    const f2Structures = await db
      .insertInto('structures')
      .values([
        {
          farmId: farm2.id,
          name: 'Tarpaulin Pond 1',
          type: 'tarpaulin',
          capacity: 1000,
          areaSqm: '120.00',
          status: 'active',
        },
        {
          farmId: farm2.id,
          name: 'Tarpaulin Pond 2',
          type: 'tarpaulin',
          capacity: 800,
          areaSqm: '100.00',
          status: 'active',
        },
        {
          farmId: farm2.id,
          name: 'Concrete Pond',
          type: 'pond',
          capacity: 1500,
          areaSqm: '200.00',
          status: 'active',
        },
      ])
      .returningAll()
      .execute()

    // Batch: Catfish (4 months old)
    const f2b1 = await db
      .insertInto('batches')
      .values({
        farmId: farm2.id,
        batchName: 'CF-OCT-001',
        livestockType: 'fish',
        species: 'catfish',
        sourceSize: 'fingerling',
        initialQuantity: 800,
        currentQuantity: 720,
        acquisitionDate: monthsAgo(4),
        costPerUnit: '50.00',
        totalCost: '40000.00',
        status: 'active',
        structureId: f2Structures[0].id,
        supplierId: suppliers[1].id,
        targetHarvestDate: monthsAgo(-1),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Mortality
    await db
      .insertInto('mortality_records')
      .values([
        { batchId: f2b1.id, quantity: 50, date: monthsAgo(3), cause: 'disease', notes: 'Fungal infection' },
        { batchId: f2b1.id, quantity: 30, date: monthsAgo(1), cause: 'predator', notes: 'Snake attack' },
      ])
      .execute()

    // Feed
    await db
      .insertInto('feed_records')
      .values([
        {
          batchId: f2b1.id,
          feedType: 'fish_feed',
          brandName: 'Aller Aqua 2mm',
          quantityKg: '200.00',
          cost: '180000.00',
          date: monthsAgo(3),
          supplierId: suppliers[1].id,
        },
      ])
      .execute()

    // Water quality
    await db
      .insertInto('water_quality')
      .values([
        {
          batchId: f2b1.id,
          date: daysAgo(7),
          ph: '7.20',
          temperatureCelsius: '28.50',
          dissolvedOxygenMgL: '6.50',
          ammoniaMgL: '0.15',
        },
      ])
      .execute()

    // Weight samples
    await db
      .insertInto('weight_samples')
      .values([
        { batchId: f2b1.id, date: monthsAgo(2), sampleSize: 20, averageWeightKg: '0.250' },
        { batchId: f2b1.id, date: monthsAgo(1), sampleSize: 20, averageWeightKg: '0.650' },
        { batchId: f2b1.id, date: daysAgo(7), sampleSize: 20, averageWeightKg: '1.100' },
      ])
      .execute()

    // Sales
    await db
      .insertInto('sales')
      .values({
        farmId: farm2.id,
        batchId: f2b1.id,
        customerId: customers[3].id, // Yellow Chilli Restaurant
        livestockType: 'fish',
        quantity: 200,
        unitPrice: '3500.00',
        totalAmount: '700000.00',
        unitType: 'kg',
        averageWeightKg: '1.100',
        paymentStatus: 'paid',
        paymentMethod: pickPayment(),
        date: daysAgo(5),
      })
      .execute()

    console.log('  ✅ Farm 2: Blue Waters Fish (1 catfish batch)\n')

    // ============ FARM 3: GREEN VALLEY MIXED (JOS) ============
    console.log('🏡 Creating Farm 3: Green Valley Mixed Farm (Jos)...')
    const farm3 = await db
      .insertInto('farms')
      .values({
        name: 'Green Valley Mixed Farm',
        location: 'Jos, Plateau State',
        type: 'mixed',
        contactPhone: '+234-807-300-0003',
        notes: 'Integrated poultry and fish farming',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({ userId: user.userId, farmId: farm3.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([
        { farmId: farm3.id, moduleKey: 'poultry', enabled: true },
        { farmId: farm3.id, moduleKey: 'aquaculture', enabled: true },
      ])
      .execute()

    const f3Structures = await db
      .insertInto('structures')
      .values([
        { farmId: farm3.id, name: 'Broiler House', type: 'house', capacity: 100, areaSqm: '60.00', status: 'active' },
        { farmId: farm3.id, name: 'Fish Pond', type: 'tarpaulin', capacity: 500, areaSqm: '80.00', status: 'active' },
      ])
      .returningAll()
      .execute()

    // Broiler batch
    const f3b1 = await db
      .insertInto('batches')
      .values({
        farmId: farm3.id,
        batchName: 'BR-DEC-001',
        livestockType: 'poultry',
        species: 'broiler',
        sourceSize: 'day-old',
        initialQuantity: 80,
        currentQuantity: 75,
        acquisitionDate: daysAgo(42),
        costPerUnit: '850.00',
        totalCost: '68000.00',
        status: 'active',
        structureId: f3Structures[0].id,
        supplierId: suppliers[0].id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db.insertInto('mortality_records').values({ batchId: f3b1.id, quantity: 5, date: daysAgo(35), cause: 'disease' }).execute()
    await db.insertInto('feed_records').values({ batchId: f3b1.id, feedType: 'starter', quantityKg: '40.00', cost: '24000.00', date: daysAgo(40), supplierId: suppliers[0].id }).execute()
    await db.insertInto('weight_samples').values({ batchId: f3b1.id, date: daysAgo(21), sampleSize: 10, averageWeightKg: '1.200' }).execute()

    // Catfish batch
    const f3b2 = await db
      .insertInto('batches')
      .values({
        farmId: farm3.id,
        batchName: 'CF-NOV-001',
        livestockType: 'fish',
        species: 'catfish',
        sourceSize: 'fingerling',
        initialQuantity: 500,
        currentQuantity: 460,
        acquisitionDate: monthsAgo(3),
        costPerUnit: '50.00',
        totalCost: '25000.00',
        status: 'active',
        structureId: f3Structures[1].id,
        supplierId: suppliers[1].id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db.insertInto('mortality_records').values({ batchId: f3b2.id, quantity: 40, date: monthsAgo(2), cause: 'disease' }).execute()
    await db.insertInto('feed_records').values({ batchId: f3b2.id, feedType: 'fish_feed', quantityKg: '100.00', cost: '90000.00', date: monthsAgo(2), supplierId: suppliers[1].id }).execute()
    await db.insertInto('water_quality').values({ batchId: f3b2.id, date: daysAgo(3), ph: '7.00', temperatureCelsius: '27.00', dissolvedOxygenMgL: '6.00', ammoniaMgL: '0.20' }).execute()

    console.log('  ✅ Farm 3: Green Valley Mixed (1 broiler, 1 catfish)\n')

    // ============ FARM 4: SAVANNA LIVESTOCK (KANO) ============
    console.log('🏡 Creating Farm 4: Savanna Livestock Ranch (Kano)...')
    const farm4 = await db
      .insertInto('farms')
      .values({
        name: 'Savanna Livestock Ranch',
        location: 'Kano, Kano State',
        type: 'cattle',
        contactPhone: '+234-809-400-0004',
        notes: 'Traditional livestock farming - cattle, goats, sheep',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({ userId: user.userId, farmId: farm4.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([
        { farmId: farm4.id, moduleKey: 'cattle', enabled: true },
        { farmId: farm4.id, moduleKey: 'goats', enabled: true },
        { farmId: farm4.id, moduleKey: 'sheep', enabled: true },
      ])
      .execute()

    const f4Structures = await db
      .insertInto('structures')
      .values([
        { farmId: farm4.id, name: 'Traditional Kraal', type: 'kraal', capacity: 50, areaSqm: '200.00', status: 'active' },
        { farmId: farm4.id, name: 'Shelter Barn', type: 'barn', capacity: 100, areaSqm: '150.00', status: 'active' },
        { farmId: farm4.id, name: 'Grazing Pasture A', type: 'pasture', capacity: 200, areaSqm: '5000.00', status: 'active' },
      ])
      .returningAll()
      .execute()

    // Cattle batch
    const f4b1 = await db
      .insertInto('batches')
      .values({
        farmId: farm4.id,
        batchName: 'CATTLE-2025',
        livestockType: 'cattle',
        species: 'white_fulani',
        sourceSize: 'calf',
        initialQuantity: 10,
        currentQuantity: 10,
        acquisitionDate: monthsAgo(6),
        costPerUnit: '150000.00',
        totalCost: '1500000.00',
        status: 'active',
        structureId: f4Structures[2].id,
        supplierId: suppliers[3].id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db.insertInto('feed_records').values({ batchId: f4b1.id, feedType: 'cattle_feed', quantityKg: '500.00', cost: '200000.00', date: monthsAgo(3), supplierId: suppliers[3].id }).execute()
    await db.insertInto('weight_samples').values({ batchId: f4b1.id, date: monthsAgo(3), sampleSize: 10, averageWeightKg: '180.000' }).execute()
    await db.insertInto('treatments').values({ batchId: f4b1.id, medicationName: 'Ivermectin', reason: 'Deworming', date: monthsAgo(4), dosage: '1ml per 50kg', withdrawalDays: 28 }).execute()

    // Sales - sold by head (industry standard)
    await db
      .insertInto('sales')
      .values({
        farmId: farm4.id,
        batchId: f4b1.id,
        customerId: customers[5].id, // Kano Abattoir (processor)
        livestockType: 'cattle',
        quantity: 2,
        unitPrice: '250000.00',
        totalAmount: '500000.00',
        unitType: 'head',
        averageWeightKg: '200.000',
        paymentStatus: 'paid',
        paymentMethod: pickPayment(),
        date: daysAgo(10),
      })
      .execute()

    // Goats batch
    const f4b2 = await db
      .insertInto('batches')
      .values({
        farmId: farm4.id,
        batchName: 'GOATS-2025',
        livestockType: 'goats',
        species: 'red_sokoto',
        sourceSize: 'kid',
        initialQuantity: 25,
        currentQuantity: 24,
        acquisitionDate: monthsAgo(4),
        costPerUnit: '15000.00',
        totalCost: '375000.00',
        status: 'active',
        structureId: f4Structures[0].id,
        supplierId: suppliers[3].id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db.insertInto('mortality_records').values({ batchId: f4b2.id, quantity: 1, date: monthsAgo(2), cause: 'injury' }).execute()
    await db.insertInto('feed_records').values({ batchId: f4b2.id, feedType: 'goat_feed', quantityKg: '200.00', cost: '80000.00', date: monthsAgo(2) }).execute()

    console.log('  ✅ Farm 4: Savanna Livestock (cattle, goats)\n')

    // ============ FARM 5: GOLDEN HIVE APIARY (ENUGU) ============
    console.log('🏡 Creating Farm 5: Golden Hive Apiary (Enugu)...')
    const farm5 = await db
      .insertInto('farms')
      .values({
        name: 'Golden Hive Apiary',
        location: 'Enugu, Enugu State',
        type: 'bees',
        contactPhone: '+234-811-500-0005',
        notes: 'Honey and beeswax production',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({ userId: user.userId, farmId: farm5.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([{ farmId: farm5.id, moduleKey: 'bees', enabled: true }])
      .execute()

    const f5Structures = await db
      .insertInto('structures')
      .values([
        { farmId: farm5.id, name: 'Hive Row 1', type: 'hive', capacity: 5, areaSqm: '10.00', status: 'active' },
        { farmId: farm5.id, name: 'Hive Row 2', type: 'hive', capacity: 5, areaSqm: '10.00', status: 'active' },
      ])
      .returningAll()
      .execute()

    // Bee colony
    const f5b1 = await db
      .insertInto('batches')
      .values({
        farmId: farm5.id,
        batchName: 'COLONY-A',
        livestockType: 'bees',
        species: 'apis_mellifera',
        sourceSize: 'nuc',
        initialQuantity: 1,
        currentQuantity: 1,
        acquisitionDate: monthsAgo(8),
        costPerUnit: '50000.00',
        totalCost: '50000.00',
        status: 'active',
        structureId: f5Structures[0].id,
        supplierId: suppliers[4].id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db.insertInto('feed_records').values({ batchId: f5b1.id, feedType: 'bee_feed', quantityKg: '5.00', cost: '10000.00', date: monthsAgo(6) }).execute()

    // Honey sales - sold by liter
    await db
      .insertInto('sales')
      .values({
        farmId: farm5.id,
        batchId: f5b1.id,
        customerId: customers[7].id, // Organic Health Store
        livestockType: 'honey',
        quantity: 20,
        unitPrice: '5000.00',
        totalAmount: '100000.00',
        unitType: 'liter',
        paymentStatus: 'paid',
        paymentMethod: pickPayment(),
        date: daysAgo(15),
      })
      .execute()

    // Beeswax sales - sold by kg
    await db
      .insertInto('sales')
      .values({
        farmId: farm5.id,
        batchId: f5b1.id,
        customerId: customers[7].id,
        livestockType: 'beeswax',
        quantity: 5,
        unitPrice: '8000.00',
        totalAmount: '40000.00',
        unitType: 'kg',
        paymentStatus: 'paid',
        paymentMethod: pickPayment(),
        date: daysAgo(15),
      })
      .execute()

    console.log('  ✅ Farm 5: Golden Hive Apiary (1 bee colony)\n')

    // ============ ADDITIONAL INVENTORY FOR ALL FARMS ============
    console.log('📦 Adding inventory for all farms...')
    await db
      .insertInto('feed_inventory')
      .values([
        { farmId: farm2.id, feedType: 'fish_feed', quantityKg: '150.00', minThresholdKg: '200.00' },
        { farmId: farm3.id, feedType: 'starter', quantityKg: '30.00', minThresholdKg: '50.00' },
        { farmId: farm3.id, feedType: 'fish_feed', quantityKg: '80.00', minThresholdKg: '100.00' },
        { farmId: farm4.id, feedType: 'cattle_feed', quantityKg: '300.00', minThresholdKg: '500.00' },
        { farmId: farm4.id, feedType: 'goat_feed', quantityKg: '100.00', minThresholdKg: '150.00' },
        { farmId: farm5.id, feedType: 'bee_feed', quantityKg: '3.00', minThresholdKg: '5.00' },
      ])
      .execute()

    await db
      .insertInto('medication_inventory')
      .values([
        { farmId: farm2.id, medicationName: 'Malachite Green', quantity: 2, unit: 'bottle', expiryDate: new Date('2026-08-31'), minThreshold: 5 },
        { farmId: farm4.id, medicationName: 'Ivermectin', quantity: 10, unit: 'vial', expiryDate: new Date('2027-01-31'), minThreshold: 15 },
        { farmId: farm4.id, medicationName: 'Antibiotics', quantity: 5, unit: 'bottle', expiryDate: new Date('2026-09-30'), minThreshold: 10 },
      ])
      .execute()
    console.log('  ✅ Inventory added\n')

    // ============ ADDITIONAL NOTIFICATIONS ============
    console.log('🔔 Adding notifications for all farms...')
    await db
      .insertInto('notifications')
      .values([
        {
          userId: user.userId,
          farmId: farm2.id,
          type: 'lowStock',
          title: 'Low Fish Feed Stock',
          message: 'Fish feed is below minimum threshold (150kg / 200kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: { feedType: 'fish_feed', currentKg: 150, minKg: 200 },
        },
        {
          userId: user.userId,
          farmId: farm4.id,
          type: 'lowStock',
          title: 'Low Cattle Feed Stock',
          message: 'Cattle feed is below minimum threshold (300kg / 500kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: { feedType: 'cattle_feed', currentKg: 300, minKg: 500 },
        },
      ])
      .execute()
    console.log('  ✅ Notifications added\n')

    console.log('✅ Seeding complete!\n')
    console.log('📊 Summary:')
    console.log('  - 5 farms (Poultry, Fish, Mixed, Livestock, Bees)')
    console.log('  - 8 batches across all 6 livestock types')
    console.log('  - 8 customers (all types)')
    console.log('  - 5 suppliers (all types)')
    console.log('  - Complete interconnected records')
    console.log('  - New structures: tarpaulin ponds, kraal, hives')
    console.log('  - New sale units: head, liter, kg, colony')
    console.log('  - Nigerian payment methods (60% mobile_money)')
    console.log('\n🔐 Login: admin@openlivestock.local / password123\n')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}
