import type { ModuleKey, ModuleMetadata } from './types'

/**
 * Module metadata for all supported livestock types
 *
 * NOTE: Species data is fetched from the database (breeds table).
 * Use getBreedsForModuleFn() or getSpeciesForModuleFn() to get species.
 *
 * sourceSizeOptions are kept here as they are static configuration
 * that doesn't change per breed (breeds can filter these options).
 */
export const MODULE_METADATA: Record<ModuleKey, ModuleMetadata> = {
  poultry: {
    key: 'poultry',
    name: 'Poultry',
    description: 'Chicken farming (broilers, layers)',
    icon: '🐔',
    livestockTypes: ['poultry'],
    productTypes: ['poultry', 'eggs'],
    sourceSizeOptions: [
      { value: 'day-old', label: 'Day-old chicks' },
      { value: 'grower', label: 'Grower (4-8 weeks)' },
      { value: 'point-of-lay', label: 'Point-of-lay (16-18 weeks)' },
    ],
    feedTypes: ['starter', 'grower', 'finisher', 'layer_mash'],
    structureTypes: ['house', 'pen', 'cage'],
  },

  aquaculture: {
    key: 'aquaculture',
    name: 'Aquaculture',
    description: 'Fish farming (catfish, tilapia)',
    icon: '🐟',
    livestockTypes: ['fish'],
    productTypes: ['fish'],
    sourceSizeOptions: [
      { value: 'fingerling', label: 'Fingerling (2-4 inches)' },
      { value: 'juvenile', label: 'Juvenile (4-6 inches)' },
      { value: 'jumbo', label: 'Jumbo (6+ inches)' },
    ],
    feedTypes: ['fish_feed'],
    structureTypes: ['pond', 'cage'],
  },

  cattle: {
    key: 'cattle',
    name: 'Cattle',
    description: 'Beef and dairy cattle farming',
    icon: '🐄',
    livestockTypes: ['cattle'],
    productTypes: ['cattle', 'milk'],
    sourceSizeOptions: [
      { value: 'calf', label: 'Calf (0-6 months)' },
      { value: 'weaner', label: 'Weaner (6-12 months)' },
      { value: 'yearling', label: 'Yearling (12-24 months)' },
      { value: 'adult', label: 'Adult (24+ months)' },
    ],
    feedTypes: ['cattle_feed', 'hay', 'silage'],
    structureTypes: ['barn', 'pasture', 'pen', 'milking_parlor'],
  },

  goats: {
    key: 'goats',
    name: 'Goats',
    description: 'Meat and dairy goat farming',
    icon: '🐐',
    livestockTypes: ['goats'],
    productTypes: ['goats', 'milk'],
    sourceSizeOptions: [
      { value: 'kid', label: 'Kid (0-6 months)' },
      { value: 'weaner', label: 'Weaner (6-12 months)' },
      { value: 'yearling', label: 'Yearling (12-24 months)' },
      { value: 'adult', label: 'Adult (24+ months)' },
    ],
    feedTypes: ['goat_feed', 'hay'],
    structureTypes: ['barn', 'pasture', 'pen', 'milking_parlor'],
  },

  sheep: {
    key: 'sheep',
    name: 'Sheep',
    description: 'Meat and wool sheep farming',
    icon: '🐑',
    livestockTypes: ['sheep'],
    productTypes: ['sheep', 'wool'],
    sourceSizeOptions: [
      { value: 'lamb', label: 'Lamb (0-6 months)' },
      { value: 'weaner', label: 'Weaner (6-12 months)' },
      { value: 'yearling', label: 'Yearling (12-24 months)' },
      { value: 'adult', label: 'Adult (24+ months)' },
    ],
    feedTypes: ['sheep_feed', 'hay'],
    structureTypes: ['barn', 'pasture', 'pen', 'shearing_shed'],
  },

  bees: {
    key: 'bees',
    name: 'Beekeeping',
    description: 'Honey bee farming and honey production',
    icon: '🐝',
    livestockTypes: ['bees'],
    productTypes: ['honey'],
    sourceSizeOptions: [
      { value: 'nuc', label: 'Nucleus Colony (Nuc)' },
      { value: 'package', label: 'Package Bees' },
      { value: 'swarm', label: 'Captured Swarm' },
      { value: 'established', label: 'Established Colony' },
    ],
    feedTypes: ['bee_feed'],
    structureTypes: ['hive'],
  },
}

// Default modules to enable based on farm type
export const DEFAULT_MODULES_BY_FARM_TYPE: Record<string, Array<ModuleKey>> = {
  poultry: ['poultry'],
  fishery: ['aquaculture'],
  cattle: ['cattle'],
  goats: ['goats'],
  sheep: ['sheep'],
  bees: ['bees'],
  mixed: ['poultry', 'aquaculture'],
  multi: [], // User selects manually
}

// Core navigation items (always visible regardless of modules)
export const CORE_NAVIGATION = [
  'Dashboard',
  'Reports',
  'Sales',
  'Expenses',
  'Invoices',
  'Customers',
  'Suppliers',
  'Farms',
  'Settings',
]

// Module-specific navigation items
export const MODULE_NAVIGATION: Record<ModuleKey, Array<string>> = {
  poultry: [
    'Batches',
    'Mortality',
    'Feed',
    'Weight',
    'Sales',
    'Health',
    'Inventory',
  ],
  aquaculture: [
    'Batches',
    'Mortality',
    'Feed',
    'Weight',
    'Sales',
    'Health',
    'Water',
    'Inventory',
  ],
  cattle: [
    'Batches',
    'Mortality',
    'Feed',
    'Weight',
    'Sales',
    'Health',
    'Inventory',
  ],
  goats: [
    'Batches',
    'Mortality',
    'Feed',
    'Weight',
    'Sales',
    'Health',
    'Inventory',
  ],
  sheep: [
    'Batches',
    'Mortality',
    'Feed',
    'Weight',
    'Sales',
    'Health',
    'Inventory',
  ],
  bees: ['Batches', 'Sales', 'Inventory'],
}
