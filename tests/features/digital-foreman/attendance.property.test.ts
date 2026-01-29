/**
 * Property-based tests for attendance service functions.
 * Uses fast-check to verify business logic invariants.
 *
 * **Validates: Requirements 5.7, 6.3, 12.4, 15.5**
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { AttendanceRecord } from '~/features/digital-foreman/attendance-service'
import {
  calculateAttendanceSummary,
  calculateHoursWorked,
  isDuplicateCheckIn,
  shouldAutoCheckOut,
} from '~/features/digital-foreman/attendance-service'

// Arbitrary for valid dates - use timestamp to avoid NaN dates
const validDate = fc
  .integer({
    min: new Date('2020-01-01').getTime(),
    max: new Date('2030-12-31').getTime(),
  })
  .map((ts) => new Date(ts))

describe('Attendance Service - Property Tests', () => {
  describe('calculateHoursWorked', () => {
    /**
     * Property 4: Hours Worked Calculation
     * - Hours should be non-negative when checkout is after checkin
     * - Hours should be proportional to time difference
     */
    it('should return non-negative hours when checkout is after checkin', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 1, max: 24 * 60 }),
          (checkIn, minutesLater) => {
            const checkOut = new Date(
              checkIn.getTime() + minutesLater * 60 * 1000,
            )
            const hours = calculateHoursWorked(checkIn, checkOut)
            expect(hours).toBeGreaterThanOrEqual(0)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should return zero for same time', () => {
      fc.assert(
        fc.property(validDate, (date) => {
          const hours = calculateHoursWorked(date, date)
          expect(hours).toBe(0)
        }),
        { numRuns: 50 },
      )
    })

    it('should calculate correct hours for known durations', () => {
      const checkIn = new Date('2024-01-01T09:00:00')

      // 1 hour
      expect(
        calculateHoursWorked(checkIn, new Date('2024-01-01T10:00:00')),
      ).toBe(1)

      // 8 hours
      expect(
        calculateHoursWorked(checkIn, new Date('2024-01-01T17:00:00')),
      ).toBe(8)

      // 30 minutes = 0.5 hours
      expect(
        calculateHoursWorked(checkIn, new Date('2024-01-01T09:30:00')),
      ).toBe(0.5)
    })

    it('should be proportional to time difference', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 12 }),
          (checkIn, hours1, hours2) => {
            const checkOut1 = new Date(
              checkIn.getTime() + hours1 * 60 * 60 * 1000,
            )
            const checkOut2 = new Date(
              checkIn.getTime() + hours2 * 60 * 60 * 1000,
            )

            const result1 = calculateHoursWorked(checkIn, checkOut1)
            const result2 = calculateHoursWorked(checkIn, checkOut2)

            if (hours1 < hours2) {
              expect(result1).toBeLessThan(result2)
            } else if (hours1 > hours2) {
              expect(result1).toBeGreaterThan(result2)
            } else {
              expect(result1).toBe(result2)
            }
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  describe('isDuplicateCheckIn', () => {
    /**
     * Property 6: Duplicate Check-In Prevention
     * - Check-ins within threshold are duplicates
     * - Check-ins beyond threshold are not duplicates
     */
    it('should detect duplicates within default 5 minute threshold', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 0, max: 4 }),
          (lastCheckIn, minutesLater) => {
            const newCheckIn = new Date(
              lastCheckIn.getTime() + minutesLater * 60 * 1000,
            )
            expect(isDuplicateCheckIn(lastCheckIn, newCheckIn)).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should not detect duplicates beyond threshold', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 6, max: 60 }),
          (lastCheckIn, minutesLater) => {
            const newCheckIn = new Date(
              lastCheckIn.getTime() + minutesLater * 60 * 1000,
            )
            expect(isDuplicateCheckIn(lastCheckIn, newCheckIn)).toBe(false)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should respect custom threshold', () => {
      const lastCheckIn = new Date('2024-01-01T09:00:00')
      const newCheckIn = new Date('2024-01-01T09:08:00') // 8 minutes later

      // With 5 minute threshold (default), not a duplicate
      expect(isDuplicateCheckIn(lastCheckIn, newCheckIn, 5)).toBe(false)

      // With 10 minute threshold, is a duplicate
      expect(isDuplicateCheckIn(lastCheckIn, newCheckIn, 10)).toBe(true)
    })

    it('should be symmetric (order of times should not matter for detection)', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 0, max: 10 }),
          (time1, minutesDiff) => {
            const time2 = new Date(time1.getTime() + minutesDiff * 60 * 1000)
            const result1 = isDuplicateCheckIn(time1, time2)
            const result2 = isDuplicateCheckIn(time2, time1)
            expect(result1).toBe(result2)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  describe('shouldAutoCheckOut', () => {
    it('should return false for same day', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 0, max: 23 }),
          (date, hour) => {
            const checkIn = new Date(date)
            checkIn.setHours(hour, 0, 0, 0)

            const current = new Date(checkIn)
            current.setHours(23, 59, 59, 999)

            expect(shouldAutoCheckOut(checkIn, current)).toBe(false)
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should return true for different days', () => {
      fc.assert(
        fc.property(
          validDate,
          fc.integer({ min: 1, max: 30 }),
          (checkIn, daysLater) => {
            const current = new Date(checkIn)
            current.setDate(current.getDate() + daysLater)

            expect(shouldAutoCheckOut(checkIn, current)).toBe(true)
          },
        ),
        { numRuns: 50 },
      )
    })
  })

  describe('calculateAttendanceSummary', () => {
    /**
     * Property 21: Attendance Summary Aggregation
     * - Total hours should be sum of individual hours
     * - Total days should count unique dates
     * - Flagged check-ins should count records without checkout
     */
    it('should return zeros for empty array', () => {
      const summary = calculateAttendanceSummary(
        [],
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      )
      expect(summary.totalHours).toBe(0)
      expect(summary.totalDays).toBe(0)
      expect(summary.flaggedCheckIns).toBe(0)
    })

    it('should count flagged check-ins correctly', () => {
      const records: Array<AttendanceRecord> = [
        {
          checkIn: new Date('2024-01-15T09:00:00'),
          checkOut: new Date('2024-01-15T17:00:00'),
        },
        { checkIn: new Date('2024-01-16T09:00:00'), checkOut: null }, // flagged
        { checkIn: new Date('2024-01-17T09:00:00') }, // flagged (no checkOut property)
      ]

      const summary = calculateAttendanceSummary(
        records,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      )

      expect(summary.flaggedCheckIns).toBe(2)
    })

    it('should count unique work days', () => {
      const records: Array<AttendanceRecord> = [
        {
          checkIn: new Date('2024-01-15T09:00:00'),
          checkOut: new Date('2024-01-15T12:00:00'),
        },
        {
          checkIn: new Date('2024-01-15T13:00:00'),
          checkOut: new Date('2024-01-15T17:00:00'),
        }, // same day
        {
          checkIn: new Date('2024-01-16T09:00:00'),
          checkOut: new Date('2024-01-16T17:00:00'),
        },
      ]

      const summary = calculateAttendanceSummary(
        records,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      )

      expect(summary.totalDays).toBe(2) // Only 2 unique days
    })

    it('should filter records by period', () => {
      const records: Array<AttendanceRecord> = [
        {
          checkIn: new Date('2024-01-05T09:00:00'),
          checkOut: new Date('2024-01-05T17:00:00'),
        }, // before period
        {
          checkIn: new Date('2024-01-15T09:00:00'),
          checkOut: new Date('2024-01-15T17:00:00'),
        }, // in period
        {
          checkIn: new Date('2024-02-05T09:00:00'),
          checkOut: new Date('2024-02-05T17:00:00'),
        }, // after period
      ]

      const summary = calculateAttendanceSummary(
        records,
        new Date('2024-01-10'),
        new Date('2024-01-31'),
      )

      expect(summary.totalDays).toBe(1) // Only the Jan 15 record
    })
  })
})
