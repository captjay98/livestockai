/**
 * Types for breeds feature
 */

export type ModuleKey =
    | 'poultry'
    | 'aquaculture'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'

export interface Breed {
    id: string
    moduleKey: ModuleKey
    speciesKey: string
    breedName: string
    displayName: string
    typicalMarketWeightG: number
    typicalDaysToMarket: number
    typicalFcr: string // DECIMAL as string
    sourceSizes: Array<string>
    regions: Array<string>
    isDefault: boolean
    isActive: boolean
    createdAt: Date
}

export interface BreedSeedData {
    moduleKey: ModuleKey
    speciesKey: string
    breedName: string
    displayName: string
    typicalMarketWeightG: number
    typicalDaysToMarket: number
    typicalFcr: string
    sourceSizes: Array<string>
    regions: Array<string>
    isDefault: boolean
}
