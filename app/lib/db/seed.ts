/**
 * Database Seed Script
 *
 * Creates initial admin user and sample data for development/testing.
 * Run with: bun run db:seed
 */

import bcrypt from 'bcrypt'
import { db } from './index'

// Hash password using bcrypt (same as Better Auth)
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', 'admin@jayfarms.com')
      .executeTakeFirst()

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists, skipping user creation')
    } else {
      // Create admin user
      const adminUser = await db
        .insertInto('users')
        .values({
          email: 'admin@jayfarms.com',
          name: 'Admin User',
          role: 'admin',
          emailVerified: true,
        })
        .returning(['id', 'email', 'name'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created admin user: ${adminUser.email}`)

      // Create credential account for Better Auth (stores password)
      const hashedPassword = await hashPassword('admin123')
      await db
        .insertInto('account')
        .values({
          id: crypto.randomUUID(),
          userId: adminUser.id,
          accountId: adminUser.id, // For credential accounts, accountId = userId
          providerId: 'credential',
          password: hashedPassword,
        })
        .execute()

      console.log(`✅ Created credential account for admin`)

      // Create a sample farm
      const farm = await db
        .insertInto('farms')
        .values({
          name: 'JayFarms Main',
          location: 'Lagos, Nigeria',
          type: 'mixed',
        })
        .returning(['id', 'name'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created farm: ${farm.name}`)

      // Assign admin to farm
      await db
        .insertInto('user_farms')
        .values({
          userId: adminUser.id,
          farmId: farm.id,
        })
        .execute()

      console.log(`✅ Assigned admin to farm`)

      // Create sample batches
      const poultryBatch = await db
        .insertInto('batches')
        .values({
          farmId: farm.id,
          livestockType: 'poultry',
          species: 'Broiler',
          initialQuantity: 500,
          currentQuantity: 485,
          acquisitionDate: new Date('2025-01-01'),
          costPerUnit: '350.00',
          totalCost: '175000.00',
          status: 'active',
        })
        .returning(['id', 'species'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created batch: ${poultryBatch.species}`)

      const fishBatch = await db
        .insertInto('batches')
        .values({
          farmId: farm.id,
          livestockType: 'fish',
          species: 'Catfish',
          initialQuantity: 1000,
          currentQuantity: 980,
          acquisitionDate: new Date('2025-01-05'),
          costPerUnit: '150.00',
          totalCost: '150000.00',
          status: 'active',
        })
        .returning(['id', 'species'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created batch: ${fishBatch.species}`)

      // Create sample mortality records
      await db
        .insertInto('mortality_records')
        .values([
          {
            batchId: poultryBatch.id,
            quantity: 10,
            date: new Date('2025-01-05'),
            cause: 'disease',
            notes: 'Initial losses during first week',
          },
          {
            batchId: poultryBatch.id,
            quantity: 5,
            date: new Date('2025-01-07'),
            cause: 'unknown',
            notes: null,
          },
          {
            batchId: fishBatch.id,
            quantity: 15,
            date: new Date('2025-01-06'),
            cause: 'weather',
            notes: 'Temperature fluctuation',
          },
          {
            batchId: fishBatch.id,
            quantity: 5,
            date: new Date('2025-01-08'),
            cause: 'unknown',
            notes: null,
          },
        ])
        .execute()

      console.log(`✅ Created sample mortality records`)

      // Create sample supplier
      const supplier = await db
        .insertInto('suppliers')
        .values({
          name: 'FeedMaster Nigeria',
          phone: '+234 801 234 5678',
          email: 'sales@feedmaster.ng',
          location: 'Ibadan, Nigeria',
          products: ['starter', 'grower', 'finisher', 'fish_feed'],
        })
        .returning(['id', 'name'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created supplier: ${supplier.name}`)

      // Create sample customer
      const customer = await db
        .insertInto('customers')
        .values({
          name: 'Alhaji Musa',
          phone: '+234 802 345 6789',
          email: 'musa@example.com',
          location: 'Kano, Nigeria',
        })
        .returning(['id', 'name'])
        .executeTakeFirstOrThrow()

      console.log(`✅ Created customer: ${customer.name}`)

      // Create sample feed records
      await db
        .insertInto('feed_records')
        .values([
          {
            batchId: poultryBatch.id,
            feedType: 'starter',
            quantityKg: '50.00',
            cost: '25000.00',
            date: new Date('2025-01-02'),
            supplierId: supplier.id,
          },
          {
            batchId: fishBatch.id,
            feedType: 'fish_feed',
            quantityKg: '30.00',
            cost: '18000.00',
            date: new Date('2025-01-06'),
            supplierId: supplier.id,
          },
        ])
        .execute()

      console.log(`✅ Created sample feed records`)
    }

    console.log('\n🎉 Database seed completed successfully!')
    console.log('\n📝 Login credentials:')
    console.log('   Email: admin@jayfarms.com')
    console.log('   Password: admin123')
    console.log('\n⚠️  Remember to change the password in production!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await db.destroy()
  }
}

// Run seed
seed()
