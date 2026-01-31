import { z } from 'zod'
import { createSearchValidator } from '~/lib/validation/search-params'

/**
 * Species validation mapping for livestock types
 * Ensures species is appropriate for the livestock type
 */
const LIVESTOCK_SPECIES_MAP = {
  poultry: [
    'broiler',
    'layer',
    'turkey',
    'duck',
    'goose',
    'guinea fowl',
    'quail',
    'chicken',
  ],
  fish: [
    'catfish',
    'tilapia',
    'salmon',
    'trout',
    'carp',
    'bass',
    'cod',
    'tuna',
  ],
  cattle: ['holstein', 'angus', 'hereford', 'brahman', 'zebu', 'dairy cow'],
  goats: ['boer', 'nubian', 'saanen', 'alpine', 'kiko', 'spanish'],
  sheep: ['dorper', 'merino', 'suffolk', 'katahdin', 'barbados'],
  bees: ['italian', 'carniolan', 'caucasian', 'buckfast', 'russian'],
} as const

/**
 * Validate that species is appropriate for livestock type
 * @param livestockType - The type of livestock
 * @param species - The species to validate
 * @returns True if valid, false otherwise
 */
export function validateSpeciesForLivestockType(
  livestockType: keyof typeof LIVESTOCK_SPECIES_MAP,
  species: string,
): boolean {
  const validSpecies = LIVESTOCK_SPECIES_MAP[livestockType]
  const normalizedSpecies = species.toLowerCase()
  return (validSpecies as ReadonlyArray<string>).includes(normalizedSpecies)
}

/**
 * Enhanced cross-validation for livestock type and species combination
 * @param livestockType - The type of livestock
 * @param species - The species to validate
 * @returns Validation error message or null if valid
 */
export function validateLivestockTypeSpeciesCombination(
  livestockType: keyof typeof LIVESTOCK_SPECIES_MAP,
  species: string,
): string | null {
  if (!species || species.trim() === '') {
    return 'Species is required'
  }

  const normalizedSpecies = species.toLowerCase().trim()
  const validSpecies = LIVESTOCK_SPECIES_MAP[livestockType]

  if (!(validSpecies as ReadonlyArray<string>).includes(normalizedSpecies)) {
    const validOptions = validSpecies.join(', ')
    return `Species '${species}' is not valid for ${livestockType}. Valid options: ${validOptions}`
  }

  return null
}

/**
 * Get valid species for a livestock type
 * @param livestockType - The type of livestock
 * @returns Array of valid species names
 */
export function getValidSpeciesForLivestockType(
  livestockType: keyof typeof LIVESTOCK_SPECIES_MAP,
): ReadonlyArray<string> {
  return LIVESTOCK_SPECIES_MAP[livestockType]
}

export const validateBatchSearch = createSearchValidator({
  sortBy: [
    'species',
    'currentQuantity',
    'status',
    'livestockType',
    'acquisitionDate',
    'createdAt',
  ],
  status: ['active', 'depleted', 'sold'],
  custom: {
    livestockType: z
      .enum(['poultry', 'fish', 'cattle', 'goats', 'sheep', 'bees'])
      .optional(),
    breedId: z.string().optional(),
  },
})
