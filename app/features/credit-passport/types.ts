/**
 * Type definitions for Credit Passport metrics
 */

export interface FinancialMetrics {
    totalRevenue: number
    totalExpenses: number
    profit: number
    profitMargin: number
    cashFlowByMonth: Record<string, number>
    revenueByType: Record<string, number>
    expensesByCategory: Record<string, number>
}

export interface OperationalMetrics {
    avgFCR: number | null
    avgMortalityRate: number
    growthPerformanceIndex: number
    batchCount: number
}

export interface AssetMetrics {
    batchesByType: Record<string, number>
    totalInventoryValue: number
    structureCount: number
    totalLivestock: number
}

export interface TrackRecordMetrics {
    monthsOperating: number
    batchesCompleted: number
    productionVolume: number
    successRate: number
    uniqueCustomers: number
}

export interface CreditScoreMetrics {
    score: number
    grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export interface ReportMetrics {
    financial: FinancialMetrics
    operational: OperationalMetrics
    assets: AssetMetrics
    trackRecord: TrackRecordMetrics
    creditScore: CreditScoreMetrics
}

export type ReportType =
    | 'credit_assessment'
    | 'production_certificate'
    | 'impact_report'

export type ReportLanguage = 'en' | 'fr' | 'sw' | 'ha'

export type ReportBranding = 'openlivestock' | 'white-label'
