import type { BatchAlert } from '~/features/monitoring/service'

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
  type:
    | 'poultry'
    | 'aquaculture'
    | 'mixed'
    | 'cattle'
    | 'goats'
    | 'sheep'
    | 'bees'
    | 'multi'
}

/**
 * Dashboard statistics structure
 */
export interface DashboardStats {
  inventory: {
    totalPoultry: number
    totalFish: number
    totalCattle: number
    totalGoats: number
    totalSheep: number
    totalBees: number
    activeBatches: number
  }
  financial: {
    monthlyRevenue: number
    monthlyExpenses: number
    monthlyProfit: number
    revenueChange: number
    expensesChange: number
  }
  production: {
    eggsThisMonth: number
    layingPercentage: number
  }
  mortality: {
    totalDeaths: number
    mortalityRate: number
  }
  feed: {
    totalCost: number
    totalKg: number
    fcr: number
  }
  alerts: Array<BatchAlert>
  topCustomers: Array<{
    id: string
    name: string
    totalSpent: number
  }>
  recentTransactions: Array<{
    id: string
    type: 'sale' | 'expense'
    description: string
    amount: number
    date: Date
  }>
}

/**
 * Dashboard data loader response
 */
export interface DashboardData {
  stats: DashboardStats
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
