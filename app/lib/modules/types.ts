// Module system types for feature modules

export type ModuleKey = 'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'

export type LivestockType = 'poultry' | 'fish' | 'cattle' | 'goats' | 'sheep' | 'bees'

export type ProductType = 
  | 'poultry' 
  | 'fish' 
  | 'eggs' 
  | 'cattle' 
  | 'goats' 
  | 'sheep' 
  | 'honey' 
  | 'milk' 
  | 'wool'

export type StructureType = 
  | 'house' 
  | 'pond' 
  | 'pen' 
  | 'cage' 
  | 'barn' 
  | 'pasture' 
  | 'hive' 
  | 'milking_parlor' 
  | 'shearing_shed'

export type FeedType = 
  | 'starter' 
  | 'grower' 
  | 'finisher' 
  | 'layer_mash' 
  | 'fish_feed' 
  | 'cattle_feed' 
  | 'goat_feed' 
  | 'sheep_feed' 
  | 'hay' 
  | 'silage' 
  | 'bee_feed'

export interface ModuleMetadata {
  key: ModuleKey
  name: string
  description: string
  icon: string
  livestockTypes: Array<LivestockType>
  productTypes: Array<ProductType>
  speciesOptions: Array<{ value: string; label: string }>
  sourceSizeOptions: Array<{ value: string; label: string }>
  feedTypes: Array<FeedType>
  structureTypes: Array<StructureType>
}

export interface FarmModule {
  id: string
  farmId: string
  moduleKey: ModuleKey
  enabled: boolean
  createdAt: Date
}

export interface ModuleContextState {
  enabledModules: Array<ModuleKey>
  isLoading: boolean
  toggleModule: (moduleKey: ModuleKey) => Promise<void>
  canDisableModule: (moduleKey: ModuleKey) => Promise<boolean>
  refreshModules: () => Promise<void>
}
