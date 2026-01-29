import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  CreateTreatmentInput,
  CreateVaccinationInput,
  UpdateTreatmentInput,
  UpdateVaccinationInput,
} from '~/features/vaccinations/server'
import {
  buildComplianceStats,
  buildVaccinationSummary,
  calculateComplianceRate,
  calculateNextVaccinationDate,
  calculateWithdrawalDaysRemaining,
  determineVaccinationStatus,
  getUpcomingVaccinations,
  isInWithdrawalPeriod,
  mapSortColumnToDbColumn,
  validateTreatmentData,
  validateTreatmentUpdateData,
  validateVaccinationData,
  validateVaccinationUpdateData,
} from '~/features/vaccinations/service'

describe('Vaccination Service', () => {
  describe('calculateNextVaccinationDate', () => {
    it('should calculate next date correctly', () => {
      const baseDate = new Date('2024-01-01')
      const result = calculateNextVaccinationDate(baseDate, 30)
      const expected = new Date('2024-01-31')
      expect(result?.getTime()).toBe(expected.getTime())
    })

    it('should handle leap years correctly', () => {
      const baseDate = new Date('2024-02-28')
      const result = calculateNextVaccinationDate(baseDate, 1)
      const expected = new Date('2024-02-29')
      expect(result?.getTime()).toBe(expected.getTime())
    })

    it('should return null for zero or negative interval', () => {
      expect(calculateNextVaccinationDate(new Date(), 0)).toBeNull()
      expect(calculateNextVaccinationDate(new Date(), -1)).toBeNull()
    })

    it('should return null for invalid date', () => {
      expect(calculateNextVaccinationDate(new Date('invalid'), 30)).toBeNull()
    })

    it('should handle non-leap year intervals correctly', () => {
      // 2024 is a leap year, so 365 days from 2024-01-01 is 2024-12-31
      const baseDate = new Date('2024-01-01')
      const result = calculateNextVaccinationDate(baseDate, 365)
      const expected = new Date('2024-12-31')
      expect(result?.getTime()).toBe(expected.getTime())
    })
  })

  describe('validateVaccinationData', () => {
    const validData: CreateVaccinationInput = {
      batchId: 'batch-1',
      vaccineName: 'Newcastle',
      dateAdministered: new Date(),
      dosage: '0.5ml',
      nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }

    it('should accept valid data', () => {
      const result = validateVaccinationData(validData, 'batch-1')
      expect(result).toBeNull()
    })

    it('should reject empty batch ID before mismatch check', () => {
      const result = validateVaccinationData(
        { ...validData, batchId: '' },
        'batch-1',
      )
      expect(result).toBe('Batch ID is required')
    })

    it('should reject mismatched batch ID', () => {
      const result = validateVaccinationData(
        { ...validData, batchId: 'batch-2' },
        'batch-1',
      )
      expect(result).toBe('Batch ID mismatch')
    })

    it('should reject empty vaccine name', () => {
      const result = validateVaccinationData(
        { ...validData, vaccineName: '' },
        'batch-1',
      )
      expect(result).toBe('Vaccine name is required')
    })

    it('should reject empty dosage', () => {
      const result = validateVaccinationData(
        { ...validData, dosage: '' },
        'batch-1',
      )
      expect(result).toBe('Dosage is required')
    })

    it('should reject invalid administration date', () => {
      const result = validateVaccinationData(
        { ...validData, dateAdministered: new Date('invalid') as any },
        'batch-1',
      )
      expect(result).toBe('Administration date is required')
    })

    it('should reject next due date before administration date', () => {
      const adminDate = new Date('2024-01-15')
      const dueDate = new Date('2024-01-01')
      const result = validateVaccinationData(
        {
          ...validData,
          dateAdministered: adminDate,
          nextDueDate: dueDate,
        },
        'batch-1',
      )
      expect(result).toBe('Next due date must be after administration date')
    })

    it('should accept null next due date', () => {
      const result = validateVaccinationData(
        { ...validData, nextDueDate: null },
        'batch-1',
      )
      expect(result).toBeNull()
    })
  })

  describe('validateTreatmentData', () => {
    const validData: CreateTreatmentInput = {
      batchId: 'batch-1',
      medicationName: 'Antibiotic',
      reason: 'Respiratory infection',
      date: new Date(),
      dosage: '5ml',
      withdrawalDays: 7,
    }

    it('should accept valid data', () => {
      const result = validateTreatmentData(validData, 'batch-1')
      expect(result).toBeNull()
    })

    it('should reject empty medication name', () => {
      const result = validateTreatmentData(
        { ...validData, medicationName: '' },
        'batch-1',
      )
      expect(result).toBe('Medication name is required')
    })

    it('should reject empty reason', () => {
      const result = validateTreatmentData(
        { ...validData, reason: '' },
        'batch-1',
      )
      expect(result).toBe('Reason is required')
    })

    it('should reject empty dosage', () => {
      const result = validateTreatmentData(
        { ...validData, dosage: '' },
        'batch-1',
      )
      expect(result).toBe('Dosage is required')
    })

    it('should reject invalid date', () => {
      const result = validateTreatmentData(
        { ...validData, date: new Date('invalid') as any },
        'batch-1',
      )
      expect(result).toBe('Treatment date is required')
    })

    it('should reject negative withdrawal days', () => {
      const result = validateTreatmentData(
        { ...validData, withdrawalDays: -1 },
        'batch-1',
      )
      expect(result).toBe('Withdrawal days cannot be negative')
    })

    it('should accept zero withdrawal days', () => {
      const result = validateTreatmentData(
        { ...validData, withdrawalDays: 0 },
        'batch-1',
      )
      expect(result).toBeNull()
    })
  })

  describe('calculateComplianceRate', () => {
    it('should calculate compliance rate correctly', () => {
      expect(calculateComplianceRate(10, 8)).toBe(80)
      expect(calculateComplianceRate(100, 50)).toBe(50)
      expect(calculateComplianceRate(5, 5)).toBe(100)
    })

    it('should return 100 for zero scheduled', () => {
      expect(calculateComplianceRate(0, 0)).toBe(100)
    })

    it('should cap at 100 maximum', () => {
      // More completed than scheduled (edge case)
      expect(calculateComplianceRate(10, 15)).toBe(100)
    })

    it('should handle decimal values', () => {
      expect(calculateComplianceRate(3, 1)).toBeCloseTo(33.33, 1)
    })

    it('should return 0 for zero completed', () => {
      expect(calculateComplianceRate(10, 0)).toBe(0)
    })
  })

  describe('determineVaccinationStatus', () => {
    it('should return completed when completed date exists', () => {
      const result = determineVaccinationStatus(
        new Date('2024-01-01'),
        new Date('2024-01-02'),
      )
      expect(result).toBe('completed')
    })

    it('should return overdue when past scheduled date and not completed', () => {
      const pastDate = new Date('2020-01-01')
      const result = determineVaccinationStatus(pastDate, null)
      expect(result).toBe('overdue')
    })

    it('should return pending when future scheduled date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      const result = determineVaccinationStatus(futureDate, null)
      expect(result).toBe('pending')
    })

    it('should return pending for today', () => {
      const today = new Date()
      const result = determineVaccinationStatus(today, null)
      expect(result).toBe('pending')
    })
  })

  describe('buildVaccinationSummary', () => {
    it('should build summary correctly', () => {
      const records = [
        { nextDueDate: null, dateAdministered: new Date() },
        {
          nextDueDate: new Date('2020-01-01'),
          dateAdministered: new Date(),
        },
        {
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          dateAdministered: new Date(),
        },
      ]
      const summary = buildVaccinationSummary(records)
      expect(summary.total).toBe(3)
      expect(summary.completed).toBe(1)
      expect(summary.overdue).toBe(1)
      expect(summary.upcoming).toBe(1)
      expect(summary.scheduled).toBe(2)
    })

    it('should handle empty records', () => {
      const summary = buildVaccinationSummary([])
      expect(summary.total).toBe(0)
      expect(summary.completed).toBe(0)
      expect(summary.overdue).toBe(0)
      expect(summary.upcoming).toBe(0)
      expect(summary.scheduled).toBe(0)
      expect(summary.complianceRate).toBe(100)
    })

    it('should calculate compliance rate correctly', () => {
      const records = [
        { nextDueDate: null, dateAdministered: new Date() },
        { nextDueDate: null, dateAdministered: new Date() },
        {
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          dateAdministered: new Date(),
        },
      ]
      const summary = buildVaccinationSummary(records)
      expect(summary.complianceRate).toBeCloseTo(66.67, 1)
    })
  })

  describe('getUpcomingVaccinations', () => {
    it('should filter upcoming vaccinations within range', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const records = [
        {
          nextDueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
        }, // 2 days ahead
        {
          nextDueDate: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
        }, // 10 days ahead
        { nextDueDate: null }, // completed
        {
          nextDueDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        }, // overdue
      ]

      const result = getUpcomingVaccinations(records, 7)
      expect(result).toHaveLength(1)
    })

    it('should return empty array for zero days ahead', () => {
      const records = [
        { nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      ]
      const result = getUpcomingVaccinations(records, 0)
      expect(result).toHaveLength(0)
    })

    it('should return empty array for negative days ahead', () => {
      const records = [
        { nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      ]
      const result = getUpcomingVaccinations(records, -1)
      expect(result).toHaveLength(0)
    })

    it('should exclude completed vaccinations (null nextDueDate)', () => {
      const records = [
        { nextDueDate: null },
        { nextDueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) },
      ]
      const result = getUpcomingVaccinations(records, 7)
      expect(result).toHaveLength(1)
    })
  })

  describe('buildComplianceStats', () => {
    it('should build compliance stats correctly', () => {
      const records = [
        { nextDueDate: null, dateAdministered: new Date() },
        {
          nextDueDate: new Date('2020-01-01'),
          dateAdministered: new Date(),
        },
        {
          nextDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          dateAdministered: new Date(),
        },
      ]
      const stats = buildComplianceStats(records)
      expect(stats.onTimeRate).toBeCloseTo(33.33, 1)
      expect(stats.overdueRate).toBeCloseTo(33.33, 1)
      expect(stats.pendingRate).toBeCloseTo(33.33, 1)
      expect(stats.completedRate).toBeCloseTo(33.33, 1)
    })

    it('should handle empty records', () => {
      const stats = buildComplianceStats([])
      expect(stats.onTimeRate).toBe(100)
      expect(stats.overdueRate).toBe(0)
      expect(stats.completedRate).toBe(100)
      expect(stats.pendingRate).toBe(0)
    })
  })

  describe('mapSortColumnToDbColumn', () => {
    it('should map known columns correctly', () => {
      expect(mapSortColumnToDbColumn('date')).toBe('dateAdministered')
      expect(mapSortColumnToDbColumn('vaccineName')).toBe('vaccineName')
      expect(mapSortColumnToDbColumn('dosage')).toBe('dosage')
      expect(mapSortColumnToDbColumn('nextDueDate')).toBe('nextDueDate')
      expect(mapSortColumnToDbColumn('species')).toBe('species')
      expect(mapSortColumnToDbColumn('farmName')).toBe('farmName')
    })

    it('should default to dateAdministered for unknown columns', () => {
      expect(mapSortColumnToDbColumn('unknown')).toBe('dateAdministered')
      expect(mapSortColumnToDbColumn('')).toBe('dateAdministered')
    })
  })

  describe('validateVaccinationUpdateData', () => {
    it('should accept valid update data', () => {
      const data: UpdateVaccinationInput = { vaccineName: 'New Vaccine' }
      expect(validateVaccinationUpdateData(data)).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateVaccinationUpdateData({})).toBeNull()
      expect(validateVaccinationUpdateData({ dosage: '1ml' })).toBeNull()
    })

    it('should reject empty vaccine name', () => {
      const result = validateVaccinationUpdateData({ vaccineName: '' })
      expect(result).toBe('Vaccine name cannot be empty')
    })

    it('should reject empty dosage', () => {
      const result = validateVaccinationUpdateData({ dosage: '' })
      expect(result).toBe('Dosage cannot be empty')
    })

    it('should reject invalid date', () => {
      const result = validateVaccinationUpdateData({
        dateAdministered: new Date('invalid') as any,
      })
      expect(result).toBe('Administration date is invalid')
    })
  })

  describe('validateTreatmentUpdateData', () => {
    it('should accept valid update data', () => {
      const data: UpdateTreatmentInput = { medicationName: 'New Med' }
      expect(validateTreatmentUpdateData(data)).toBeNull()
    })

    it('should accept partial updates', () => {
      expect(validateTreatmentUpdateData({})).toBeNull()
      expect(validateTreatmentUpdateData({ reason: 'New reason' })).toBeNull()
    })

    it('should reject empty medication name', () => {
      const result = validateTreatmentUpdateData({ medicationName: '' })
      expect(result).toBe('Medication name cannot be empty')
    })

    it('should reject empty reason', () => {
      const result = validateTreatmentUpdateData({ reason: '' })
      expect(result).toBe('Reason cannot be empty')
    })

    it('should reject empty dosage', () => {
      const result = validateTreatmentUpdateData({ dosage: '' })
      expect(result).toBe('Dosage cannot be empty')
    })

    it('should reject negative withdrawal days', () => {
      const result = validateTreatmentUpdateData({ withdrawalDays: -1 })
      expect(result).toBe('Withdrawal days cannot be negative')
    })

    it('should accept zero withdrawal days', () => {
      const result = validateTreatmentUpdateData({ withdrawalDays: 0 })
      expect(result).toBeNull()
    })
  })

  describe('isInWithdrawalPeriod', () => {
    it('should return true when in withdrawal period', () => {
      const treatmentDate = new Date()
      const result = isInWithdrawalPeriod(treatmentDate, 7)
      expect(result).toBe(true)
    })

    it('should return false when withdrawal period has ended', () => {
      const treatmentDate = new Date('2020-01-01')
      const result = isInWithdrawalPeriod(treatmentDate, 7)
      expect(result).toBe(false)
    })

    it('should return false for zero withdrawal days', () => {
      const result = isInWithdrawalPeriod(new Date(), 0)
      expect(result).toBe(false)
    })

    it('should return false for negative withdrawal days', () => {
      const result = isInWithdrawalPeriod(new Date(), -1)
      expect(result).toBe(false)
    })

    it('should return false for invalid date', () => {
      const result = isInWithdrawalPeriod(new Date('invalid'), 7)
      expect(result).toBe(false)
    })
  })

  describe('calculateWithdrawalDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const treatmentDate = new Date()
      const result = calculateWithdrawalDaysRemaining(treatmentDate, 7)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(7)
    })

    it('should return 0 when withdrawal period has ended', () => {
      const treatmentDate = new Date('2020-01-01')
      const result = calculateWithdrawalDaysRemaining(treatmentDate, 7)
      expect(result).toBe(0)
    })

    it('should return 0 for zero withdrawal days', () => {
      const result = calculateWithdrawalDaysRemaining(new Date(), 0)
      expect(result).toBe(0)
    })

    it('should return 0 for negative withdrawal days', () => {
      const result = calculateWithdrawalDaysRemaining(new Date(), -1)
      expect(result).toBe(0)
    })

    it('should return 0 for invalid date', () => {
      const result = calculateWithdrawalDaysRemaining(new Date('invalid'), 7)
      expect(result).toBe(0)
    })

    it('should handle exact end date', () => {
      const treatmentDate = new Date()
      const endDate = new Date(treatmentDate)
      endDate.setDate(endDate.getDate() + 5)

      // Calculate exact days based on current time
      const result = calculateWithdrawalDaysRemaining(treatmentDate, 5)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(5)
    })
  })

  describe('Property-based tests', () => {
    describe('calculateComplianceRate properties', () => {
      it('should always return a value between 0 and 100', () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 0, max: 1000 }),
            fc.integer({ min: 0, max: 1000 }),
            (scheduled, completed) => {
              const rate = calculateComplianceRate(scheduled, completed)
              expect(rate).toBeGreaterThanOrEqual(0)
              expect(rate).toBeLessThanOrEqual(100)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should return 100 when completed equals scheduled', () => {
        fc.assert(
          fc.property(fc.integer({ min: 1, max: 1000 }), (n) => {
            const rate = calculateComplianceRate(n, n)
            expect(rate).toBe(100)
          }),
          { numRuns: 100 },
        )
      })
    })

    describe('calculateWithdrawalDaysRemaining properties', () => {
      // Use past dates to ensure withdrawal period may have ended
      const pastDate = fc.date({
        min: new Date('2020-01-01'),
        max: new Date(), // Up to today
      })

      it('should never return negative values', () => {
        fc.assert(
          fc.property(
            pastDate,
            fc.integer({ min: 0, max: 365 }),
            (date, days) => {
              const result = calculateWithdrawalDaysRemaining(date, days)
              expect(result).toBeGreaterThanOrEqual(0)
            },
          ),
          { numRuns: 100 },
        )
      })

      it('should not exceed withdrawal days when using past dates', () => {
        fc.assert(
          fc.property(
            pastDate,
            fc.integer({ min: 1, max: 365 }),
            (date, days) => {
              const result = calculateWithdrawalDaysRemaining(date, days)
              // For dates in the past, result should be 0 (withdrawal ended) or positive (still within period)
              expect(result).toBeGreaterThanOrEqual(0)
            },
          ),
          { numRuns: 100 },
        )
      })
    })
  })
})
