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

import { db } from '../index'
import { createUserWithAuth } from './helpers'
import { DEFAULT_SETTINGS } from '~/features/settings/currency-presets'

// ============ CONFIG ============
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

function generateCattleGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Beef cattle growth curve (Angus/Hereford type)
  // Birth ~35kg, weaning (7mo) ~250kg, yearling ~400kg, finish (18mo) ~550kg
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []
  const points = [
    { day: 0, weight: 35000 },
    { day: 210, weight: 250000 }, // 7 months weaning
    { day: 365, weight: 400000 }, // 12 months
    { day: 540, weight: 550000 }, // 18 months finish
  ]

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const days = end.day - start.day
    for (let d = 0; d < days; d += 7) {
      // Weekly intervals for cattle
      const day = start.day + d
      const weight = Math.round(
        start.weight + ((end.weight - start.weight) / days) * d,
      )
      data.push({ species: 'Cattle', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Cattle', day: 540, expected_weight_g: 550000 })
  return data
}

function generateGoatGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Meat goat growth curve (Boer type)
  // Birth ~3.5kg, weaning (3mo) ~20kg, 6mo ~30kg, 12mo ~45kg
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []
  const points = [
    { day: 0, weight: 3500 },
    { day: 90, weight: 20000 }, // 3 months weaning
    { day: 180, weight: 30000 }, // 6 months
    { day: 365, weight: 45000 }, // 12 months market
  ]

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const days = end.day - start.day
    for (let d = 0; d < days; d += 7) {
      const day = start.day + d
      const weight = Math.round(
        start.weight + ((end.weight - start.weight) / days) * d,
      )
      data.push({ species: 'Goat', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Goat', day: 365, expected_weight_g: 45000 })
  return data
}

function generateSheepGrowthStandards(): Array<{
  species: string
  day: number
  expected_weight_g: number
}> {
  // Meat sheep growth curve (Dorper/Suffolk type)
  // Birth ~4kg, weaning (3mo) ~25kg, 6mo ~40kg, 12mo ~55kg
  const data: Array<{
    species: string
    day: number
    expected_weight_g: number
  }> = []
  const points = [
    { day: 0, weight: 4000 },
    { day: 90, weight: 25000 }, // 3 months weaning
    { day: 180, weight: 40000 }, // 6 months
    { day: 365, weight: 55000 }, // 12 months market
  ]

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const days = end.day - start.day
    for (let d = 0; d < days; d += 7) {
      const day = start.day + d
      const weight = Math.round(
        start.weight + ((end.weight - start.weight) / days) * d,
      )
      data.push({ species: 'Sheep', day, expected_weight_g: weight })
    }
  }
  data.push({ species: 'Sheep', day: 365, expected_weight_g: 55000 })
  return data
}

// Note: Bees don't have weight-based growth standards
// Colony strength is measured by frame count, not weight

// NOTE: Market prices removed - users enter their own target prices per batch
// This makes the app international (not Nigeria-specific)
// Regional market data packages can be added as a future enhancement
// See: .agents/plans/regional-market-packages.md

// ============ MAIN SEED ============
export async function seed() {
  console.log('🌱 Seeding OpenLivestock Production Data\n')

  // SECURITY: Require explicit admin credentials
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL environment variable is required')
    console.error('   Set ADMIN_EMAIL before running production seed')
    process.exit(1)
  }

  if (!process.env.ADMIN_PASSWORD) {
    console.error('❌ ADMIN_PASSWORD environment variable is required')
    console.error('   Set ADMIN_PASSWORD before running production seed')
    process.exit(1)
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

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

    // BREEDS
    console.log('🐄 Seeding breeds...')

    // Clear existing breeds
    await db.deleteFrom('breeds').execute()

    const { ALL_BREEDS } = await import('./breeds-data')
    // Convert arrays to JSON strings for JSONB columns
    const breedsWithJsonb = ALL_BREEDS.map((breed) => ({
      ...breed,
      sourceSizes: JSON.stringify(breed.sourceSizes) as any,
      regions: JSON.stringify(breed.regions) as any,
    }))
    await db.insertInto('breeds').values(breedsWithJsonb).execute()
    console.log(`   ✅ ${ALL_BREEDS.length} breeds seeded`)
    console.log(`      • Poultry: 5 breeds`)
    console.log(`      • Aquaculture: 4 breeds`)
    console.log(`      • Cattle: 5 breeds`)
    console.log(`      • Goats: 4 breeds`)
    console.log(`      • Sheep: 4 breeds`)
    console.log(`      • Bees: 2 breeds\n`)

    // GROWTH STANDARDS
    console.log('📈 Seeding growth standards...')

    // Clear existing growth standards
    await db.deleteFrom('growth_standards').execute()

    const broilerStandards = generateBroilerGrowthStandards()
    const layerStandards = generateLayerGrowthStandards()
    const catfishStandards = generateCatfishGrowthStandards()
    const tilapiaStandards = generateTilapiaGrowthStandards()
    const cattleStandards = generateCattleGrowthStandards()
    const goatStandards = generateGoatGrowthStandards()
    const sheepStandards = generateSheepGrowthStandards()

    const allStandards = [
      ...broilerStandards,
      ...layerStandards,
      ...catfishStandards,
      ...tilapiaStandards,
      ...cattleStandards,
      ...goatStandards,
      ...sheepStandards,
    ]

    await db.insertInto('growth_standards').values(allStandards).execute()
    console.log(`   ✅ ${allStandards.length} species-level growth standards`)
    console.log(`      • Broiler: ${broilerStandards.length} days`)
    console.log(`      • Layer: ${layerStandards.length} days`)
    console.log(`      • Catfish: ${catfishStandards.length} days`)
    console.log(`      • Tilapia: ${tilapiaStandards.length} days`)
    console.log(`      • Cattle: ${cattleStandards.length} weeks`)
    console.log(`      • Goat: ${goatStandards.length} weeks`)
    console.log(`      • Sheep: ${sheepStandards.length} weeks\n`)

    // BREED-SPECIFIC GROWTH CURVES
    console.log('📊 Seeding breed-specific growth curves...')

    const { BREED_GROWTH_CURVES } = await import('./breed-growth-curves')

    // Get breed IDs
    const breeds = await db
      .selectFrom('breeds')
      .select(['id', 'breedName'])
      .execute()

    const breedMap = Object.fromEntries(breeds.map((b) => [b.breedName, b.id]))

    let breedCurveCount = 0
    for (const curve of BREED_GROWTH_CURVES) {
      const breedId = breedMap[curve.breedName]
      if (!breedId) {
        console.log(`   ⚠️  Breed not found: ${curve.breedName}`)
        continue
      }

      const curveData = curve.data.map((point) => ({
        species: curve.species,
        breedId: breedId,
        day: point.day,
        expected_weight_g: point.expected_weight_g,
      }))

      await db.insertInto('growth_standards').values(curveData).execute()
      breedCurveCount += curveData.length
      console.log(`   ✅ ${curve.breedName}: ${curveData.length} data points`)
    }

    console.log(`   ✅ Total: ${breedCurveCount} breed-specific data points\n`)

    // NOTE: Market prices removed - users enter their own target prices per batch
    // This makes the app international (not Nigeria-specific)
    // Regional market data packages can be added as a future enhancement

    // SUMMARY
    console.log('═'.repeat(50))
    console.log('🎉 PRODUCTION SEED COMPLETE!')
    console.log('═'.repeat(50))
    console.log('\n📋 What was seeded:')
    console.log(`   • Admin user: ${ADMIN_EMAIL}`)
    console.log('   • Breeds: 24 breeds across 6 modules')
    console.log(
      '   • Species-level growth standards: Broiler, Layer, Catfish, Tilapia, Cattle, Goat, Sheep',
    )
    console.log(
      `   • Breed-specific growth curves: ${BREED_GROWTH_CURVES.length} breeds`,
    )
    console.log('\n🔐 Login credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log('   Password: (from ADMIN_PASSWORD env var)')
    console.log('\n💡 For demo data with farms, batches, and transactions:')
    console.log('   bun run db:seed:dev\n')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
