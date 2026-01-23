export interface FarmWithStats {
  id: string
  name: string
  location: string
  type: 'poultry' | 'aquaculture' | 'mixed'
  activeBatches: number
  totalLivestock: number
}
