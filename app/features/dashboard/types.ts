/**
 * Dashboard-specific types and interfaces
 */

/**
 * Farm data structure for dashboard display
 */
export interface DashboardFarm {
  id: string
  name: string
  location: string
  type: any
}

/**
 * Dashboard data loader response
 */
export interface DashboardData {
  stats: any
  hasFarms: boolean
  farms: Array<DashboardFarm>
}

/**
 * Dashboard action types for quick actions
 */
export type DashboardAction =
  | 'batch'
  | 'feed'
  | 'expense'
  | 'sale'
  | 'mortality'
