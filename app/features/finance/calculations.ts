/**
 * Financial calculations for batch profitability analysis.
 * Note: For currency operations, use decimal.js utilities from ~/features/settings/currency
 */

export interface BatchFinancials {
  totalRevenue: number
  initialCost: number
  feedCost: number
  otherExpenses: number
}

/**
 * Calculates net profit for a batch.
 * Formula: Revenue - (Initial Cost + Feed Cost + Other Expenses)
 */
export function calculateBatchProfit(financials: BatchFinancials): number {
  const totalCost =
    financials.initialCost + financials.feedCost + financials.otherExpenses
  return financials.totalRevenue - totalCost
}

/**
 * Calculates ROI (Return on Investment) percentage.
 * Formula: (Net Profit / Total Investment) * 100
 */
export function calculateROI(profit: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0
  return (profit / totalInvestment) * 100
}

/**
 * Calculates Cost Per Unit.
 * Formula: Total Investment / Current Quantity
 */
export function calculateCostPerUnit(
  totalInvestment: number,
  quantity: number,
): number {
  if (quantity <= 0) return 0
  return totalInvestment / quantity
}
