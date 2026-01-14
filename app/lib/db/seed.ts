/**
 * Production Seeder - OpenLivestock Manager
 *
 * Seeds minimal data required to bootstrap a fresh production instance:
 * - Admin user (from env vars or defaults)
 * - User settings for admin
 * - Growth standards for all supported species
 * - Market prices reference data
 *
 * NO farms, batches, customers, suppliers, or transactional data.
 *
 * Run: bun run db:seed
 *
 * For development/demo data, use: bun run db:seed:dev
 */

import { createUserWithAuth } from './seed-helpers'
import { db } from './index'
import { DEFAULT_SETTINGS } from '~/features/settings/currency-presets'

// ============ CONFIG ============
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@openlivestock.local'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123'
const ADMIN_NAME = process.env.ADMIN_NAME || 'Farm Administrator'

// ============ GROWTH STANDARDS DATA ============
function generateBroilerGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Cobb500 Broiler growth curve (industry standard)
  // Reference points: d0=42g, d7=180g, d14=450g, d21=900g, d28=1500g, d35=2000g, d42=2800g, d49=3600g, d56=4500g
  const cobbPoints = [42, 180, 450, 900, 1500, 2000, 2800, 3600, 4500]
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []

  for (let i = 0; i < cobbPoints.length - 1; i++) {
    const startDay = i * 7
    const startWeight = cobbPoints[i]
    const endWeight = cobbPoints[i + 1]
    for (let d = 0; d < 7; d++) {
      const day = startDay + d
      const weight = Math.round(
        startWeight + ((endWeight - startWeight) / 7) * d,
      )
      data.push({ species: 'Broiler', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Broiler', day: 56, expected_weight_g: 4500 })
  return data
}

function generateCatfishGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Catfish growth curve (jumbo fingerlings)
  // Reference points: M0=10g, M1=50g, M2=200g, M3=500g, M4=900g, M5=1200g, M6=1500g
  const fishPoints = [10, 50, 200, 500, 900, 1200, 1500]
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []

  for (let i = 0; i < fishPoints.length - 1; i++) {
    const startDay = i * 30
    const startWeight = fishPoints[i]
    const endWeight = fishPoints[i + 1]
    for (let d = 0; d < 30; d++) {
      const day = startDay + d
      const weight = Math.round(
        startWeight + ((endWeight - startWeight) / 30) * d,
      )
      data.push({ species: 'Catfish', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Catfish', day: 180, expected_weight_g: 1500 })
  return data
}

function generateLayerGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Layer chicken growth curve (Hy-Line Brown reference)
  // Slower growth than broilers, reaches ~1.8kg at point-of-lay (18 weeks)
  const layerPoints = [
    40, 100, 200, 350, 550, 750, 950, 1100, 1250, 1400, 1500, 1600, 1700, 1750,
    1800,
  ]
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []

  for (let i = 0; i < layerPoints.length - 1; i++) {
    const startDay = i * 7
    const startWeight = layerPoints[i]
    const endWeight = layerPoints[i + 1]
    for (let d = 0; d < 7; d++) {
      const day = startDay + d
      const weight = Math.round(
        startWeight + ((endWeight - startWeight) / 7) * d,
      )
      data.push({ species: 'Layer', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Layer', day: 98, expected_weight_g: 1800 })
  return data
}

function generateTilapiaGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Tilapia growth curve
  // Reference points: M0=5g, M1=30g, M2=80g, M3=180g, M4=350g, M5=500g, M6=700g
  const tilapiaPoints = [5, 30, 80, 180, 350, 500, 700]
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []

  for (let i = 0; i < tilapiaPoints.length - 1; i++) {
    const startDay = i * 30
    const startWeight = tilapiaPoints[i]
    const endWeight = tilapiaPoints[i + 1]
    for (let d = 0; d < 30; d++) {
      const day = startDay + d
      const weight = Math.round(
        startWeight + ((endWeight - startWeight) / 30) * d,
      )
      data.push({ species: 'Tilapia', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Tilapia', day: 180, expected_weight_g: 700 })
  return data
}

// ============ MARKET PRICES DATA ============
function getMarketPrices(): Array<{
  species: string
  size_category: string
  price_per_unit: string
}> {
  return [
    // Broiler prices (per bird)
    {
      species: 'Broiler',
      size_category: '1.5kg-1.8kg',
      price_per_unit: '4500',
    },
    {
      species: 'Broiler',
      size_category: '1.8kg-2.2kg',
      price_per_unit: '5500',
    },
    { species: 'Broiler', size_category: '2.5kg+', price_per_unit: '10500' },
    // Layer prices (per bird - point-of-lay)
    {
      species: 'Layer',
      size_category: 'Point-of-lay (16-18wks)',
      price_per_unit: '3500',
    },
    { species: 'Layer', size_category: 'Spent hen', price_per_unit: '2500' },
    // Catfish prices (per kg)
    {
      species: 'Catfish',
      size_category: 'Melange (400-600g)',
      price_per_unit: '2500',
    },
    {
      species: 'Catfish',
      size_category: 'Table Size (600g-1kg)',
      price_per_unit: '3000',
    },
    {
      species: 'Catfish',
      size_category: 'Jumbo (1kg+)',
      price_per_unit: '3500',
    },
    // Tilapia prices (per kg)
    {
      species: 'Tilapia',
      size_category: 'Small (200-350g)',
      price_per_unit: '1800',
    },
    {
      species: 'Tilapia',
      size_category: 'Medium (350-500g)',
      price_per_unit: '2200',
    },
    {
      species: 'Tilapia',
      size_category: 'Large (500g+)',
      price_per_unit: '2800',
    },
    // Eggs (per crate of 30)
    {
      species: 'Eggs',
      size_category: 'Crate (30 eggs)',
      price_per_unit: '3200',
    },
  ]
}

// ============ MAIN SEED ============
export async function seed() {
  console.log('🌱 Seeding OpenLivestock Production Data\n')

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .selectFrom('users')
      .where('email', '=', ADMIN_EMAIL)
      .selectAll()
      .executeTakeFirst()

    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`)
      console.log('   Skipping user creation. Updating reference data only.\n')
    } else {
      // CREATE ADMIN USER
      // Uses Better Auth-compatible user creation helper that:
      // - Creates entry in users table (without password)
      // - Creates entry in account table with hashed password
      // - Sets providerId='credential' and accountId=email
      // Reference: https://www.better-auth.com/docs/concepts/users-accounts
      console.log('👤 Creating admin user...')
      const result = await createUserWithAuth(db, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
        role: 'admin',
      })

      console.log(`   ✅ Admin: ${ADMIN_EMAIL}`)

      // USER SETTINGS
      console.log('⚙️  Creating user settings...')
      await db
        .insertInto('user_settings')
        .values({
          userId: result.userId,
          ...DEFAULT_SETTINGS,
        })
        .execute()
      console.log('   ✅ User settings created\n')
    }

    // GROWTH STANDARDS
    console.log('📈 Seeding growth standards...')

    // Clear existing growth standards
    await db.deleteFrom('growth_standards').execute()

    const broilerStandards = generateBroilerGrowthStandards()
    const layerStandards = generateLayerGrowthStandards()
    const catfishStandards = generateCatfishGrowthStandards()
    const tilapiaStandards = generateTilapiaGrowthStandards()

    const allStandards = [
      ...broilerStandards,
      ...layerStandards,
      ...catfishStandards,
      ...tilapiaStandards,
    ]

    await db.insertInto('growth_standards').values(allStandards).execute()
    console.log(`   ✅ ${allStandards.length} growth standard entries`)
    console.log(`      • Broiler: ${broilerStandards.length} days`)
    console.log(`      • Layer: ${layerStandards.length} days`)
    console.log(`      • Catfish: ${catfishStandards.length} days`)
    console.log(`      • Tilapia: ${tilapiaStandards.length} days\n`)

    // MARKET PRICES
    console.log('💰 Seeding market prices...')

    // Clear existing market prices
    await db.deleteFrom('market_prices').execute()

    const marketPrices = getMarketPrices()
    await db.insertInto('market_prices').values(marketPrices).execute()
    console.log(`   ✅ ${marketPrices.length} market price entries\n`)

    // SUMMARY
    console.log('═'.repeat(50))
    console.log('🎉 PRODUCTION SEED COMPLETE!')
    console.log('═'.repeat(50))
    console.log('\n📋 What was seeded:')
    console.log(`   • Admin user: ${ADMIN_EMAIL}`)
    console.log('   • Growth standards: Broiler, Layer, Catfish, Tilapia')
    console.log('   • Market prices: Reference pricing data')
    console.log('\n🔐 Login credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(
      `   Password: ${ADMIN_PASSWORD === 'password123' ? 'password123 (default)' : '(from ADMIN_PASSWORD env var)'}`,
    )
    console.log('\n💡 For demo data with farms, batches, and transactions:')
    console.log('   bun run db:seed:dev\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
