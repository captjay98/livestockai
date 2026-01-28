/**
 * Property-based tests for payroll service functions.
 * Uses fast-check to verify wage calculation invariants.
 * 
 * **Validates: Requirements 12.3, 12.4, 12.5, 13.4, 13.5**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {PayrollPeriod, WageConfig} from '~/features/digital-foreman/payroll-service';
import {
  
  
  calculateDailyWages,
  calculateDaysWorked,
  calculateGrossWages,
  calculateHourlyWages,
  calculateMonthlyWages,
  calculateOutstandingBalance,
  validatePayrollPeriod
} from '~/features/digital-foreman/payroll-service'

// Arbitraries - use integers for more predictable math
const positiveNumber = fc.integer({ min: 1, max: 10000 })
const nonNegativeNumber = fc.integer({ min: 0, max: 10000 })
const validDate = fc.integer({ min: new Date('2020-01-01').getTime(), max: new Date('2030-12-31').getTime() })
  .map(ts => new Date(ts))

describe('Payroll Service - Property Tests', () => {
  describe('calculateHourlyWages', () => {
    /**
     * Property 7: Gross Wage Calculation - Hourly Rate
     * - Wages = hours × rate
     * - Wages are non-negative for non-negative inputs
     * - Wages are proportional to hours
     */
    it('should return non-negative wages for non-negative inputs', () => {
      fc.assert(
        fc.property(nonNegativeNumber, positiveNumber, (hours, rate) => {
          const wages = calculateHourlyWages(hours, rate)
          expect(wages).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should return zero for zero hours', () => {
      fc.assert(
        fc.property(positiveNumber, (rate) => {
          expect(calculateHourlyWages(0, rate)).toBe(0)
        }),
        { numRuns: 50 }
      )
    })

    it('should be proportional to hours worked', () => {
      fc.assert(
        fc.property(positiveNumber, positiveNumber, (hours, rate) => {
          const wages1 = calculateHourlyWages(hours, rate)
          const wages2 = calculateHourlyWages(hours * 2, rate)
          expect(wages2).toBeCloseTo(wages1 * 2, 2)
        }),
        { numRuns: 50 }
      )
    })

    it('should be proportional to rate', () => {
      fc.assert(
        fc.property(positiveNumber, positiveNumber, (hours, rate) => {
          const wages1 = calculateHourlyWages(hours, rate)
          const wages2 = calculateHourlyWages(hours, rate * 2)
          expect(wages2).toBeCloseTo(wages1 * 2, 2)
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('calculateDailyWages', () => {
    /**
     * Property 8: Gross Wage Calculation - Daily Rate
     * - Wages = days × rate
     */
    it('should return non-negative wages for non-negative inputs', () => {
      fc.assert(
        fc.property(nonNegativeNumber, positiveNumber, (days, rate) => {
          const wages = calculateDailyWages(days, rate)
          expect(wages).toBeGreaterThanOrEqual(0)
        }),
        { numRuns: 100 }
      )
    })

    it('should calculate correctly for known values', () => {
      expect(calculateDailyWages(5, 100)).toBe(500)
      expect(calculateDailyWages(22, 150)).toBe(3300)
    })
  })

  describe('calculateMonthlyWages', () => {
    /**
     * Property 9: Gross Wage Calculation - Monthly Rate
     * - Prorated wages = (days worked / total days) × monthly rate
     */
    it('should return full rate for full month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 28, max: 31 }),
          positiveNumber,
          (totalDays, rate) => {
            const wages = calculateMonthlyWages(totalDays, totalDays, rate)
            expect(wages).toBeCloseTo(rate, 2)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return half rate for half month', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 28, max: 31 }),
          positiveNumber,
          (totalDays, rate) => {
            const halfDays = Math.floor(totalDays / 2)
            const wages = calculateMonthlyWages(halfDays, totalDays, rate)
            expect(wages).toBeCloseTo((halfDays / totalDays) * rate, 2)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should return zero for zero days worked', () => {
      fc.assert(
        fc.property(fc.integer({ min: 28, max: 31 }), positiveNumber, (totalDays, rate) => {
          expect(calculateMonthlyWages(0, totalDays, rate)).toBe(0)
        }),
        { numRuns: 50 }
      )
    })
  })

  describe('calculateGrossWages', () => {
    it('should dispatch to correct calculation based on rate type', () => {
      const hourlyConfig: WageConfig = { rateAmount: 15, rateType: 'hourly', currency: 'USD' }
      const dailyConfig: WageConfig = { rateAmount: 100, rateType: 'daily', currency: 'USD' }
      const monthlyConfig: WageConfig = { rateAmount: 3000, rateType: 'monthly', currency: 'USD' }

      expect(calculateGrossWages(8, hourlyConfig)).toBe(120) // 8 hours × $15
      expect(calculateGrossWages(5, dailyConfig)).toBe(500) // 5 days × $100
      expect(calculateGrossWages(15, monthlyConfig, 30)).toBe(1500) // 15/30 × $3000
    })

    it('should throw for monthly rate without totalDaysInMonth', () => {
      const monthlyConfig: WageConfig = { rateAmount: 3000, rateType: 'monthly', currency: 'USD' }
      expect(() => calculateGrossWages(15, monthlyConfig)).toThrow()
    })
  })

  describe('calculateOutstandingBalance', () => {
    /**
     * Property 10: Outstanding Balance Calculation
     * - Balance = gross - payments
     * - Balance is zero when payments equal gross
     * - Balance is negative when overpaid
     */
    it('should return gross when no payments made', () => {
      fc.assert(
        fc.property(positiveNumber, (gross) => {
          const balance = calculateOutstandingBalance(gross, 0)
          expect(balance).toBeCloseTo(gross, 2)
        }),
        { numRuns: 50 }
      )
    })

    it('should return zero when fully paid', () => {
      fc.assert(
        fc.property(positiveNumber, (gross) => {
          const balance = calculateOutstandingBalance(gross, gross)
          expect(balance).toBe(0)
        }),
        { numRuns: 50 }
      )
    })

    it('should return negative when overpaid', () => {
      fc.assert(
        fc.property(positiveNumber, positiveNumber, (gross, extra) => {
          const balance = calculateOutstandingBalance(gross, gross + extra)
          expect(balance).toBeLessThanOrEqual(0)
        }),
        { numRuns: 50 }
      )
    })

    it('should satisfy: balance = gross - payments', () => {
      fc.assert(
        fc.property(positiveNumber, nonNegativeNumber, (gross, payments) => {
          const balance = calculateOutstandingBalance(gross, payments)
          expect(balance).toBeCloseTo(gross - payments, 2)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('validatePayrollPeriod', () => {
    /**
     * Property 11: Payroll Period Non-Overlap
     * - Start must be before end
     * - New period must not overlap existing periods
     */
    it('should reject when start is after end', () => {
      fc.assert(
        fc.property(validDate, fc.integer({ min: 1, max: 30 }), (end, daysBefore) => {
          const start = new Date(end)
          start.setDate(start.getDate() + daysBefore)
          
          const result = validatePayrollPeriod(start, end, [])
          expect(result.valid).toBe(false)
          expect(result.error).toContain('before')
        }),
        { numRuns: 50 }
      )
    })

    it('should accept non-overlapping periods', () => {
      const existingPeriods: Array<PayrollPeriod> = [
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-15') },
        { startDate: new Date('2024-01-16'), endDate: new Date('2024-01-31') },
      ]

      // February period should be valid
      const result = validatePayrollPeriod(
        new Date('2024-02-01'),
        new Date('2024-02-15'),
        existingPeriods
      )
      expect(result.valid).toBe(true)
    })

    it('should reject overlapping periods', () => {
      const existingPeriods: Array<PayrollPeriod> = [
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-15') },
      ]

      // Overlapping period
      const result = validatePayrollPeriod(
        new Date('2024-01-10'),
        new Date('2024-01-20'),
        existingPeriods
      )
      expect(result.valid).toBe(false)
      expect(result.error).toContain('overlap')
    })

    it('should accept adjacent periods', () => {
      const existingPeriods: Array<PayrollPeriod> = [
        { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-15') },
      ]

      // Adjacent period (starts exactly when previous ends)
      const result = validatePayrollPeriod(
        new Date('2024-01-15'),
        new Date('2024-01-31'),
        existingPeriods
      )
      expect(result.valid).toBe(true)
    })
  })

  describe('calculateDaysWorked', () => {
    it('should return zero for empty array', () => {
      expect(calculateDaysWorked([])).toBe(0)
    })

    it('should count unique dates', () => {
      const checkIns = [
        { date: new Date('2024-01-15T09:00:00') },
        { date: new Date('2024-01-15T14:00:00') }, // same day
        { date: new Date('2024-01-16T09:00:00') },
        { date: new Date('2024-01-17T09:00:00') },
      ]
      
      expect(calculateDaysWorked(checkIns)).toBe(3)
    })

    it('should count each unique date once regardless of check-in count', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 28 }), { minLength: 1, maxLength: 50 }),
          (days) => {
            const checkIns = days.map(day => ({
              date: new Date(`2024-01-${day.toString().padStart(2, '0')}T09:00:00`)
            }))
            
            const uniqueDays = new Set(days).size
            expect(calculateDaysWorked(checkIns)).toBe(uniqueDays)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})
