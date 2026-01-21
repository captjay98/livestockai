import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
    getFiscalYearEnd,
    getFiscalYearLabel,
    getFiscalYearStart,
} from '~/features/reports/fiscal-year'

describe('reports/fiscal-year', () => {
    const minTimestamp = Date.parse('2020-01-01')
    const maxTimestamp = Date.parse('2030-12-31')

    describe('getFiscalYearStart', () => {
        it('should return a date in the correct year', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: minTimestamp, max: maxTimestamp }),
                    (fiscalMonth, timestamp) => {
                        const date = new Date(timestamp)
                        const start = getFiscalYearStart(fiscalMonth, date)
                        expect(start instanceof Date).toBe(true)
                        expect(start.getMonth()).toBe(fiscalMonth - 1)
                        expect(start.getDate()).toBe(1)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should return previous year if before fiscal start', () => {
            // If fiscal year starts in April (4) and we're in January
            const start = getFiscalYearStart(4, new Date('2025-01-15'))
            expect(start.getFullYear()).toBe(2024)
            expect(start.getMonth()).toBe(3) // April = 3
        })

        it('should return current year if after fiscal start', () => {
            // If fiscal year starts in April (4) and we're in June
            const start = getFiscalYearStart(4, new Date('2025-06-15'))
            expect(start.getFullYear()).toBe(2025)
            expect(start.getMonth()).toBe(3) // April = 3
        })
    })

    describe('getFiscalYearEnd', () => {
        it('should return last day of month before fiscal start', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: minTimestamp, max: maxTimestamp }),
                    (fiscalMonth, timestamp) => {
                        const date = new Date(timestamp)
                        const end = getFiscalYearEnd(fiscalMonth, date)
                        expect(end instanceof Date).toBe(true)
                        // End should be after start
                        const start = getFiscalYearStart(fiscalMonth, date)
                        expect(end.getTime()).toBeGreaterThan(start.getTime())
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should be exactly one year after start (minus one day)', () => {
            const start = getFiscalYearStart(4, new Date('2025-06-15'))
            const end = getFiscalYearEnd(4, new Date('2025-06-15'))

            // End should be March 31, 2026 (day before April 1, 2026)
            expect(end.getFullYear()).toBe(2026)
            expect(end.getMonth()).toBe(2) // March = 2
        })
    })

    describe('getFiscalYearLabel', () => {
        it('should return FY YYYY-YYYY format', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 12 }),
                    fc.integer({ min: minTimestamp, max: maxTimestamp }),
                    (fiscalMonth, timestamp) => {
                        const date = new Date(timestamp)
                        const label = getFiscalYearLabel(fiscalMonth, date)
                        expect(label).toMatch(/^FY \d{4}-\d{4}$/)
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should span two consecutive years', () => {
            const label = getFiscalYearLabel(4, new Date('2025-06-15'))
            expect(label).toBe('FY 2025-2026')
        })
    })
})
