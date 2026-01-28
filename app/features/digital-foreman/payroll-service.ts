/**
 * Pure payroll service functions for wage calculations and validation.
 * All functions are side-effect-free and return numbers rounded to 2 decimals for currency.
 */

export interface WageConfig {
  rateAmount: number
  rateType: 'hourly' | 'daily' | 'monthly'
  currency: string
}

export interface PayrollPeriod {
  startDate: Date
  endDate: Date
}

export interface CheckIn {
  date: Date
  // other fields not needed for calculation
}

/**
 * Calculate wages for hourly workers
 */
export function calculateHourlyWages(hours: number, rateAmount: number): number {
  return Math.round(hours * rateAmount * 100) / 100
}

/**
 * Calculate wages for daily workers
 */
export function calculateDailyWages(days: number, rateAmount: number): number {
  return Math.round(days * rateAmount * 100) / 100
}

/**
 * Calculate prorated monthly wages based on days worked vs total days in month
 */
export function calculateMonthlyWages(
  periodDays: number,
  totalDaysInMonth: number,
  rateAmount: number,
): number {
  const prorated = (periodDays / totalDaysInMonth) * rateAmount
  return Math.round(prorated * 100) / 100
}

/**
 * Calculate gross wages by dispatching to appropriate function based on rate type
 */
export function calculateGrossWages(
  hoursOrDays: number,
  wageConfig: WageConfig,
  totalDaysInMonth?: number,
): number {
  switch (wageConfig.rateType) {
    case 'hourly':
      return calculateHourlyWages(hoursOrDays, wageConfig.rateAmount)
    case 'daily':
      return calculateDailyWages(hoursOrDays, wageConfig.rateAmount)
    case 'monthly':
      if (!totalDaysInMonth) {
        throw new Error('totalDaysInMonth required for monthly rate calculation')
      }
      return calculateMonthlyWages(hoursOrDays, totalDaysInMonth, wageConfig.rateAmount)
    default:
      throw new Error(`Unsupported rate type: ${wageConfig.rateType}`)
  }
}

/**
 * Calculate outstanding balance after payments
 */
export function calculateOutstandingBalance(
  grossWages: number,
  paymentsMade: number,
): number {
  const balance = grossWages - paymentsMade
  return Math.round(balance * 100) / 100
}

/**
 * Validate payroll period doesn't overlap with existing periods
 */
export function validatePayrollPeriod(
  startDate: Date,
  endDate: Date,
  existingPeriods: Array<PayrollPeriod>,
): { valid: boolean; error?: string } {
  if (startDate >= endDate) {
    return { valid: false, error: 'Start date must be before end date' }
  }

  for (const period of existingPeriods) {
    if (startDate < period.endDate && endDate > period.startDate) {
      return { valid: false, error: 'Payroll period overlaps with existing period' }
    }
  }

  return { valid: true }
}

/**
 * Calculate days worked by counting unique check-in dates
 */
export function calculateDaysWorked(checkIns: Array<CheckIn>): number {
  const uniqueDates = new Set(
    checkIns.map(checkIn => checkIn.date.toDateString())
  )
  return uniqueDates.size
}