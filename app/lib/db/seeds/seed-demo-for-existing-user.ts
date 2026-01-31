// @ts-nocheck
/**
 * Demo Data Seeder for Existing User
 *
 * Seeds realistic Nigerian farm demo data for an EXISTING user.
 * Does NOT create a new user or delete existing data.
 *
 * Environment variable required:
 *   DEMO_USER_EMAIL - Email of the existing user to seed data for
 *
 * Run: DEMO_USER_EMAIL=user@example.com bun run db:seed:demo
 *
 * Creates:
 * - 5 Nigerian farms (Poultry, Fish, Mixed, Livestock, Bees)
 * - 8 batches across all 6 livestock types
 * - Suppliers, customers, sales, invoices, expenses
 * - Feed records, mortality, vaccinations, weight samples
 * - Inventory (feed, medication, supplies)
 * - Breed definitions and feed formulation data
 *
 * Skips (for performance):
 * - Digital Foreman (workers, check-ins, tasks)
 * - Payroll
 * - IoT Sensors & Readings
 * - Marketplace
 * - Extension Worker
 */

import { db } from '../index'

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
const pickSalesPayment = () => {
  const r = Math.random()
  if (r < 0.5) return 'mobile_money'
  if (r < 0.8) return 'cash'
  return 'transfer'
}

// ============ MAIN SEED ============
export async function seedDemoForExistingUser() {
  const userEmail = process.env.DEMO_USER_EMAIL

  if (!userEmail) {
    console.error('❌ DEMO_USER_EMAIL environment variable is required')
    console.error(
      '   Usage: DEMO_USER_EMAIL=user@example.com bun run db:seed:demo',
    )
    process.exit(1)
  }

  console.log('🌱 Seeding Demo Data for Existing User\n')
  console.log(`📧 User email: ${userEmail}`)
  console.log(`📅 Reference date: ${TODAY.toISOString().split('T')[0]}\n`)

  try {
    // ============ FIND EXISTING USER ============
    console.log('👤 Looking up existing user...')
    const user = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', userEmail)
      .executeTakeFirst()

    if (!user) {
      console.error(`❌ User not found: ${userEmail}`)
      console.error('   Make sure the user exists before running this seeder.')
      process.exit(1)
    }

    console.log(`  ✅ Found user: ${user.name} (${user.email})\n`)

    // ============ USER SETTINGS ============
    console.log('⚙️  Checking/creating user settings...')
    const existingSettings = await db
      .selectFrom('user_settings')
      .selectAll()
      .where('userId', '=', user.id)
      .executeTakeFirst()

    if (!existingSettings) {
      await db
        .insertInto('user_settings')
        .values({
          userId: user.id,
          currencyCode: 'NGN',
          currencySymbol: '₦',
          currencyDecimals: 2,
          currencySymbolPosition: 'before',
          thousandSeparator: ',',
          decimalSeparator: '.',
          dateFormat: 'DD/MM/YYYY',
          timeFormat: '24h',
          firstDayOfWeek: 1,
          weightUnit: 'kg',
          areaUnit: 'sqm',
          temperatureUnit: 'celsius',
          language: 'en',
          theme: 'system',
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
        })
        .execute()
      console.log('  ✅ User settings created (NGN)\n')
    } else {
      console.log('  ✅ User settings already exist\n')
    }

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
      .values({ userId: user.id, farmId: farm1.id, role: 'owner' })
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

    // ============ CUSTOMERS (linked to farm1) ============
    console.log('👥 Creating customers...')
    const customers = await db
      .insertInto('customers')
      .values([
        {
          farmId: farm1.id,
          name: 'Mama Ngozi',
          phone: '+234-802-111-2222',
          location: 'Kaduna Market',
          customerType: 'individual',
        },
        {
          farmId: farm1.id,
          name: 'Chicken Republic',
          phone: '+234-803-222-3333',
          email: 'procurement@chickenrepublic.ng',
          location: 'Abuja',
          customerType: 'restaurant',
        },
        {
          farmId: farm1.id,
          name: 'Shoprite Kaduna',
          phone: '+234-804-333-4444',
          email: 'meat@shoprite.ng',
          location: 'Kaduna',
          customerType: 'retailer',
        },
        {
          farmId: farm1.id,
          name: 'Yellow Chilli Restaurant',
          phone: '+234-805-444-5555',
          email: 'chef@yellowchilli.ng',
          location: 'Ibadan',
          customerType: 'restaurant',
        },
        {
          farmId: farm1.id,
          name: 'Fish Wholesalers Ltd',
          phone: '+234-806-555-6666',
          location: 'Lagos',
          customerType: 'wholesaler',
        },
        {
          farmId: farm1.id,
          name: 'Kano Abattoir',
          phone: '+234-807-666-7777',
          location: 'Kano',
          customerType: 'processor',
        },
        {
          farmId: farm1.id,
          name: 'Federal Ministry of Agriculture',
          phone: '+234-808-777-8888',
          email: 'procurement@fmard.gov.ng',
          location: 'Abuja',
          customerType: 'government',
        },
        {
          farmId: farm1.id,
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
        acquisitionDate: daysAgo(56),
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
        { batchId: f1b1.id, quantity: 1, date: daysAgo(10), cause: 'injury' },
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
        customerId: customers[1].id,
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
          userId: user.id,
          farmId: farm1.id,
          type: 'lowStock',
          title: 'Low Feed Stock',
          message: 'Starter feed is below minimum threshold (25kg / 50kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: { feedType: 'starter', currentKg: 25, minKg: 50 },
        },
        {
          userId: user.id,
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
      .values({ userId: user.id, farmId: farm2.id, role: 'owner' })
      .execute()

    await db
      .insertInto('farm_modules')
      .values([{ farmId: farm2.id, moduleKey: 'aquaculture', enabled: true }])
      .execute()

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

    await db
      .insertInto('sales')
      .values({
        farmId: farm2.id,
        batchId: f2b1.id,
        customerId: customers[3].id,
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
      .values({ userId: user.id, farmId: farm3.id, role: 'owner' })
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
      .values({ userId: user.id, farmId: farm4.id, role: 'owner' })
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

    await db
      .insertInto('sales')
      .values({
        farmId: farm4.id,
        batchId: f4b1.id,
        customerId: customers[5].id,
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
      .values({ userId: user.id, farmId: farm5.id, role: 'owner' })
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

    await db
      .insertInto('sales')
      .values({
        farmId: farm5.id,
        batchId: f5b1.id,
        customerId: customers[7].id,
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

    await db
      .insertInto('supplies_inventory')
      .values([
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
          userId: user.id,
          farmId: farm2.id,
          type: 'lowStock',
          title: 'Low Fish Feed Stock',
          message: 'Fish feed is below minimum threshold (150kg / 200kg)',
          read: false,
          actionUrl: '/inventory',
          metadata: { feedType: 'fish_feed', currentKg: 150, minKg: 200 },
        },
        {
          userId: user.id,
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

    // ============ TASKS ============
    console.log('📋 Creating tasks...')

    // Farm 1: Poultry tasks
    await db
      .insertInto('tasks')
      .values([
        // Farm-level tasks
        { farmId: farm1.id, title: 'Check water supply', description: 'Ensure all drinkers are working and clean', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, title: 'Clean feeders', description: 'Remove old feed and clean feeders', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, title: 'Inspect ventilation', description: 'Check fans and air flow in all houses', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, title: 'Deep clean poultry house', description: 'Full sanitation of house including disinfection', frequency: 'weekly', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, title: 'Restock supplies', description: 'Check and reorder feed, medication, bedding', frequency: 'weekly', moduleKey: 'poultry', isDefault: false },
        { farmId: farm1.id, title: 'Equipment maintenance', description: 'Service feeders, drinkers, and ventilation systems', frequency: 'monthly', moduleKey: 'poultry', isDefault: false },
        // Batch-specific tasks
        { farmId: farm1.id, batchId: f1b1.id, title: 'Morning feeding', description: 'Feed BR-JAN-001 batch - check consumption', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, batchId: f1b1.id, title: 'Evening feeding', description: 'Second feeding for BR-JAN-001', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, batchId: f1b1.id, title: 'Record mortality', description: 'Count and record any deaths in BR-JAN-001', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm1.id, batchId: f1b1.id, title: 'Weigh sample birds', description: 'Weigh 10 birds from BR-JAN-001 for growth tracking', frequency: 'weekly', moduleKey: 'poultry', isDefault: true },
      ])
      .execute()

    // Farm 2: Fish tasks
    await db
      .insertInto('tasks')
      .values([
        // Farm-level tasks
        { farmId: farm2.id, title: 'Check water quality', description: 'Test pH, DO, ammonia levels', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, title: 'Inspect aerators', description: 'Ensure all aerators are functioning', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, title: 'Clean pond filters', description: 'Remove debris from filters and screens', frequency: 'weekly', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, title: 'Partial water change', description: 'Replace 20% of pond water', frequency: 'weekly', moduleKey: 'aquaculture', isDefault: false },
        { farmId: farm2.id, title: 'Full pond maintenance', description: 'Deep clean, check liners, service equipment', frequency: 'monthly', moduleKey: 'aquaculture', isDefault: false },
        // Batch-specific tasks
        { farmId: farm2.id, batchId: f2b1.id, title: 'Morning feeding', description: 'Feed CF-OCT-001 catfish batch', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, batchId: f2b1.id, title: 'Evening feeding', description: 'Second feeding for CF-OCT-001', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, batchId: f2b1.id, title: 'Check fish behavior', description: 'Observe for signs of stress or disease', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm2.id, batchId: f2b1.id, title: 'Sample weighing', description: 'Net and weigh sample fish from CF-OCT-001', frequency: 'weekly', moduleKey: 'aquaculture', isDefault: true },
      ])
      .execute()

    // Farm 3: Mixed farm tasks
    await db
      .insertInto('tasks')
      .values([
        // Farm-level tasks
        { farmId: farm3.id, title: 'General farm inspection', description: 'Walk-through of all facilities', frequency: 'daily', isDefault: true },
        { farmId: farm3.id, title: 'Check all water systems', description: 'Inspect drinkers and pond water', frequency: 'daily', isDefault: true },
        { farmId: farm3.id, title: 'Weekly inventory check', description: 'Count feed, medication, supplies', frequency: 'weekly', isDefault: true },
        // Batch-specific tasks
        { farmId: farm3.id, batchId: f3b1.id, title: 'Feed broilers', description: 'Morning and evening feeding for BR-DEC-001', frequency: 'daily', moduleKey: 'poultry', isDefault: true },
        { farmId: farm3.id, batchId: f3b2.id, title: 'Feed catfish', description: 'Feeding for CF-NOV-001 pond', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
        { farmId: farm3.id, batchId: f3b2.id, title: 'Test pond water', description: 'Water quality check for CF-NOV-001', frequency: 'daily', moduleKey: 'aquaculture', isDefault: true },
      ])
      .execute()

    // Farm 4: Livestock ranch tasks
    await db
      .insertInto('tasks')
      .values([
        // Farm-level tasks
        { farmId: farm4.id, title: 'Check pasture fencing', description: 'Inspect all fences for damage', frequency: 'daily', isDefault: true },
        { farmId: farm4.id, title: 'Fill water troughs', description: 'Ensure all troughs have clean water', frequency: 'daily', isDefault: true },
        { farmId: farm4.id, title: 'Inspect animal health', description: 'Visual check of all animals for illness', frequency: 'daily', isDefault: true },
        { farmId: farm4.id, title: 'Rotate pastures', description: 'Move animals to fresh grazing area', frequency: 'weekly', isDefault: false },
        { farmId: farm4.id, title: 'Hoof inspection', description: 'Check hooves on cattle and goats', frequency: 'monthly', isDefault: false },
        // Batch-specific tasks
        { farmId: farm4.id, batchId: f4b1.id, title: 'Feed cattle supplements', description: 'Provide mineral blocks and supplements to CATTLE-2025', frequency: 'daily', moduleKey: 'cattle', isDefault: true },
        { farmId: farm4.id, batchId: f4b1.id, title: 'Weigh cattle', description: 'Monthly weight check for CATTLE-2025 herd', frequency: 'monthly', moduleKey: 'cattle', isDefault: true },
        { farmId: farm4.id, batchId: f4b2.id, title: 'Feed goats', description: 'Morning feeding for GOATS-2025', frequency: 'daily', moduleKey: 'goats', isDefault: true },
        { farmId: farm4.id, batchId: f4b2.id, title: 'Check goat shelter', description: 'Ensure shelter is clean and dry', frequency: 'daily', moduleKey: 'goats', isDefault: true },
      ])
      .execute()

    // Farm 5: Apiary tasks
    await db
      .insertInto('tasks')
      .values([
        // Farm-level tasks
        { farmId: farm5.id, title: 'Visual hive inspection', description: 'Check hive entrances for activity', frequency: 'daily', moduleKey: 'bees', isDefault: true },
        { farmId: farm5.id, title: 'Check water source', description: 'Ensure bees have access to clean water', frequency: 'daily', moduleKey: 'bees', isDefault: true },
        { farmId: farm5.id, title: 'Full hive inspection', description: 'Open hives, check frames, look for queen', frequency: 'weekly', moduleKey: 'bees', isDefault: true },
        { farmId: farm5.id, title: 'Pest monitoring', description: 'Check for varroa mites and hive beetles', frequency: 'weekly', moduleKey: 'bees', isDefault: true },
        { farmId: farm5.id, title: 'Harvest honey', description: 'Extract honey from ready frames', frequency: 'monthly', moduleKey: 'bees', isDefault: false },
        // Batch-specific tasks
        { farmId: farm5.id, batchId: f5b1.id, title: 'Check COLONY-A strength', description: 'Count frames of bees and brood', frequency: 'weekly', moduleKey: 'bees', isDefault: true },
        { farmId: farm5.id, batchId: f5b1.id, title: 'Feed COLONY-A if needed', description: 'Provide sugar syrup if stores are low', frequency: 'weekly', moduleKey: 'bees', isDefault: false },
      ])
      .execute()

    // Create some task completions for the user (recent completions)
    const allTasks = await db.selectFrom('tasks').select(['id', 'farmId', 'frequency']).execute()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Complete some daily tasks for today and yesterday
    for (const task of allTasks.filter(t => t.frequency === 'daily').slice(0, 10)) {
      // Yesterday's completion
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      await db
        .insertInto('task_completions')
        .values({
          taskId: task.id,
          userId: user.id,
          completedAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 8 AM
          periodStart: yesterday,
        })
        .execute()
    }

    // Complete some weekly tasks
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of week
    for (const task of allTasks.filter(t => t.frequency === 'weekly').slice(0, 5)) {
      await db
        .insertInto('task_completions')
        .values({
          taskId: task.id,
          userId: user.id,
          completedAt: new Date(weekStart.getTime() + 2 * 24 * 60 * 60 * 1000), // Tuesday
          periodStart: weekStart,
        })
        .execute()
    }

    console.log(`  ✅ Created ${allTasks.length} tasks with completions\n`)

    // ============ BREED DATA ============
    console.log('🐔 Seeding breed definitions...')
    const { ALL_BREEDS } = await import('./breeds-data')

    // Check if breeds already exist
    const existingBreeds = await db.selectFrom('breeds').select('id').execute()
    if (existingBreeds.length === 0) {
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
    } else {
      console.log(
        `  ✅ Breed definitions already exist (${existingBreeds.length} breeds)\n`,
      )
    }

    // ============ FEED FORMULATION ============
    console.log('🌾 Seeding feed formulation data...')

    // Check if feed ingredients already exist
    const existingIngredients = await db
      .selectFrom('feed_ingredients')
      .select('id')
      .execute()

    if (existingIngredients.length === 0) {
      const { readFileSync } = await import('node:fs')
      const { join } = await import('node:path')

      const feedIngredientsData = JSON.parse(
        readFileSync(
          join(process.cwd(), 'app/lib/db/seeds/data/feed_ingredients.json'),
          'utf-8',
        ),
      )
      const ingredientsData = feedIngredientsData.feed_ingredients || []

      const nutritionalRequirementsData = JSON.parse(
        readFileSync(
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

      // Saved formulations
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
            userId: user.id,
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
              userId: user.id,
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

      // User ingredient prices
      const userPrices = [
        {
          userId: user.id,
          ingredientId: ingredientIds[0],
          pricePerKg: '180.00',
        },
        {
          userId: user.id,
          ingredientId: ingredientIds[1],
          pricePerKg: '220.00',
        },
        {
          userId: user.id,
          ingredientId: ingredientIds[2],
          pricePerKg: '95.00',
        },
        {
          userId: user.id,
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
    } else {
      console.log(
        `  ✅ Feed formulation data already exists (${existingIngredients.length} ingredients)\n`,
      )
    }

    // ============ AUDIT LOGS ============
    console.log('📋 Creating audit logs...')
    const auditActions = [
      {
        action: 'user.login',
        entityType: 'user',
        entityId: user.id,
        details: { message: 'User logged in' },
      },
      {
        action: 'farm.create',
        entityType: 'farm',
        entityId: farm1.id,
        details: { message: 'Farm created: Sunrise Poultry Farm' },
      },
      {
        action: 'batch.create',
        entityType: 'batch',
        entityId: f1b1.id,
        details: { message: 'Batch created: BR-JAN-001' },
      },
      {
        action: 'sale.create',
        entityType: 'sale',
        entityId: f1b1.id,
        details: { message: 'Sale recorded: 50 broilers @ ₦5,500' },
      },
    ]

    for (const action of auditActions) {
      const auditDate = daysAgo(Math.floor(Math.random() * 30))
      await db
        .insertInto('audit_logs')
        .values({
          userId: user.id,
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

    // ============ SUMMARY ============
    console.log('✅ Demo data seeding complete!\n')
    console.log('📊 Summary:')
    console.log('  - 5 farms (Poultry, Fish, Mixed, Livestock, Bees)')
    console.log('  - 8 batches across all 6 livestock types')
    console.log('  - 8 customers (all types)')
    console.log('  - 5 suppliers (all types)')
    console.log('  - Complete interconnected records')
    console.log('  - Feed, mortality, vaccinations, weight samples')
    console.log('  - Sales, invoices, expenses')
    console.log('  - Inventory (feed, medication, supplies)')
    console.log('  - Tasks (farm-level and batch-specific) with completions')
    console.log('  - Breed definitions and feed formulation')
    console.log('  - Notifications and audit logs')
    console.log('\n⏭️  Skipped (for performance):')
    console.log('  - Digital Foreman (workers, check-ins, tasks)')
    console.log('  - Payroll')
    console.log('  - IoT Sensors & Readings')
    console.log('  - Marketplace')
    console.log('  - Extension Worker')
    console.log(`\n🔐 User: ${user.email}\n`)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

seedDemoForExistingUser()
