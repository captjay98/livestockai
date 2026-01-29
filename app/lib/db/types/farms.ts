import type { Generated } from 'kysely'

export interface FarmTable {
  id: Generated<string>
  name: string
  location: string
  latitude: string | null // DECIMAL(10,8)
  longitude: string | null // DECIMAL(11,8)
  type:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
  contactPhone: string | null
  notes: string | null
  districtId: string | null // Extension Worker Mode
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  deletedAt: Date | null
}

export interface FarmModuleTable {
  id: Generated<string>
  farmId: string
  moduleKey: 'poultry' | 'aquaculture' | 'cattle' | 'goats' | 'sheep' | 'bees'
  enabled: Generated<boolean>
  createdAt: Generated<Date>
}

export interface UserFarmTable {
  userId: string
  farmId: string
  role: FarmRole
}

export type FarmRole = 'owner' | 'manager' | 'viewer' | 'worker' | 'observer'

// Structures (Houses, Ponds, Pens)
export interface StructureTable {
  id: Generated<string>
  farmId: string
  name: string // "House A", "Pond 1", "Pen 3"
  type:
    | 'house'
    | 'pond'
    | 'pen'
    | 'cage'
    | 'barn'
    | 'pasture'
    | 'hive'
    | 'milking_parlor'
    | 'shearing_shed'
    | 'tank' // Concrete/plastic tanks
    | 'tarpaulin' // Tarpaulin ponds (popular in Nigeria)
    | 'raceway' // Flow-through systems
    | 'feedlot' // Intensive feeding area
    | 'kraal' // Traditional African livestock enclosure
  capacity: number | null // Max animals
  areaSqm: string | null // DECIMAL(10,2) - Size in square meters
  latitude: string | null // DECIMAL(10,8)
  longitude: string | null // DECIMAL(11,8)
  status: 'active' | 'empty' | 'maintenance'
  notes: string | null
  photos: Array<string> | null // PUBLIC storage - array of photo URLs
  createdAt: Generated<Date>
  updatedAt: Generated<Date>
  deletedAt: Date | null
}
