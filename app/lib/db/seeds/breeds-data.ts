/**
 * Breed seed data for all livestock modules
 *
 * CRITICAL: speciesKey values MUST match growth_standards.species (Title Case)
 * sourceSizes values MUST match SOURCE_SIZE_OPTIONS (lowercase)
 */

import type { BreedSeedData } from '~/features/breeds/types'

// Poultry Breeds
export const POULTRY_BREEDS: Array<BreedSeedData> = [
  // Broilers
  {
    moduleKey: 'poultry',
    speciesKey: 'Broiler',
    breedName: 'cobb_500',
    displayName: 'Cobb 500',
    typicalMarketWeightG: 2800,
    typicalDaysToMarket: 42,
    typicalFcr: '1.65',
    sourceSizes: ['day-old', 'grower'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'poultry',
    speciesKey: 'Broiler',
    breedName: 'ross_308',
    displayName: 'Ross 308',
    typicalMarketWeightG: 2900,
    typicalDaysToMarket: 42,
    typicalFcr: '1.60',
    sourceSizes: ['day-old', 'grower'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'poultry',
    speciesKey: 'Broiler',
    breedName: 'arbor_acres',
    displayName: 'Arbor Acres',
    typicalMarketWeightG: 2700,
    typicalDaysToMarket: 42,
    typicalFcr: '1.70',
    sourceSizes: ['day-old', 'grower'],
    regions: ['global'],
    isDefault: false,
  },
  // Layers
  {
    moduleKey: 'poultry',
    speciesKey: 'Layer',
    breedName: 'hyline_brown',
    displayName: 'Hy-Line Brown',
    typicalMarketWeightG: 2000,
    typicalDaysToMarket: 72 * 7, // 72 weeks
    typicalFcr: '2.00',
    sourceSizes: ['day-old', 'point-of-lay'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'poultry',
    speciesKey: 'Layer',
    breedName: 'lohmann_brown',
    displayName: 'Lohmann Brown',
    typicalMarketWeightG: 1900,
    typicalDaysToMarket: 72 * 7,
    typicalFcr: '2.10',
    sourceSizes: ['day-old', 'point-of-lay'],
    regions: ['global'],
    isDefault: false,
  },
]

// Aquaculture Breeds
export const AQUACULTURE_BREEDS: Array<BreedSeedData> = [
  // Catfish
  {
    moduleKey: 'aquaculture',
    speciesKey: 'Catfish',
    breedName: 'clarias_gariepinus',
    displayName: 'Clarias gariepinus (African Catfish)',
    typicalMarketWeightG: 1000,
    typicalDaysToMarket: 180,
    typicalFcr: '1.20',
    sourceSizes: ['fingerling', 'jumbo'],
    regions: ['africa', 'asia'],
    isDefault: true,
  },
  {
    moduleKey: 'aquaculture',
    speciesKey: 'Catfish',
    breedName: 'channel_catfish',
    displayName: 'Channel Catfish',
    typicalMarketWeightG: 900,
    typicalDaysToMarket: 180,
    typicalFcr: '1.50',
    sourceSizes: ['fingerling', 'jumbo'],
    regions: ['americas'],
    isDefault: false,
  },
  // Tilapia
  {
    moduleKey: 'aquaculture',
    speciesKey: 'Tilapia',
    breedName: 'nile_tilapia',
    displayName: 'Nile Tilapia',
    typicalMarketWeightG: 600,
    typicalDaysToMarket: 180,
    typicalFcr: '1.40',
    sourceSizes: ['fingerling', 'jumbo'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'aquaculture',
    speciesKey: 'Tilapia',
    breedName: 'red_tilapia',
    displayName: 'Red Tilapia',
    typicalMarketWeightG: 550,
    typicalDaysToMarket: 180,
    typicalFcr: '1.50',
    sourceSizes: ['fingerling', 'jumbo'],
    regions: ['global'],
    isDefault: false,
  },
]

// Cattle Breeds
export const CATTLE_BREEDS: Array<BreedSeedData> = [
  {
    moduleKey: 'cattle',
    speciesKey: 'Cattle',
    breedName: 'angus',
    displayName: 'Angus',
    typicalMarketWeightG: 550000, // 550 kg
    typicalDaysToMarket: 540, // 18 months
    typicalFcr: '6.00',
    sourceSizes: ['calf', 'weaner', 'yearling'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'cattle',
    speciesKey: 'Cattle',
    breedName: 'hereford',
    displayName: 'Hereford',
    typicalMarketWeightG: 520000,
    typicalDaysToMarket: 540,
    typicalFcr: '6.50',
    sourceSizes: ['calf', 'weaner', 'yearling'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'cattle',
    speciesKey: 'Cattle',
    breedName: 'holstein',
    displayName: 'Holstein (Dairy)',
    typicalMarketWeightG: 650000,
    typicalDaysToMarket: 730, // 24 months
    typicalFcr: '7.00',
    sourceSizes: ['calf', 'weaner'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'cattle',
    speciesKey: 'Cattle',
    breedName: 'jersey',
    displayName: 'Jersey (Dairy)',
    typicalMarketWeightG: 450000,
    typicalDaysToMarket: 730,
    typicalFcr: '6.50',
    sourceSizes: ['calf', 'weaner'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'cattle',
    speciesKey: 'Cattle',
    breedName: 'white_fulani',
    displayName: 'White Fulani',
    typicalMarketWeightG: 400000,
    typicalDaysToMarket: 540,
    typicalFcr: '7.00',
    sourceSizes: ['calf', 'weaner', 'yearling'],
    regions: ['africa'],
    isDefault: false,
  },
]

// Goat Breeds
export const GOAT_BREEDS: Array<BreedSeedData> = [
  {
    moduleKey: 'goats',
    speciesKey: 'Goat',
    breedName: 'boer',
    displayName: 'Boer',
    typicalMarketWeightG: 45000, // 45 kg
    typicalDaysToMarket: 180, // 6 months
    typicalFcr: '4.00',
    sourceSizes: ['kid', 'weaner'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'goats',
    speciesKey: 'Goat',
    breedName: 'kalahari_red',
    displayName: 'Kalahari Red',
    typicalMarketWeightG: 40000,
    typicalDaysToMarket: 180,
    typicalFcr: '4.50',
    sourceSizes: ['kid', 'weaner'],
    regions: ['africa'],
    isDefault: false,
  },
  {
    moduleKey: 'goats',
    speciesKey: 'Goat',
    breedName: 'saanen',
    displayName: 'Saanen (Dairy)',
    typicalMarketWeightG: 65000,
    typicalDaysToMarket: 365,
    typicalFcr: '5.00',
    sourceSizes: ['kid', 'weaner'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'goats',
    speciesKey: 'Goat',
    breedName: 'west_african_dwarf',
    displayName: 'West African Dwarf',
    typicalMarketWeightG: 25000,
    typicalDaysToMarket: 180,
    typicalFcr: '5.00',
    sourceSizes: ['kid', 'weaner'],
    regions: ['africa'],
    isDefault: false,
  },
]

// Sheep Breeds
export const SHEEP_BREEDS: Array<BreedSeedData> = [
  {
    moduleKey: 'sheep',
    speciesKey: 'Sheep',
    breedName: 'dorper',
    displayName: 'Dorper',
    typicalMarketWeightG: 50000, // 50 kg
    typicalDaysToMarket: 180, // 6 months
    typicalFcr: '5.00',
    sourceSizes: ['lamb', 'weaner'],
    regions: ['africa', 'global'],
    isDefault: true,
  },
  {
    moduleKey: 'sheep',
    speciesKey: 'Sheep',
    breedName: 'suffolk',
    displayName: 'Suffolk',
    typicalMarketWeightG: 55000,
    typicalDaysToMarket: 180,
    typicalFcr: '5.50',
    sourceSizes: ['lamb', 'weaner'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'sheep',
    speciesKey: 'Sheep',
    breedName: 'merino',
    displayName: 'Merino (Wool)',
    typicalMarketWeightG: 60000,
    typicalDaysToMarket: 365,
    typicalFcr: '6.00',
    sourceSizes: ['lamb', 'weaner'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'sheep',
    speciesKey: 'Sheep',
    breedName: 'yankasa',
    displayName: 'Yankasa',
    typicalMarketWeightG: 35000,
    typicalDaysToMarket: 180,
    typicalFcr: '6.00',
    sourceSizes: ['lamb', 'weaner'],
    regions: ['africa'],
    isDefault: false,
  },
]

// Bee Breeds
export const BEE_BREEDS: Array<BreedSeedData> = [
  {
    moduleKey: 'bees',
    speciesKey: 'Italian',
    breedName: 'italian',
    displayName: 'Italian Honey Bee',
    typicalMarketWeightG: 0, // N/A for bees
    typicalDaysToMarket: 365,
    typicalFcr: '0.00', // N/A for bees
    sourceSizes: ['nuc', 'package', 'swarm'],
    regions: ['global'],
    isDefault: true,
  },
  {
    moduleKey: 'bees',
    speciesKey: 'Carniolan',
    breedName: 'carniolan',
    displayName: 'Carniolan Honey Bee',
    typicalMarketWeightG: 0,
    typicalDaysToMarket: 365,
    typicalFcr: '0.00',
    sourceSizes: ['nuc', 'package', 'swarm'],
    regions: ['europe'],
    isDefault: false,
  },
  {
    moduleKey: 'bees',
    speciesKey: 'Buckfast',
    breedName: 'buckfast',
    displayName: 'Buckfast Bee',
    typicalMarketWeightG: 0,
    typicalDaysToMarket: 365,
    typicalFcr: '0.00',
    sourceSizes: ['nuc', 'package', 'swarm'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'bees',
    speciesKey: 'Russian',
    breedName: 'russian',
    displayName: 'Russian Honey Bee',
    typicalMarketWeightG: 0,
    typicalDaysToMarket: 365,
    typicalFcr: '0.00',
    sourceSizes: ['nuc', 'package', 'swarm'],
    regions: ['global'],
    isDefault: false,
  },
  {
    moduleKey: 'bees',
    speciesKey: 'Caucasian',
    breedName: 'caucasian',
    displayName: 'Caucasian Honey Bee',
    typicalMarketWeightG: 0,
    typicalDaysToMarket: 365,
    typicalFcr: '0.00',
    sourceSizes: ['nuc', 'package', 'swarm'],
    regions: ['europe', 'asia'],
    isDefault: false,
  },
]

// Export all breeds
export const ALL_BREEDS: Array<BreedSeedData> = [
  ...POULTRY_BREEDS,
  ...AQUACULTURE_BREEDS,
  ...CATTLE_BREEDS,
  ...GOAT_BREEDS,
  ...SHEEP_BREEDS,
  ...BEE_BREEDS,
]
