/**
 * Financial calculations for batch profitability analysis.
 * Note: For currency operations, use decimal.js utilities from ~/features/settings/currency
 */

/**
 * Input data for batch financial analysis
 */
export interface BatchFinancials {
  /** Gross revenue from all sales in this batch */
  totalRevenue: number
  /** Purchase cost of the livestock (birds, fingerlings, etc.) */
  initialCost: number
  /** Cumulative cost of feed consumed */
  feedCost: number
  /** All other expenses (medicine, transport, labor, etc.) */
  otherExpenses: number
}

/**
 * Calculates the net profit or loss for a livestock batch.
 * Formula: Revenue - (Initial Cost + Feed Cost + Other Expenses)
 *
 * @param financials - Object containing revenue and cost components
 * @returns The calculated net profit/loss
 */
export function calculateBatchProfit(financials: BatchFinancials): number {
  const totalCost =
    financials.initialCost + financials.feedCost + financials.otherExpenses
  return financials.totalRevenue - totalCost
}

/**
 * Calculates the Return on Investment (ROI) percentage.
 * Formula: (Net Profit / Total Investment) * 100
 *
 * @param profit - The net profit (or loss)
 * @param totalInvestment - The total amount invested (all costs)
 * @returns ROI percentage (e.g., 25.5 for 25.5%)
 */
export function calculateROI(profit: number, totalInvestment: number): number {
  if (totalInvestment === 0) return 0
  return (profit / totalInvestment) * 100
}

/**
 * Calculates the cost per unit (e.g., cost per bird or cost per kg).
 * Useful for determining pricing strategies.
 * Formula: Total Investment / Current Quantity
 *
 * @param totalInvestment - The sum of all costs assigned to the batch
 * @param quantity - The number of units (livestock) currently in the batch
 * @returns Cost per individual unit
 */
export function calculateCostPerUnit(
  totalInvestment: number,
  quantity: number,
): number {
  if (quantity <= 0) return 0
  return totalInvestment / quantity
}
