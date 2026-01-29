/**
 * Seed feed formulation data
 * Run with: bun run app/lib/db/seeds/feed-formulation.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { db } from '~/lib/db'

const data = JSON.parse(
  readFileSync(
    join(process.cwd(), 'app/lib/db/seeds/data/feed_ingredients.json'),
    'utf-8',
  ),
)
const ingredientsData = data.feed_ingredients || []

const reqData = JSON.parse(
  readFileSync(
    join(process.cwd(), 'app/lib/db/seeds/data/nutritional_requirements.json'),
    'utf-8',
  ),
)
const requirementsData = reqData.nutritional_requirements || []

async function seedFeedFormulation() {
  console.log('🌱 Seeding feed formulation data...')

  // Seed feed ingredients
  console.log('  → Inserting feed ingredients...')
  for (const ingredient of ingredientsData) {
    await db
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

      .execute()
  }
  console.log(`  ✓ Inserted ${ingredientsData.length} ingredients`)

  // Seed nutritional requirements
  console.log('  → Inserting nutritional requirements...')
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
  console.log(`  ✓ Inserted ${requirementsData.length} requirements`)

  console.log('✅ Feed formulation data seeded successfully')
}

seedFeedFormulation()
  .catch((error) => {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
