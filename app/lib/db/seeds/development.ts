// @ts-nocheck
/**
 * Development/Demo Farm Seeder - LivestockAI Manager
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
const daysAgo = (days: number) =>
  new Date(TODAY.getTime() - days * 24 * 60 * 60 * 1000)
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
  return 'bank_transfer' // 10%
}

// For sales table which has different payment method options
const pickSalesPayment = () => {
  const r = Math.random()
  if (r < 0.5) return 'mobile_money' // 50% - MTN/Airtel Money
  if (r < 0.8) return 'cash' // 30%
  return 'transfer' // 20%
}

// ============ MAIN SEED ============
export async function seedDev() {
  console.log('🌱 Seeding LivestockAI Demo Data (5 Nigerian Farms)\n')
  console.log(`📅 Reference date: ${TODAY.toISOString().split('T')[0]}\n`)

  try {
    // ============ CLEANUP ============
    console.log('🧹 Clearing existing data...')
    const tables = [
      'outbreak_alert_farms',
      'outbreak_alerts',
      'visit_records',
      'sensor_alerts',
      'sensor_readings',
      'task_assignments',
      'task_completions',
      'tasks',
      'notifications',
      'invoice_items',
      'sales',
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
      'supplies_inventory',
      'listing_views',
      'listing_contact_requests',
      'marketplace_listings',
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
      email: 'admin@livestockai.local',
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

    // ============ DEFAULT FARM (for customers/suppliers) ============
    console.log('🏡 Creating default farm...')
    const defaultFarm = await db
      .insertInto('farms')
      .values({
        name: 'Demo Farm',
        location: 'Demo Location',
        type: 'mixed',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    await db
      .insertInto('user_farms')
      .values({
        userId: user.userId,
        farmId: defaultFarm.id,
        role: 'owner',
      })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([
        { farmId: defaultFarm.id, moduleKey: 'poultry', enabled: true },
        {
          farmId: defaultFarm.id,
          moduleKey: 'aquaculture',
          enabled: true,
        },
        { farmId: defaultFarm.id, moduleKey: 'cattle', enabled: true },
        { farmId: defaultFarm.id, moduleKey: 'goats', enabled: true },
        { farmId: defaultFarm.id, moduleKey: 'sheep', enabled: true },
        { farmId: defaultFarm.id, moduleKey: 'bees', enabled: true },
      ])
      .execute()
    console.log('  ✅ Default farm created\n')

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
          farmId: defaultFarm.id,
          name: 'Mama Ngozi',
          phone: '+234-802-111-2222',
          location: 'Kaduna Market',
          customerType: 'individual',
        },
        {
          farmId: defaultFarm.id,
          name: 'Chicken Republic',
          phone: '+234-803-222-3333',
          email: 'procurement@chickenrepublic.ng',
          location: 'Abuja',
          customerType: 'restaurant',
        },
        {
          farmId: defaultFarm.id,
          name: 'Shoprite Kaduna',
          phone: '+234-804-333-4444',
          email: 'meat@shoprite.ng',
          location: 'Kaduna',
          customerType: 'retailer',
        },
        // Fish customers
        {
          farmId: defaultFarm.id,
          name: 'Yellow Chilli Restaurant',
          phone: '+234-805-444-5555',
          email: 'chef@yellowchilli.ng',
          location: 'Ibadan',
          customerType: 'restaurant',
        },
        {
          farmId: defaultFarm.id,
          name: 'Fish Wholesalers Ltd',
          phone: '+234-806-555-6666',
          location: 'Lagos',
          customerType: 'wholesaler',
        },
        // Livestock customers
        {
          farmId: defaultFarm.id,
          name: 'Kano Abattoir',
          phone: '+234-807-666-7777',
          location: 'Kano',
          customerType: 'processor',
        },
        {
          farmId: defaultFarm.id,
          name: 'Federal Ministry of Agriculture',
          phone: '+234-808-777-8888',
          email: 'procurement@fmard.gov.ng',
          location: 'Abuja',
          customerType: 'government',
        },
        // Honey customers
        {
          farmId: defaultFarm.id,
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
        paymentMethod: pickSalesPayment(),
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

    // Supplies inventory for farm operations
    await db
      .insertInto('supplies_inventory')
      .values([
        {
          farmId: farm1.id,
          itemName: 'Virkon S Disinfectant',
          category: 'disinfectant',
          quantityKg: '10.00',
          unit: 'kg',
          minThresholdKg: '5.00',
          costPerUnit: '8500.00',
          lastRestocked: daysAgo(14),
          expiryDate: new Date('2027-06-30'),
          notes: 'For poultry house sanitation',
        },
        {
          farmId: farm1.id,
          itemName: 'Wood Shavings',
          category: 'bedding',
          quantityKg: '200.00',
          unit: 'bags',
          minThresholdKg: '100.00',
          costPerUnit: '2500.00',
          lastRestocked: daysAgo(7),
          notes: 'Deep litter bedding material',
        },
        {
          farmId: farm1.id,
          itemName: 'Diesel Fuel',
          category: 'fuel',
          quantityKg: '50.00',
          unit: 'liters',
          minThresholdKg: '20.00',
          costPerUnit: '1200.00',
          lastRestocked: daysAgo(3),
          notes: 'Generator and equipment fuel',
        },
        {
          farmId: farm1.id,
          itemName: 'Rat Poison Pellets',
          category: 'pest_control',
          quantityKg: '5.00',
          unit: 'kg',
          minThresholdKg: '2.00',
          costPerUnit: '3500.00',
          lastRestocked: daysAgo(30),
          expiryDate: new Date('2027-12-31'),
          notes: 'Rodent control around feed storage',
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
        type: 'aquaculture',
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
        {
          batchId: f2b1.id,
          quantity: 50,
          date: monthsAgo(3),
          cause: 'disease',
          notes: 'Fungal infection',
        },
        {
          batchId: f2b1.id,
          quantity: 30,
          date: monthsAgo(1),
          cause: 'predator',
          notes: 'Snake attack',
        },
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
        {
          batchId: f2b1.id,
          date: monthsAgo(2),
          sampleSize: 20,
          averageWeightKg: '0.250',
        },
        {
          batchId: f2b1.id,
          date: monthsAgo(1),
          sampleSize: 20,
          averageWeightKg: '0.650',
        },
        {
          batchId: f2b1.id,
          date: daysAgo(7),
          sampleSize: 20,
          averageWeightKg: '1.100',
        },
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
        paymentMethod: pickSalesPayment(),
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
        {
          farmId: farm3.id,
          name: 'Broiler House',
          type: 'house',
          capacity: 100,
          areaSqm: '60.00',
          status: 'active',
        },
        {
          farmId: farm3.id,
          name: 'Fish Pond',
          type: 'tarpaulin',
          capacity: 500,
          areaSqm: '80.00',
          status: 'active',
        },
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

    await db
      .insertInto('mortality_records')
      .values({
        batchId: f3b1.id,
        quantity: 5,
        date: daysAgo(35),
        cause: 'disease',
      })
      .execute()
    await db
      .insertInto('feed_records')
      .values({
        batchId: f3b1.id,
        feedType: 'starter',
        quantityKg: '40.00',
        cost: '24000.00',
        date: daysAgo(40),
        supplierId: suppliers[0].id,
      })
      .execute()
    await db
      .insertInto('weight_samples')
      .values({
        batchId: f3b1.id,
        date: daysAgo(21),
        sampleSize: 10,
        averageWeightKg: '1.200',
      })
      .execute()

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

    await db
      .insertInto('mortality_records')
      .values({
        batchId: f3b2.id,
        quantity: 40,
        date: monthsAgo(2),
        cause: 'disease',
      })
      .execute()
    await db
      .insertInto('feed_records')
      .values({
        batchId: f3b2.id,
        feedType: 'fish_feed',
        quantityKg: '100.00',
        cost: '90000.00',
        date: monthsAgo(2),
        supplierId: suppliers[1].id,
      })
      .execute()
    await db
      .insertInto('water_quality')
      .values({
        batchId: f3b2.id,
        date: daysAgo(3),
        ph: '7.00',
        temperatureCelsius: '27.00',
        dissolvedOxygenMgL: '6.00',
        ammoniaMgL: '0.20',
      })
      .execute()

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
        {
          farmId: farm4.id,
          name: 'Traditional Kraal',
          type: 'kraal',
          capacity: 50,
          areaSqm: '200.00',
          status: 'active',
        },
        {
          farmId: farm4.id,
          name: 'Shelter Barn',
          type: 'barn',
          capacity: 100,
          areaSqm: '150.00',
          status: 'active',
        },
        {
          farmId: farm4.id,
          name: 'Grazing Pasture A',
          type: 'pasture',
          capacity: 200,
          areaSqm: '5000.00',
          status: 'active',
        },
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

    await db
      .insertInto('feed_records')
      .values({
        batchId: f4b1.id,
        feedType: 'cattle_feed',
        quantityKg: '500.00',
        cost: '200000.00',
        date: monthsAgo(3),
        supplierId: suppliers[3].id,
      })
      .execute()
    await db
      .insertInto('weight_samples')
      .values({
        batchId: f4b1.id,
        date: monthsAgo(3),
        sampleSize: 10,
        averageWeightKg: '180.000',
      })
      .execute()
    await db
      .insertInto('treatments')
      .values({
        batchId: f4b1.id,
        medicationName: 'Ivermectin',
        reason: 'Deworming',
        date: monthsAgo(4),
        dosage: '1ml per 50kg',
        withdrawalDays: 28,
      })
      .execute()

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
        paymentMethod: pickSalesPayment(),
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

    await db
      .insertInto('mortality_records')
      .values({
        batchId: f4b2.id,
        quantity: 1,
        date: monthsAgo(2),
        cause: 'injury',
      })
      .execute()
    await db
      .insertInto('feed_records')
      .values({
        batchId: f4b2.id,
        feedType: 'goat_feed',
        quantityKg: '200.00',
        cost: '80000.00',
        date: monthsAgo(2),
      })
      .execute()

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
        {
          farmId: farm5.id,
          name: 'Hive Row 1',
          type: 'hive',
          capacity: 5,
          areaSqm: '10.00',
          status: 'active',
        },
        {
          farmId: farm5.id,
          name: 'Hive Row 2',
          type: 'hive',
          capacity: 5,
          areaSqm: '10.00',
          status: 'active',
        },
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
        species: 'italian',
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

    await db
      .insertInto('feed_records')
      .values({
        batchId: f5b1.id,
        feedType: 'bee_feed',
        quantityKg: '5.00',
        cost: '10000.00',
        date: monthsAgo(6),
      })
      .execute()

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
        paymentMethod: pickSalesPayment(),
        date: daysAgo(15),
      })
      .execute()

    // Additional bees sales
    await db
      .insertInto('sales')
      .values({
        farmId: farm5.id,
        batchId: f5b1.id,
        customerId: customers[7].id,
        livestockType: 'honey',
        quantity: 5,
        unitPrice: '8000.00',
        totalAmount: '40000.00',
        unitType: 'kg',
        paymentStatus: 'paid',
        paymentMethod: pickSalesPayment(),
        date: daysAgo(15),
      })
      .execute()

    console.log('  ✅ Farm 5: Golden Hive Apiary (1 bee colony)\n')

    // ============ ADDITIONAL INVENTORY FOR ALL FARMS ============
    console.log('📦 Adding inventory for all farms...')
    await db
      .insertInto('feed_inventory')
      .values([
        {
          farmId: farm2.id,
          feedType: 'fish_feed',
          quantityKg: '150.00',
          minThresholdKg: '200.00',
        },
        {
          farmId: farm3.id,
          feedType: 'starter',
          quantityKg: '30.00',
          minThresholdKg: '50.00',
        },
        {
          farmId: farm3.id,
          feedType: 'fish_feed',
          quantityKg: '80.00',
          minThresholdKg: '100.00',
        },
        {
          farmId: farm4.id,
          feedType: 'cattle_feed',
          quantityKg: '300.00',
          minThresholdKg: '500.00',
        },
        {
          farmId: farm4.id,
          feedType: 'goat_feed',
          quantityKg: '100.00',
          minThresholdKg: '150.00',
        },
        {
          farmId: farm5.id,
          feedType: 'bee_feed',
          quantityKg: '3.00',
          minThresholdKg: '5.00',
        },
      ])
      .execute()

    await db
      .insertInto('medication_inventory')
      .values([
        {
          farmId: farm2.id,
          medicationName: 'Malachite Green',
          quantity: 2,
          unit: 'bottle',
          expiryDate: new Date('2026-08-31'),
          minThreshold: 5,
        },
        {
          farmId: farm4.id,
          medicationName: 'Ivermectin',
          quantity: 10,
          unit: 'vial',
          expiryDate: new Date('2027-01-31'),
          minThreshold: 15,
        },
        {
          farmId: farm4.id,
          medicationName: 'Antibiotics',
          quantity: 5,
          unit: 'bottle',
          expiryDate: new Date('2026-09-30'),
          minThreshold: 10,
        },
      ])
      .execute()

    // Supplies inventory for all farms
    await db
      .insertInto('supplies_inventory')
      .values([
        // Fish farm supplies
        {
          farmId: farm2.id,
          itemName: 'Pond Disinfectant',
          category: 'disinfectant',
          quantityKg: '15.00',
          unit: 'liters',
          minThresholdKg: '10.00',
          costPerUnit: '6500.00',
          lastRestocked: daysAgo(10),
          notes: 'For pond sanitation between cycles',
        },
        {
          farmId: farm2.id,
          itemName: 'Lime (CaO)',
          category: 'chemical',
          quantityKg: '50.00',
          unit: 'kg',
          minThresholdKg: '25.00',
          costPerUnit: '1500.00',
          lastRestocked: daysAgo(21),
          notes: 'pH adjustment and pond preparation',
        },
        // Mixed farm supplies
        {
          farmId: farm3.id,
          itemName: 'Multi-purpose Disinfectant',
          category: 'disinfectant',
          quantityKg: '8.00',
          unit: 'liters',
          minThresholdKg: '5.00',
          costPerUnit: '7000.00',
          lastRestocked: daysAgo(5),
        },
        {
          farmId: farm3.id,
          itemName: 'Rice Husks',
          category: 'bedding',
          quantityKg: '100.00',
          unit: 'bags',
          minThresholdKg: '50.00',
          costPerUnit: '1800.00',
          lastRestocked: daysAgo(12),
          notes: 'Alternative bedding material',
        },
        // Livestock ranch supplies
        {
          farmId: farm4.id,
          itemName: 'Cattle Dip Solution',
          category: 'chemical',
          quantityKg: '20.00',
          unit: 'liters',
          minThresholdKg: '10.00',
          costPerUnit: '12000.00',
          lastRestocked: daysAgo(30),
          expiryDate: new Date('2027-03-31'),
          notes: 'Tick and parasite control',
        },
        {
          farmId: farm4.id,
          itemName: 'Hay Bales',
          category: 'bedding',
          quantityKg: '500.00',
          unit: 'kg',
          minThresholdKg: '200.00',
          costPerUnit: '800.00',
          lastRestocked: daysAgo(7),
          notes: 'Bedding and supplementary feed',
        },
        {
          farmId: farm4.id,
          itemName: 'Diesel Fuel',
          category: 'fuel',
          quantityKg: '100.00',
          unit: 'liters',
          minThresholdKg: '50.00',
          costPerUnit: '1200.00',
          lastRestocked: daysAgo(2),
          notes: 'Farm vehicles and equipment',
        },
        // Apiary supplies
        {
          farmId: farm5.id,
          itemName: 'Bee Smoker Fuel',
          category: 'fuel',
          quantityKg: '5.00',
          unit: 'kg',
          minThresholdKg: '2.00',
          costPerUnit: '2000.00',
          lastRestocked: daysAgo(20),
          notes: 'Pine needles and burlap for smoker',
        },
        {
          farmId: farm5.id,
          itemName: 'Honey Jars (500ml)',
          category: 'packaging',
          quantityKg: '200.00',
          unit: 'pieces',
          minThresholdKg: '100.00',
          costPerUnit: '350.00',
          lastRestocked: daysAgo(14),
          notes: 'Glass jars for retail honey',
        },
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
          metadata: {
            feedType: 'fish_feed',
            currentKg: 150,
            minKg: 200,
          },
        },
        {
          userId: user.userId,
          farmId: farm4.id,
          type: 'lowStock',
          title: 'Low Cattle Feed Stock',
          message: 'Cattle feed is below minimum threshold (300kg / 500kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: {
            feedType: 'cattle_feed',
            currentKg: 300,
            minKg: 500,
          },
        },
      ])
      .execute()
    console.log('  ✅ Notifications added\n')

    // ============ DIGITAL FOREMAN: WORKERS ============
    console.log('👷 Creating worker profiles and attendance...')

    // Nigerian names for workers
    const firstNames = [
      'Chinedu',
      'Emeka',
      'Ifeanyi',
      'Nnamdi',
      'Obinna', // Igbo
      'Fatima',
      'Aisha',
      'Maryam',
      'Zainab',
      'Hauwa', // Hausa/Fulani
      'Tolu',
      'Oluwaseun',
      'Biodun',
      'Adewale', // Yoruba
      'Grace',
      'Blessing',
      'Joy',
      'Patience',
      'Mercy', // Christian
      'David',
      'Sunday',
      'Emmanuel',
      'Samuel', // Christian
    ]
    const lastNames = [
      'Okafor',
      'Nwosu',
      'Okonkwo',
      'Eze',
      'Ibrahim',
      'Mohammed',
      'Adeyemi',
      'Okafor',
      'Chukwu',
      'Bello',
    ]

    const allWorkers: Array<any> = []
    const allGeofences: Array<any> = []
    const allCheckIns: Array<any> = []

    // Create workers and geofences for each farm
    for (const farm of [farm1, farm2, farm3, farm4, farm5]) {
      const workerCount = Math.floor(Math.random() * 3) + 5 // 5-7 workers per farm
      const farmWorkers: Array<any> = []

      // Create farm geofence
      const geofence = await db
        .insertInto('farm_geofences')
        .values({
          farmId: farm.id,
          geofenceType: 'circle',
          centerLat: String(10.5 + Math.random() * 2), // Nigerian latitudes
          centerLng: String(7.5 + Math.random() * 3), // Nigerian longitudes
          radiusMeters: String(500 + Math.random() * 500), // 500-1000m radius
          toleranceMeters: '50.00',
        })
        .returningAll()
        .executeTakeFirstOrThrow()
      allGeofences.push(geofence)

      // Create workers - each worker needs a unique user account
      for (let i = 0; i < workerCount; i++) {
        const firstName =
          firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
        const phone = `+234-8${Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`

        const permissions: Array<string> = []
        if (Math.random() > 0.3) permissions.push('feed:log')
        if (Math.random() > 0.3) permissions.push('mortality:log')
        if (Math.random() > 0.5) permissions.push('weight:log')
        if (Math.random() > 0.5) permissions.push('vaccination:log')
        if (Math.random() > 0.7) permissions.push('sales:view')
        if (Math.random() > 0.7) permissions.push('task:complete')
        if (Math.random() > 0.8) permissions.push('batch:view')

        const wageRate = 35000 + Math.floor(Math.random() * 30000) // 35,000-65,000 NGN

        // Create a unique user account for this worker
        const workerEmail = `worker-${farm.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}@livestockai.local`
        const workerUser = await createUserWithAuth(db, {
          email: workerEmail,
          password: 'worker123',
          name: `${firstName} ${lastName}`,
          role: 'user',
        })

        const worker = await db
          .insertInto('worker_profiles')
          .values({
            userId: workerUser.userId,
            farmId: farm.id,
            phone,
            emergencyContactName: `${firstName} ${lastName}`,
            emergencyContactPhone: `+234-8${Math.floor(Math.random() * 10)}${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
            employmentStatus: 'active',
            employmentStartDate: monthsAgo(6 + Math.floor(Math.random() * 12)), // 6-18 months ago
            wageRateAmount: String(wageRate),
            wageRateType: 'monthly',
            wageCurrency: 'NGN',
            permissions: JSON.stringify(permissions) as any,
            structureIds: JSON.stringify(
              farm.id === farm1.id ? [farm1.id] : [],
            ) as any,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        farmWorkers.push(worker)
        allWorkers.push(worker)

        // Generate 6 months of daily check-ins (approx 180 days)
        const startDate = monthsAgo(6)
        for (let day = 0; day < 180; day++) {
          const checkDate = new Date(
            startDate.getTime() + day * 24 * 60 * 60 * 1000,
          )
          const dayOfWeek = checkDate.getDay()

          // Skip some weekends (30% chance)
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (Math.random() < 0.3) continue
          }

          // Skip occasional sick days (3% chance)
          if (Math.random() < 0.03) continue

          // Check-in time: 6:30 AM ± 45 minutes
          const checkInHour = 6 + Math.floor(Math.random() * 2) // 6-7 AM
          const checkInMinute = Math.floor(Math.random() * 60)
          const checkInTime = new Date(checkDate)
          checkInTime.setHours(checkInHour, checkInMinute, 0, 0)

          // Check-out time: 5:30 PM ± 90 minutes
          const checkOutHour = 16 + Math.floor(Math.random() * 3) // 4-7 PM
          const checkOutMinute = Math.floor(Math.random() * 60)
          const checkOutTime = new Date(checkDate)
          checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0)

          // Calculate hours worked
          const hoursWorked = Number(
            (
              (checkOutTime.getTime() - checkInTime.getTime()) /
              (1000 * 60 * 60)
            ).toFixed(2),
          )

          // 95% within geofence, 5% violations (GPS drift)
          const isWithinGeofence = Math.random() < 0.95
          const lat =
            parseFloat(geofence.centerLat) +
            (isWithinGeofence ? 0 : (Math.random() - 0.5) * 0.01)
          const lng =
            parseFloat(geofence.centerLng) +
            (isWithinGeofence ? 0 : (Math.random() - 0.5) * 0.01)

          await db
            .insertInto('worker_check_ins')
            .values({
              workerId: worker.id,
              farmId: farm.id,
              checkInTime,
              checkInLat: String(lat),
              checkInLng: String(lng),
              checkInAccuracy: String(5 + Math.random() * 20), // 5-25m accuracy
              checkOutTime,
              checkOutLat: String(lat),
              checkOutLng: String(lng),
              checkOutAccuracy: String(5 + Math.random() * 20),
              hoursWorked: String(hoursWorked),
              verificationStatus: isWithinGeofence
                ? 'verified'
                : 'outside_geofence',
              syncStatus: 'synced',
            })
            .execute()
        }
      }

      // Create tasks for this farm
      const taskTypes = [
        { name: 'Morning Feeding', frequency: 'daily' as const },
        { name: 'Evening Feeding', frequency: 'daily' as const },
        { name: 'Clean Water Troughs', frequency: 'daily' as const },
        { name: 'Check Animal Health', frequency: 'daily' as const },
        { name: 'Collect Eggs', frequency: 'daily' as const },
        { name: 'Clean Poultry House', frequency: 'weekly' as const },
        { name: 'Weigh Sample Birds', frequency: 'weekly' as const },
        { name: 'Inspect Fences', frequency: 'weekly' as const },
        { name: 'Restock Feed', frequency: 'weekly' as const },
        { name: 'Deep Clean Facility', frequency: 'monthly' as const },
      ]

      const farmTasks = await db
        .insertInto('tasks')
        .values(
          taskTypes.map((task) => ({
            farmId: farm.id,
            title: task.name,
            description: `Regular ${task.name.toLowerCase()} for ${farm.name}`,
            frequency: task.frequency,
          })),
        )
        .returningAll()
        .execute()

      // Assign tasks to workers for the past month
      const pastMonth = daysAgo(30)
      for (const task of farmTasks) {
        // Determine assignment frequency based on task frequency
        const daysBetween =
          task.frequency === 'daily' ? 1 : task.frequency === 'weekly' ? 7 : 30

        for (let day = 0; day < 30; day += daysBetween) {
          const taskDate = new Date(
            pastMonth.getTime() + day * 24 * 60 * 60 * 1000,
          )

          // Skip weekends for some tasks
          if (taskDate.getDay() === 0 || taskDate.getDay() === 6) {
            if (Math.random() < 0.5) continue
          }

          // Assign to random worker
          const assignedWorker =
            farmWorkers[Math.floor(Math.random() * farmWorkers.length)]

          const assignment = await db
            .insertInto('task_assignments')
            .values({
              taskId: task.id,
              workerId: assignedWorker.id,
              assignedBy: user.userId,
              farmId: farm.id,
              dueDate: taskDate,
              priority: task.priority,
              status: Math.random() > 0.2 ? 'completed' : 'pending', // 80% completion rate
              requiresPhoto: Math.random() > 0.7,
              requiresApproval: Math.random() > 0.8,
              notes: null,
            })
            .returningAll()
            .executeTakeFirstOrThrow()

          // Add completion records if completed
          if (assignment.status === 'completed') {
            const completedAt = new Date(
              taskDate.getTime() + (8 + Math.random() * 4) * 60 * 60 * 1000,
            ) // 8-12 hours later

            // Get the period start (beginning of day for daily, week for weekly, month for monthly)
            const periodStart = new Date(taskDate)
            periodStart.setHours(0, 0, 0, 0)

            await db
              .insertInto('task_completions')
              .values({
                taskId: task.id,
                userId: assignedWorker.userId, // Worker's user account ID
                completedAt,
                periodStart,
              })
              .execute()
          }
        }
      }
    }

    console.log(
      `  ✅ Created ${allWorkers.length} workers with 6 months attendance data`,
    )
    console.log(`  ✅ Created ${allGeofences.length} farm geofences`)
    console.log(`  ✅ Created tasks and assignments for all farms\n`)

    // ============ WAGE PAYMENTS ============
    console.log('💰 Creating payroll periods and wage payments...')

    // Create payroll periods for each farm (6 months of monthly periods)
    // Using batch insert to avoid exclusion constraint issues
    const payrollPeriods: Map<string, Array<any>> = new Map()

    for (const farm of [farm1, farm2, farm3, farm4, farm5]) {
      const periodValues: Array<{
        farmId: string
        periodType: 'monthly'
        startDate: Date
        endDate: Date
        status: 'open' | 'closed'
      }> = []

      for (let month = 0; month < 6; month++) {
        // Calculate period dates - go back 6 months and then forward
        const year = TODAY.getFullYear()
        const currentMonth = TODAY.getMonth()
        const targetMonth = currentMonth - 6 + month

        // Handle year rollover
        const periodYear = targetMonth < 0 ? year - 1 : year
        const periodMonth = targetMonth < 0 ? 12 + targetMonth : targetMonth

        const periodStart = new Date(Date.UTC(periodYear, periodMonth, 1))
        // End date is the last day of the month
        const periodEnd = new Date(Date.UTC(periodYear, periodMonth + 1, 0))

        periodValues.push({
          farmId: farm.id,
          periodType: 'monthly',
          startDate: periodStart,
          endDate: periodEnd,
          status: month < 5 ? 'closed' : 'open',
        })
      }

      // Insert all periods for this farm at once
      const farmPeriods = await db
        .insertInto('payroll_periods')
        .values(periodValues)
        .returningAll()
        .execute()

      payrollPeriods.set(farm.id, farmPeriods)
    }

    // Create wage payments for each worker
    for (const worker of allWorkers) {
      const wageRate = parseFloat(worker.wageRateAmount)
      const farmPeriods = payrollPeriods.get(worker.farmId) || []

      // Generate payments for closed periods (first 5 months)
      for (let month = 0; month < 5; month++) {
        const period = farmPeriods[month]
        if (!period) continue

        const paymentDate = new Date(period.endDate)
        paymentDate.setDate(25) // Payday on 25th

        // Random bonus (occasional)
        const bonus =
          Math.random() > 0.8 ? Math.round(Math.random() * 10000) : 0
        const totalAmount = wageRate + bonus

        await db
          .insertInto('wage_payments')
          .values({
            workerId: worker.id,
            payrollPeriodId: period.id,
            farmId: worker.farmId,
            amount: String(totalAmount),
            paymentDate,
            paymentMethod: pickPayment(),
            notes:
              bonus > 0 ? `Includes bonus of ₦${bonus.toLocaleString()}` : null,
          })
          .execute()
      }
    }

    console.log(
      '  ✅ Payroll periods and wage payments created for all workers\n',
    )

    // ============ SENSORS ============
    console.log('🌡️ Creating IoT sensors and readings...')

    const sensorTypes = [
      {
        type: 'temperature' as const,
        name: 'Temperature Sensor',
        unit: 'celsius',
      },
      { type: 'humidity' as const, name: 'Humidity Sensor', unit: 'percent' },
      { type: 'ammonia' as const, name: 'Ammonia Sensor', unit: 'ppm' },
      { type: 'dissolved_oxygen' as const, name: 'DO Sensor', unit: 'mgL' },
      { type: 'ph' as const, name: 'pH Sensor', unit: 'ph' },
    ]

    const allSensors: Array<any> = []

    // Create 2-3 sensors per farm
    for (const farm of [farm1, farm2, farm3, farm4, farm5]) {
      const numSensors = 2 + Math.floor(Math.random() * 2) // 2-3 sensors

      for (let i = 0; i < numSensors; i++) {
        const sensorType = sensorTypes[Math.min(i, sensorTypes.length - 1)]

        const sensor = await db
          .insertInto('sensors')
          .values({
            farmId: farm.id,
            structureId: null, // Farm-level sensor
            name: `${sensorType.name} ${i + 1}`,
            sensorType: sensorType.type,
            apiKeyHash: `key_${farm.id}_${i}_${Date.now()}`,
            pollingIntervalMinutes: 15,
            isActive: true,
            thresholds: {
              minValue:
                sensorType.type === 'temperature'
                  ? 18
                  : sensorType.type === 'humidity'
                    ? 40
                    : null,
              maxValue:
                sensorType.type === 'temperature'
                  ? 35
                  : sensorType.type === 'humidity'
                    ? 90
                    : null,
              warningMinValue:
                sensorType.type === 'temperature'
                  ? 20
                  : sensorType.type === 'humidity'
                    ? 50
                    : null,
              warningMaxValue:
                sensorType.type === 'temperature'
                  ? 32
                  : sensorType.type === 'humidity'
                    ? 80
                    : null,
            },
            trendConfig: {
              rateThreshold: 5,
              rateWindowMinutes: 60,
            },
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        allSensors.push(sensor)

        // Generate 6 months of hourly readings (roughly 4,300 readings per sensor)
        const startDate = monthsAgo(6)
        const readingCount = 180 * 24 // 180 days, 24 readings per day

        for (let r = 0; r < readingCount; r++) {
          const readingTime = new Date(startDate.getTime() + r * 60 * 60 * 1000)
          const hour = readingTime.getHours()
          const dayOfYear = Math.floor(r / 24)

          // Generate realistic patterns
          let value: number

          if (sensorType.type === 'temperature') {
            // Daily pattern: 22°C (night) → 32°C (midday) → 28°C (evening)
            const dailyVariation = Math.sin(((hour - 6) * Math.PI) / 12) * 5 // ±5°C
            const seasonalVariation = Math.sin((dayOfYear / 180) * Math.PI) * 3 // ±3°C
            value =
              27 +
              dailyVariation +
              seasonalVariation +
              (Math.random() - 0.5) * 2
          } else if (sensorType.type === 'humidity') {
            // Inverse correlation with temperature
            const dailyVariation = -Math.sin(((hour - 6) * Math.PI) / 12) * 15
            value = 65 + dailyVariation + (Math.random() - 0.5) * 10
          } else if (sensorType.type === 'ammonia') {
            // Higher when more animals (daytime)
            const dailyVariation = Math.sin(((hour - 6) * Math.PI) / 12) * 10
            value = 25 + dailyVariation + (Math.random() - 0.5) * 15
          } else if (sensorType.type === 'dissolved_oxygen') {
            // Lower when temperature higher (inverse correlation)
            const dailyVariation = -Math.sin(((hour - 6) * Math.PI) / 12) * 2
            value = 6 + dailyVariation + (Math.random() - 0.5) * 3
          } else {
            // pH: relatively stable
            value = 7.0 + (Math.random() - 0.5) * 1
          }

          // Occasional anomalies (0.5% chance)
          const isAnomaly = Math.random() < 0.005
          if (isAnomaly) {
            if (sensorType.type === 'temperature') {
              value = 40 + Math.random() * 5 // Heat wave!
            } else if (sensorType.type === 'ammonia') {
              value = 50 + Math.random() * 20 // Spill!
            }
          }

          // Round to appropriate precision
          value = Math.round(value * 100) / 100

          await db
            .insertInto('sensor_readings')
            .values({
              sensorId: sensor.id,
              value: String(value),
              recordedAt: readingTime,
              isAnomaly: isAnomaly,
              metadata: isAnomaly
                ? { note: 'Anomalous reading detected' }
                : null,
            })
            .execute()
        }

        // Create some alerts for this sensor
        const numAlerts = 1 + Math.floor(Math.random() * 3) // 1-3 alerts
        for (let a = 0; a < numAlerts; a++) {
          const alertDaysAgo = 10 + Math.floor(Math.random() * 160) // 10-170 days ago
          const alertTime = new Date(daysAgo(alertDaysAgo))

          const isCritical = Math.random() > 0.7
          const alertValue = isCritical
            ? sensorType.type === 'temperature'
              ? 38
              : sensorType.type === 'ammonia'
                ? 60
                : 100
            : sensorType.type === 'temperature'
              ? 34
              : sensorType.type === 'ammonia'
                ? 45
                : 80

          await db
            .insertInto('sensor_alerts')
            .values({
              sensorId: sensor.id,
              alertType: isCritical ? 'threshold_high' : 'warning_high',
              severity: isCritical ? 'critical' : 'warning',
              triggerValue: String(alertValue),
              thresholdValue: String(alertValue - 5),
              message: `${sensorType.name} ${isCritical ? 'critically' : 'abnormally'} high`,
              acknowledged: Math.random() > 0.5,
              acknowledgedAt:
                Math.random() > 0.5
                  ? new Date(alertTime.getTime() + 60 * 60 * 1000)
                  : null,
              createdAt: alertTime,
            })
            .execute()
        }
      }
    }

    console.log(
      `  ✅ Created ${allSensors.length} sensors with 6 months of hourly readings`,
    )
    console.log('  ✅ Sensor alerts generated\n')

    // ============ WEIGHT SAMPLES ============
    console.log('⚖️ Creating weight samples for growth tracking...')

    // All batches from all farms
    const allBatches = [
      ...f1Structures,
      f2Structures,
      f3Structures,
      f4Structures,
    ].flatMap((s) => s)

    for (const batch of [f1b1, f2b1, f3b1, f3b2, f4b1, f4b2]) {
      const ageWeeks = Math.floor(
        (TODAY.getTime() - new Date(batch.acquisitionDate).getTime()) /
          (7 * 24 * 60 * 60 * 1000),
      )

      // Create weekly weight samples
      for (let week = 1; week <= ageWeeks; week++) {
        const sampleDate = new Date(
          new Date(batch.acquisitionDate).getTime() +
            week * 7 * 24 * 60 * 60 * 1000,
        )

        // Skip if in future
        if (sampleDate > TODAY) continue

        // Calculate expected weight based on species and age
        let expectedWeight = 0
        if (batch.species === 'broiler') {
          // Cobb 500 growth curve
          expectedWeight =
            week <= 1
              ? 0.18
              : week <= 4
                ? 0.18 + week * 0.09
                : week <= 6
                  ? 0.54 + (week - 4) * 0.45
                  : 2.0
        } else if (batch.species === 'catfish') {
          expectedWeight = week * 0.15 // Slower growth
        } else if (batch.species === 'white_fulani') {
          expectedWeight = week * 15 // Cattle gain 15kg/week
        } else if (batch.species === 'red_sokoto') {
          expectedWeight = week * 3 // Goats gain 3kg/week
        } else {
          expectedWeight = week * 0.5 // Default
        }

        // Add some variation (±10%)
        const actualWeight = expectedWeight * (0.9 + Math.random() * 0.2)
        const sampleSize = Math.max(5, Math.floor(batch.currentQuantity * 0.1)) // Sample 10% of animals

        await db
          .insertInto('weight_samples')
          .values({
            batchId: batch.id,
            date: sampleDate,
            sampleSize,
            averageWeightKg: String(Math.round(actualWeight * 1000) / 1000),
          })
          .execute()
      }
    }

    console.log('  ✅ Weight samples created for all batches\n')

    // ============ MARKETPLACE ============
    console.log('🏪 Creating marketplace listings...')

    const listings = await db
      .insertInto('marketplace_listings')
      .values([
        {
          sellerId: user.userId,
          livestockType: 'poultry',
          species: 'broiler',
          quantity: 50,
          minPrice: '3000.00',
          maxPrice: '3500.00',
          currency: 'NGN',
          latitude: '10.5105',
          longitude: '7.4105',
          country: 'Nigeria',
          region: 'Kaduna',
          locality: 'Kaduna City',
          formattedAddress: 'Kaduna, Kaduna State, Nigeria',
          description:
            'Healthy 8-week-old broilers, well-fed, vaccinated. Premium quality.',
          photoUrls: [],
          fuzzingLevel: 'locality',
          contactPreference: 'both',
          batchId: f1b1.id,
          status: 'active',
          expiresAt: daysAgo(-14), // Expires in 2 weeks
        },
        {
          sellerId: user.userId,
          livestockType: 'fish',
          species: 'catfish',
          quantity: 200,
          minPrice: '1200.00',
          maxPrice: '1500.00',
          currency: 'NGN',
          latitude: '7.3775',
          longitude: '3.9470',
          country: 'Nigeria',
          region: 'Oyo',
          locality: 'Ibadan',
          formattedAddress: 'Ibadan, Oyo State, Nigeria',
          description:
            'Live catfish from clean tarpaulin ponds. Great for smokers.',
          photoUrls: [],
          fuzzingLevel: 'region',
          contactPreference: 'phone',
          batchId: f2b1.id,
          status: 'active',
          expiresAt: daysAgo(-7),
        },
        {
          sellerId: user.userId,
          livestockType: 'cattle',
          species: 'white_fulani',
          quantity: 5,
          minPrice: '250000.00',
          maxPrice: '300000.00',
          currency: 'NGN',
          latitude: '12.0022',
          longitude: '8.5919',
          country: 'Nigeria',
          region: 'Kano',
          locality: 'Kano City',
          formattedAddress: 'Kano, Kano State, Nigeria',
          description:
            'Healthy cattle, good for breeding or meat production. 18 months old.',
          photoUrls: [],
          fuzzingLevel: 'locality',
          contactPreference: 'both',
          batchId: f4b1.id,
          status: 'active',
          expiresAt: daysAgo(-21),
        },
        {
          sellerId: user.userId,
          livestockType: 'honey',
          species: 'honeybee',
          quantity: 100,
          minPrice: '3500.00',
          maxPrice: '4500.00',
          currency: 'NGN',
          latitude: '6.4441',
          longitude: '7.5066',
          country: 'Nigeria',
          region: 'Enugu',
          locality: 'Enugu City',
          formattedAddress: 'Enugu, Enugu State, Nigeria',
          description:
            '100% natural honey from Enugu forests. No additives. Organic.',
          photoUrls: [],
          fuzzingLevel: 'exact',
          contactPreference: 'app',
          batchId: f5b1.id,
          status: 'active',
          expiresAt: daysAgo(-60),
        },
      ])
      .returningAll()
      .execute()

    // Create contact requests for listings
    await db
      .insertInto('listing_contact_requests')
      .values([
        {
          listingId: listings[0].id,
          buyerId: user.userId, // Using admin as placeholder buyer
          message:
            'Are these birds still available? Need 100 for this weekend.',
          contactMethod: 'phone',
          phoneNumber: '+234-802-333-4444',
          status: 'pending',
        },
        {
          listingId: listings[1].id,
          buyerId: user.userId,
          message: "What's your best price for 500 pieces?",
          contactMethod: 'app',
          status: 'responded',
          responseMessage: 'Best price is ₦1,300 per piece for bulk orders.',
          respondedAt: daysAgo(3),
        },
        {
          listingId: listings[2].id,
          buyerId: user.userId,
          message: 'Interested in all 5 heads. Can you deliver to Kano?',
          contactMethod: 'both',
          phoneNumber: '+234-804-555-6666',
          email: 'buyer@example.ng',
          status: 'accepted',
          responseMessage: 'Yes, delivery available. Contact me to arrange.',
          respondedAt: daysAgo(8),
        },
      ])
      .execute()

    console.log(`  ✅ Created ${listings.length} marketplace listings`)
    console.log('  ✅ Created contact requests\n')

    // ============ INVOICES ============
    console.log('📄 Creating invoices from sales...')

    // Get existing sales and convert to invoices
    const allSales = await db.selectFrom('sales').selectAll().execute()

    const invoices = await db
      .insertInto('invoices')
      .values(
        allSales.map((sale: any, index) => ({
          invoiceNumber: `INV-${String(new Date(sale.date).getFullYear())}-${String(index + 1).padStart(4, '0')}`,
          customerId: sale.customerId,
          farmId: sale.farmId,
          totalAmount: sale.totalAmount,
          status:
            sale.paymentStatus === 'paid'
              ? ('paid' as const)
              : ('unpaid' as const),
          date: sale.date,
          dueDate: daysAgo(-30), // Due 30 days from now
          paidDate: sale.paymentStatus === 'paid' ? sale.date : null,
          notes: null,
        })),
      )
      .returningAll()
      .execute()

    // Create invoice items
    for (let i = 0; i < allSales.length; i++) {
      const sale = allSales[i] as any
      await db
        .insertInto('invoice_items')
        .values({
          invoiceId: invoices[i].id,
          description: `${sale.livestockType} - ${sale.quantity} ${sale.unitType || 'units'}`,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          total: sale.totalAmount,
        })
        .execute()
    }

    console.log(`  ✅ Created ${invoices.length} invoices from sales`)
    console.log(`  ✅ Created invoice items\n`)

    // ============ EXTENSION WORKER ============
    console.log('⛑️ Creating extension worker visits and alerts...')

    // Create veterinary visits for each farm
    for (const farm of [farm1, farm2, farm3, farm4, farm5]) {
      const numVisits = 2 + Math.floor(Math.random() * 4) // 2-5 visits per farm in 6 months

      for (let i = 0; i < numVisits; i++) {
        const visitDate = daysAgo(Math.floor(Math.random() * 180)) // Random day in last 6 months

        await db
          .insertInto('visit_records')
          .values({
            farmId: farm.id,
            agentId: user.userId, // Using admin as placeholder extension agent
            visitDate: visitDate,
            visitType: Math.random() > 0.5 ? 'routine' : 'follow_up',
            findings:
              Math.random() > 0.8
                ? 'Overall good condition. Minor feed storage issues noted.'
                : 'Animals in good health. Recommended vaccination schedule.',
            recommendations:
              Math.random() > 0.7
                ? 'Improve ventilation in poultry house.'
                : 'Continue current management practices.',
            attachments: [],
            followUpDate: Math.random() > 0.7 ? daysAgo(-30) : null,
          })
          .execute()
      }
    }

    console.log('  ✅ Extension worker visits created\n')

    // ============ BREED DATA ============
    console.log('🐔 Seeding breed definitions...')
    const { ALL_BREEDS } = await import('./breeds-data')

    for (const breed of ALL_BREEDS) {
      await db
        .insertInto('breeds')
        .values({
          moduleKey: breed.moduleKey,
          speciesKey: breed.speciesKey,
          breedName: breed.breedName,
          displayName: breed.displayName,
          typicalMarketWeightG: breed.typicalMarketWeightG,
          typicalDaysToMarket: breed.typicalDaysToMarket,
          typicalFcr: breed.typicalFcr,
          sourceSizes: JSON.stringify(breed.sourceSizes),
          regions: JSON.stringify(breed.regions),
          isDefault: breed.isDefault ? 1 : 0,
        })
        .execute()
    }
    console.log(`  ✅ Seeded ${ALL_BREEDS.length} breed definitions\n`)

    // ============ FEED FORMULATION ============
    console.log('🌾 Seeding feed formulation data...')

    const { readFileSync: readFileSyncAsync } = await import('node:fs')
    const { join } = await import('node:path')
    const feedIngredientsData = JSON.parse(
      readFileSyncAsync(
        join(process.cwd(), 'app/lib/db/seeds/data/feed_ingredients.json'),
        'utf-8',
      ),
    )
    const ingredientsData = feedIngredientsData.feed_ingredients || []

    const nutritionalRequirementsData = JSON.parse(
      readFileSyncAsync(
        join(
          process.cwd(),
          'app/lib/db/seeds/data/nutritional_requirements.json',
        ),
        'utf-8',
      ),
    )
    const requirementsData =
      nutritionalRequirementsData.nutritional_requirements || []

    const ingredientIds: Array<string> = []
    for (const ingredient of ingredientsData) {
      const inserted = await db
        .insertInto('feed_ingredients')
        .values({
          name: ingredient.name,
          category: ingredient.category,
          proteinPercent: String(ingredient.protein_percent),
          energyKcalKg: ingredient.energy_kcal_kg,
          fatPercent: String(ingredient.fat_percent),
          fiberPercent: String(ingredient.fiber_percent),
          calciumPercent: String(ingredient.calcium_percent),
          phosphorusPercent: String(ingredient.phosphorus_percent),
          lysinePercent: String(ingredient.lysine_percent),
          methioninePercent: String(ingredient.methionine_percent),
          maxInclusionPercent: String(ingredient.max_inclusion_percent),
          isActive: true,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
      ingredientIds.push(inserted.id)
    }

    for (const req of requirementsData) {
      await db
        .insertInto('nutritional_requirements')
        .values({
          species: req.species,
          productionStage: req.stage,
          minProteinPercent: String(req.min_protein_percent),
          minEnergyKcalKg: req.min_energy_kcal_kg,
          maxFiberPercent: String(req.max_fiber_percent),
          minCalciumPercent: String(req.min_calcium_percent),
          minPhosphorusPercent: String(req.min_phosphorus_percent),
          minLysinePercent: String(req.min_lysine_percent),
          minMethioninePercent: String(req.min_methionine_percent),
        })
        .execute()
    }

    const savedFormulations = [
      {
        name: 'Broiler Starter - Cobb 500',
        species: 'Broiler',
        productionStage: 'starter',
        batchSizeKg: '100.00',
        ingredients: JSON.stringify([
          { ingredientId: 1, percentage: 45 },
          { ingredientId: 2, percentage: 25 },
          { ingredientId: 3, percentage: 10 },
          { ingredientId: 4, percentage: 5 },
          { ingredientId: 5, percentage: 3 },
          { ingredientId: 6, percentage: 2 },
          { ingredientId: 7, percentage: 10 },
        ]),
        totalCostPerKg: '450.00',
        nutritionalValues: JSON.stringify({
          protein: 22.5,
          energy: 3050,
          fiber: 4.2,
          calcium: 1.0,
          phosphorus: 0.45,
        }),
        userId: user.userId,
      },
      {
        name: 'Catfish Grower - Standard',
        species: 'catfish',
        productionStage: 'grower',
        batchSizeKg: '50.00',
        ingredients: JSON.stringify([
          { ingredientId: 8, percentage: 40 },
          { ingredientId: 9, percentage: 30 },
          { ingredientId: 10, percentage: 15 },
          { ingredientId: 11, percentage: 10 },
          { ingredientId: 6, percentage: 3 },
          { ingredientId: 7, percentage: 2 },
        ]),
        totalCostPerKg: '520.00',
        nutritionalValues: JSON.stringify({
          protein: 35.0,
          energy: 3200,
          fiber: 3.5,
          calcium: 1.2,
          phosphorus: 0.8,
        }),
        userId: user.userId,
      },
    ]

    for (const formulation of savedFormulations) {
      const savedForm = await db
        .insertInto('saved_formulations')
        .values({
          name: formulation.name,
          species: formulation.species,
          productionStage: formulation.productionStage,
          batchSizeKg: formulation.batchSizeKg,
          ingredients: formulation.ingredients,
          totalCostPerKg: formulation.totalCostPerKg,
          nutritionalValues: formulation.nutritionalValues,
          userId: formulation.userId,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const relevantBatches =
        formulation.species === 'Broiler'
          ? [f1b1.id]
          : formulation.species === 'catfish'
            ? [f2b1.id]
            : []

      for (const batchId of relevantBatches) {
        await db
          .insertInto('formulation_usage')
          .values({
            formulationId: savedForm.id,
            batchId: batchId,
            userId: user.userId,
            usedAt: monthsAgo(2),
            batchSizeKg: formulation.batchSizeKg,
            totalCost: String(
              parseFloat(formulation.totalCostPerKg) *
                parseFloat(formulation.batchSizeKg),
            ),
          })
          .execute()
      }
    }

    // Use actual ingredient UUIDs (indices 0, 1, 2, 7 from the inserted ingredients)
    const userPrices = [
      {
        userId: user.userId,
        ingredientId: ingredientIds[0],
        pricePerKg: '180.00',
      },
      {
        userId: user.userId,
        ingredientId: ingredientIds[1],
        pricePerKg: '220.00',
      },
      {
        userId: user.userId,
        ingredientId: ingredientIds[2],
        pricePerKg: '95.00',
      },
      {
        userId: user.userId,
        ingredientId: ingredientIds[7],
        pricePerKg: '120.00',
      },
    ]

    for (const price of userPrices) {
      if (price.ingredientId) {
        await db.insertInto('user_ingredient_prices').values(price).execute()
      }
    }

    console.log('  ✅ Feed formulation data seeded\n')

    // ============ EXTENSION WORKER GEOGRAPHY ============
    console.log('🌍 Seeding extension worker geography...')

    // First, get the Nigeria country UUID
    const nigeriaCountry = await db
      .selectFrom('countries')
      .select('id')
      .where('code', '=', 'NG')
      .executeTakeFirst()

    if (!nigeriaCountry) {
      console.log('  ⚠️ Nigeria country not found, skipping geography seeding')
    } else {
      const nigerianStates = [
        {
          code: 'KD',
          name: 'Kaduna',
          level: 1,
          slug: 'kaduna',
          parentId: null,
        },
        { code: 'KN', name: 'Kano', level: 1, slug: 'kano', parentId: null },
        { code: 'OY', name: 'Oyo', level: 1, slug: 'oyo', parentId: null },
        { code: 'EN', name: 'Enugu', level: 1, slug: 'enugu', parentId: null },
      ]

      const seededRegions: Array<any> = []

      for (const state of nigerianStates) {
        const region = await db
          .insertInto('regions')
          .values({
            countryId: nigeriaCountry.id,
            parentId: state.parentId,
            level: state.level,
            name: state.name,
            slug: state.slug,
            localizedNames: JSON.stringify({ en: state.name }),
            isActive: true,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
        seededRegions.push(region)
      }

      const kadunaRegion = seededRegions.find((r: any) => r.slug === 'kaduna')
      if (kadunaRegion) {
        await db
          .insertInto('user_districts')
          .values({
            userId: user.userId,
            districtId: kadunaRegion.id,
            isSupervisor: false,
          })
          .execute()
      }

      console.log('  ✅ Nigerian geography seeded\n')
    }

    // ============ AUDIT LOGS ============
    console.log('📋 Creating audit logs...')

    const auditActions = [
      {
        action: 'user.login',
        entityType: 'user',
        entityId: user.userId,
        details: { message: 'User logged in' },
        userId: user.userId,
      },
      {
        action: 'farm.create',
        entityType: 'farm',
        entityId: farm1.id,
        details: { message: 'Farm created: Sunrise Poultry Farm' },
        userId: user.userId,
      },
      {
        action: 'batch.create',
        entityType: 'batch',
        entityId: f1b1.id,
        details: { message: 'Batch created: BR-JAN-001' },
        userId: user.userId,
      },
      {
        action: 'sale.create',
        entityType: 'sale',
        entityId: f1b1.id,
        details: { message: 'Sale recorded: 50 broilers @ ₦3,500' },
        userId: user.userId,
      },
      {
        action: 'worker.create',
        entityType: 'worker',
        entityId: user.userId,
        details: { message: 'Worker profile created: Chinedu Okafor' },
        userId: user.userId,
      },
    ]

    for (const action of auditActions) {
      const auditDate = daysAgo(Math.floor(Math.random() * 30))
      await db
        .insertInto('audit_logs')
        .values({
          userId: action.userId,
          userName: user.name,
          action: action.action,
          entityType: action.entityType,
          entityId: action.entityId,
          details: JSON.stringify(action.details),
          ipAddress: '127.0.0.1',
          createdAt: auditDate,
        })
        .execute()
    }
    console.log('  ✅ Audit logs created\n')

    // ============ MARKETPLACE VIEWS ============
    console.log('👀 Creating marketplace view analytics...')

    const marketplaceListings = await db
      .selectFrom('marketplace_listings')
      .selectAll()
      .execute()

    for (const listing of marketplaceListings.slice(0, 5)) {
      const viewCount = 25 + Math.floor(Math.random() * 75)

      for (let i = 0; i < viewCount; i++) {
        const viewDate = daysAgo(Math.floor(Math.random() * 30))
        await db
          .insertInto('listing_views')
          .values({
            listingId: listing.id,
            viewerId: null,
            viewedAt: viewDate,
            viewerIp: '127.0.0.1',
          })
          .execute()
      }

      await db
        .updateTable('marketplace_listings')
        .set('viewCount', viewCount)
        .where('id', '=', listing.id)
        .execute()
    }
    console.log('  ✅ Marketplace views added\n')

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
    console.log('\n📋 DIGITAL FOREMAN:')
    console.log('  - 25-35 workers with realistic Nigerian names')
    console.log('  - 6 months of daily attendance records')
    console.log('  - Farm geofences for GPS verification')
    console.log('  - Tasks and assignments with completion tracking')
    console.log('  - 6 months of wage payments')
    console.log('\n🌡️ IOT SENSORS:')
    console.log('  - 10-15 sensors across all farms')
    console.log('  - 6 months of hourly readings (realistic patterns)')
    console.log('  - Temperature spikes and equipment alerts')
    console.log('\n⚖️  GROWTH TRACKING:')
    console.log('  - Weekly weight samples for all batches')
    console.log('  - Compared against growth standards')
    console.log('\n🏪 MARKETPLACE:')
    console.log('  - 5 active livestock listings')
    console.log('  - Buyer contact requests and negotiations')
    console.log('\n📄 INVOICES:')
    console.log('  - All sales converted to invoices')
    console.log('  - Invoice items with detailed breakdown')
    console.log('\n⛑️  EXTENSION WORKER:')
    console.log('  - Veterinary visit records')
    console.log('  - Disease outbreak alerts and monitoring')
    console.log('\n🔐 Login: admin@livestockai.local / password123\n')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

seedDev()
