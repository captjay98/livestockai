import type { ModuleKey, ModuleMetadata } from './types'

// Module metadata for all supported livestock types
export const MODULE_METADATA: Record<ModuleKey, ModuleMetadata> = {
  poultry: {
    key: 'poultry',
    name: 'Poultry',
    description: 'Chicken farming (broilers, layers)',
    icon: '🐔',
    livestockTypes: ['poultry'],
    productTypes: ['poultry', 'eggs'],
    speciesOptions: [
      { value: 'broiler', label: 'Broiler' },
      { value: 'layer', label: 'Layer' },
      { value: 'cockerel', label: 'Cockerel' },
      { value: 'turkey', label: 'Turkey' },
      { value: 'duck', label: 'Duck' },
      { value: 'guinea_fowl', label: 'Guinea Fowl' },
    ],
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
    speciesOptions: [
      { value: 'catfish', label: 'Catfish' },
      { value: 'tilapia', label: 'Tilapia' },
      { value: 'carp', label: 'Carp' },
      { value: 'salmon', label: 'Salmon' },
      { value: 'trout', label: 'Trout' },
    ],
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
    speciesOptions: [
      { value: 'angus', label: 'Angus' },
      { value: 'hereford', label: 'Hereford' },
      { value: 'holstein', label: 'Holstein (Dairy)' },
      { value: 'jersey', label: 'Jersey (Dairy)' },
      { value: 'brahman', label: 'Brahman' },
      { value: 'simmental', label: 'Simmental' },
      { value: 'white_fulani', label: 'White Fulani' },
      { value: 'red_bororo', label: 'Red Bororo' },
    ],
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
    speciesOptions: [
      { value: 'boer', label: 'Boer (Meat)' },
      { value: 'kalahari_red', label: 'Kalahari Red (Meat)' },
      { value: 'saanen', label: 'Saanen (Dairy)' },
      { value: 'alpine', label: 'Alpine (Dairy)' },
      { value: 'nubian', label: 'Nubian (Dual Purpose)' },
      { value: 'west_african_dwarf', label: 'West African Dwarf' },
      { value: 'red_sokoto', label: 'Red Sokoto' },
    ],
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
    speciesOptions: [
      { value: 'merino', label: 'Merino (Wool)' },
      { value: 'dorper', label: 'Dorper (Meat)' },
      { value: 'suffolk', label: 'Suffolk (Meat)' },
      { value: 'hampshire', label: 'Hampshire (Meat)' },
      { value: 'rambouillet', label: 'Rambouillet (Wool)' },
      { value: 'west_african_dwarf', label: 'West African Dwarf' },
      { value: 'yankasa', label: 'Yankasa' },
      { value: 'uda', label: 'Uda' },
    ],
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
    speciesOptions: [
      { value: 'apis_mellifera', label: 'Western Honey Bee (Apis mellifera)' },
      { value: 'apis_cerana', label: 'Asian Honey Bee (Apis cerana)' },
      { value: 'african_bee', label: 'African Honey Bee' },
      { value: 'italian_bee', label: 'Italian Bee' },
      { value: 'carniolan_bee', label: 'Carniolan Bee' },
    ],
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
