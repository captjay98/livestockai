/**
 * Feed type compatibility matrix for livestock types
 */

import type { LivestockType } from '~/features/modules/types'

/**
 * Feed types and their compatibility with livestock types
 */
export const FEED_COMPATIBILITY_MATRIX = {
  // Poultry feeds
  'starter-crumble': ['poultry'],
  'grower-pellet': ['poultry'],
  'finisher-pellet': ['poultry'],
  'layer-mash': ['poultry'],
  'broiler-starter': ['poultry'],
  'broiler-finisher': ['poultry'],

  // Fish feeds
  'fish-starter': ['fish'],
  'fish-grower': ['fish'],
  'fish-finisher': ['fish'],
  'catfish-feed': ['fish'],
  'tilapia-feed': ['fish'],
  'floating-pellet': ['fish'],
  'sinking-pellet': ['fish'],
  'fish-feed': ['fish'],

  // Cattle feeds
  'cattle-concentrate': ['cattle'],
  'dairy-feed': ['cattle'],
  'beef-fattener': ['cattle'],
  'calf-starter': ['cattle'],
  'cattle-feed': ['cattle'],
  hay: ['cattle', 'goats', 'sheep'],
  silage: ['cattle'],

  // Goat feeds
  'goat-pellet': ['goats'],
  'goat-concentrate': ['goats'],

  // Sheep feeds
  'sheep-pellet': ['sheep'],
  'sheep-concentrate': ['sheep'],

  // Bee feeds
  'sugar-syrup': ['bees'],
  'pollen-substitute': ['bees'],
  'bee-candy': ['bees'],
  'goat-feed': ['goats'],
  'sheep-feed': ['sheep'],
  'bee-feed': ['bees'],

  // Universal/Multi-species feeds
  'grain-mix': ['poultry', 'cattle', 'goats', 'sheep'],
  corn: ['poultry', 'cattle', 'goats', 'sheep'],
  wheat: ['poultry', 'cattle', 'goats', 'sheep'],
  'soybean-meal': ['poultry', 'cattle', 'goats', 'sheep'],
} as const

/**
 * Type for feed compatibility matrix keys (detailed feed types for recommendations)
 */
export type FeedCompatibilityKey = keyof typeof FEED_COMPATIBILITY_MATRIX

/**
 * Database-compatible feed types.
 * These match the CHECK constraint in the database schema.
 * Use these for forms and database operations.
 */
export const FEED_TYPE_VALUES = [
  'starter',
  'grower',
  'finisher',
  'layer_mash',
  'fish_feed',
  'cattle_feed',
  'goat_feed',
  'sheep_feed',
  'hay',
  'silage',
  'bee_feed',
] as const

export type FeedType = (typeof FEED_TYPE_VALUES)[number]

/**
 * Array of feed types for UI components (dropdowns, filters)
 * Labels are human-readable versions of the database values
 */
export const FEED_TYPES: Array<{ value: FeedType; label: string }> = [
  { value: 'starter', label: 'Starter' },
  { value: 'grower', label: 'Grower' },
  { value: 'finisher', label: 'Finisher' },
  { value: 'layer_mash', label: 'Layer Mash' },
  { value: 'fish_feed', label: 'Fish Feed' },
  { value: 'cattle_feed', label: 'Cattle Feed' },
  { value: 'goat_feed', label: 'Goat Feed' },
  { value: 'sheep_feed', label: 'Sheep Feed' },
  { value: 'hay', label: 'Hay' },
  { value: 'silage', label: 'Silage' },
  { value: 'bee_feed', label: 'Bee Feed' },
]

/**
 * Get compatible feed types for a livestock type
 * @param livestockType - Type of livestock
 * @returns Array of compatible feed type names
 */
export function getCompatibleFeedTypes(
  livestockType: LivestockType,
): Array<string> {
  return Object.entries(FEED_COMPATIBILITY_MATRIX)
    .filter(([_, compatibleTypes]) =>
      (compatibleTypes as ReadonlyArray<LivestockType>).includes(livestockType),
    )
    .map(([feedType]) => feedType)
}

/**
 * Validate if a feed type is compatible with livestock type
 * @param feedType - Feed type name
 * @param livestockType - Type of livestock
 * @returns True if compatible, false otherwise
 */
export function isFeedTypeCompatible(
  feedType: string,
  livestockType: LivestockType,
): boolean {
  const compatibleTypes =
    FEED_COMPATIBILITY_MATRIX[
      feedType as keyof typeof FEED_COMPATIBILITY_MATRIX
    ]
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime check for invalid feed types
  if (!compatibleTypes) return false
  return (compatibleTypes as ReadonlyArray<LivestockType>).includes(
    livestockType,
  )
}

/**
 * Get feed type recommendations by livestock type and age stage
 */
export const FEED_STAGE_RECOMMENDATIONS = {
  poultry: {
    broiler: {
      '0-21': ['broiler-starter', 'starter-crumble'],
      '22-35': ['grower-pellet'],
      '36+': ['finisher-pellet', 'broiler-finisher'],
    },
    layer: {
      '0-56': ['starter-crumble'],
      '57-140': ['grower-pellet'],
      '141+': ['layer-mash'],
    },
  },
  fish: {
    catfish: {
      '0-30': ['fish-starter', 'catfish-feed'],
      '31-90': ['fish-grower', 'floating-pellet'],
      '91+': ['fish-finisher', 'sinking-pellet'],
    },
    tilapia: {
      '0-30': ['fish-starter', 'tilapia-feed'],
      '31-90': ['fish-grower', 'floating-pellet'],
      '91+': ['fish-finisher'],
    },
  },
} as const
