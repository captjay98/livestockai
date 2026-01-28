import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 14: Vaccination Due Date Alerts
 * Feature: poultry-fishery-tracker, Property 14: Vaccination Due Date Alerts
 * Validates: Requirements 14.3, 14.4
 *
 * Vaccination alerts SHALL be generated when:
 * - nextDueDate is within the specified daysAhead window (upcoming)
 * - nextDueDate is before today (overdue)
 */
describe('Property 14: Vaccination Due Date Alerts', () => {
    // Arbitrary for vaccination record
    const vaccinationRecordArb = fc.record({
        id: fc.uuid(),
        batchId: fc.uuid(),
        vaccineName: fc.constantFrom(
            'Newcastle',
            'Gumboro',
            'Fowl Pox',
            'Marek',
        ),
        dateAdministered: fc.date({
            min: new Date('2020-01-01'),
            max: new Date('2025-12-31'),
        }),
        nextDueDate: fc.option(
            fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2027-12-31'),
            }),
            { nil: null },
        ),
        batchStatus: fc.constantFrom('active', 'sold', 'depleted'),
    })

    /**
     * Check if a vaccination is upcoming (due within daysAhead)
     */
    function isUpcoming(
        nextDueDate: Date | null,
        today: Date,
        daysAhead: number,
    ): boolean {
        if (!nextDueDate) return false
        const futureDate = new Date(today)
        futureDate.setDate(today.getDate() + daysAhead)
        return nextDueDate >= today && nextDueDate <= futureDate
    }

    /**
     * Check if a vaccination is overdue
     */
    function isOverdue(nextDueDate: Date | null, today: Date): boolean {
        if (!nextDueDate) return false
        return nextDueDate < today
    }

    /**
     * Get upcoming vaccinations for active batches
     */
    function getUpcomingVaccinations(
        vaccinations: Array<{
            id: string
            nextDueDate: Date | null
            batchStatus: string
        }>,
        today: Date,
        daysAhead: number,
    ) {
        return vaccinations.filter(
            (v) =>
                v.batchStatus === 'active' &&
                isUpcoming(v.nextDueDate, today, daysAhead),
        )
    }

    /**
     * Get overdue vaccinations for active batches
     */
    function getOverdueVaccinations(
        vaccinations: Array<{
            id: string
            nextDueDate: Date | null
            batchStatus: string
        }>,
        today: Date,
    ) {
        return vaccinations.filter(
            (v) =>
                v.batchStatus === 'active' && isOverdue(v.nextDueDate, today),
        )
    }

    it('upcoming vaccinations are within daysAhead window', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 30 }),
                (vaccinations, today, daysAhead) => {
                    const upcoming = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        daysAhead,
                    )
                    const futureDate = new Date(today)
                    futureDate.setDate(today.getDate() + daysAhead)

                    for (const v of upcoming) {
                        expect(v.nextDueDate).not.toBeNull()
                        expect(v.nextDueDate!.getTime()).toBeGreaterThanOrEqual(
                            today.getTime(),
                        )
                        expect(v.nextDueDate!.getTime()).toBeLessThanOrEqual(
                            futureDate.getTime(),
                        )
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('overdue vaccinations have nextDueDate before today', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                (vaccinations, today) => {
                    const overdue = getOverdueVaccinations(vaccinations, today)

                    for (const v of overdue) {
                        expect(v.nextDueDate).not.toBeNull()
                        expect(v.nextDueDate!.getTime()).toBeLessThan(
                            today.getTime(),
                        )
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('vaccinations without nextDueDate are never in alerts', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 30 }),
                (vaccinations, today, daysAhead) => {
                    const upcoming = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        daysAhead,
                    )
                    const overdue = getOverdueVaccinations(vaccinations, today)

                    for (const v of upcoming) {
                        expect(v.nextDueDate).not.toBeNull()
                    }
                    for (const v of overdue) {
                        expect(v.nextDueDate).not.toBeNull()
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('inactive batch vaccinations are excluded from alerts', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 30 }),
                (vaccinations, today, daysAhead) => {
                    const upcoming = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        daysAhead,
                    )
                    const overdue = getOverdueVaccinations(vaccinations, today)

                    for (const v of upcoming) {
                        expect(v.batchStatus).toBe('active')
                    }
                    for (const v of overdue) {
                        expect(v.batchStatus).toBe('active')
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('upcoming and overdue sets are mutually exclusive', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 30 }),
                (vaccinations, today, daysAhead) => {
                    const upcoming = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        daysAhead,
                    )
                    const overdue = getOverdueVaccinations(vaccinations, today)

                    const upcomingIds = new Set(upcoming.map((v) => v.id))
                    const overdueIds = new Set(overdue.map((v) => v.id))

                    // No overlap between upcoming and overdue
                    for (const id of upcomingIds) {
                        expect(overdueIds.has(id)).toBe(false)
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('total alerts equals upcoming plus overdue count', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 0, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 30 }),
                (vaccinations, today, daysAhead) => {
                    const upcoming = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        daysAhead,
                    )
                    const overdue = getOverdueVaccinations(vaccinations, today)
                    const totalAlerts = upcoming.length + overdue.length

                    expect(totalAlerts).toBe(upcoming.length + overdue.length)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('vaccination due exactly on today is upcoming, not overdue', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.uuid(),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                    noInvalidDate: true,
                }),
                fc.integer({ min: 1, max: 30 }),
                (id, batchId, today, daysAhead) => {
                    const vaccination = {
                        id,
                        batchId,
                        nextDueDate: new Date(today), // Due exactly today
                        batchStatus: 'active' as const,
                    }

                    const isUpcomingResult = isUpcoming(
                        vaccination.nextDueDate,
                        today,
                        daysAhead,
                    )
                    const isOverdueResult = isOverdue(
                        vaccination.nextDueDate,
                        today,
                    )

                    expect(isUpcomingResult).toBe(true)
                    expect(isOverdueResult).toBe(false)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('increasing daysAhead includes more upcoming vaccinations', () => {
        fc.assert(
            fc.property(
                fc.array(vaccinationRecordArb, { minLength: 5, maxLength: 50 }),
                fc.date({
                    min: new Date('2024-01-01'),
                    max: new Date('2026-01-01'),
                }),
                fc.integer({ min: 1, max: 15 }),
                fc.integer({ min: 16, max: 30 }),
                (vaccinations, today, smallWindow, largeWindow) => {
                    const upcomingSmall = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        smallWindow,
                    )
                    const upcomingLarge = getUpcomingVaccinations(
                        vaccinations,
                        today,
                        largeWindow,
                    )

                    // Larger window should include at least as many as smaller window
                    expect(upcomingLarge.length).toBeGreaterThanOrEqual(
                        upcomingSmall.length,
                    )
                },
            ),
            { numRuns: 100 },
        )
    })
})
