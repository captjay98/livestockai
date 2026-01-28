/**
 * Property-Based Tests for Date Formatter
 *
 * Feature: internationalization-settings
 * Property 2: Date Formatting Correctness
 * Property 3: Time Formatting Correctness
 * Validates: Requirements 2.2, 2.3, 2.4
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
    formatDate,
    formatDateTime,
    formatLongDate,
    formatShortDate,
    formatTime,
} from '~/features/settings/date-formatter'

// Arbitrary for valid date settings
const dateSettingsArb = fc.record({
    dateFormat: fc.constantFrom('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'),
    timeFormat: fc.constantFrom('12h', '24h'),
})

// Arbitrary for valid dates (avoiding edge cases like year 0 and invalid dates)
const dateArb = fc
    .date({
        min: new Date('1970-01-01'),
        max: new Date('2099-12-31'),
    })
    .filter((d) => !isNaN(d.getTime()))

describe('Date Formatter Properties', () => {
    describe('Property 2: Date Formatting Correctness', () => {
        it('formatted date contains correct day, month, and year values', () => {
            // Feature: internationalization-settings, Property 2: Date Formatting Correctness
            // Validates: Requirements 2.2
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const result = formatDate(date, settings)
                    const day = date.getDate()
                    const month = date.getMonth() + 1
                    const year = date.getFullYear()

                    // The formatted string should contain the correct values
                    expect(result).toContain(year.toString())
                    expect(result).toContain(day.toString().padStart(2, '0'))
                    expect(result).toContain(month.toString().padStart(2, '0'))
                }),
                { numRuns: 100 },
            )
        })

        it('MM/DD/YYYY format has month before day', () => {
            // Feature: internationalization-settings, Property 2: Date Formatting Correctness
            // Validates: Requirements 2.2
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatDate(date, {
                        dateFormat: 'MM/DD/YYYY',
                    })
                    const parts = result.split('/')
                    expect(parts.length).toBe(3)

                    const month = date.getMonth() + 1
                    const day = date.getDate()
                    expect(parseInt(parts[0])).toBe(month)
                    expect(parseInt(parts[1])).toBe(day)
                }),
                { numRuns: 100 },
            )
        })

        it('DD/MM/YYYY format has day before month', () => {
            // Feature: internationalization-settings, Property 2: Date Formatting Correctness
            // Validates: Requirements 2.2
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatDate(date, {
                        dateFormat: 'DD/MM/YYYY',
                    })
                    const parts = result.split('/')
                    expect(parts.length).toBe(3)

                    const month = date.getMonth() + 1
                    const day = date.getDate()
                    expect(parseInt(parts[0])).toBe(day)
                    expect(parseInt(parts[1])).toBe(month)
                }),
                { numRuns: 100 },
            )
        })

        it('YYYY-MM-DD format has year first (ISO format)', () => {
            // Feature: internationalization-settings, Property 2: Date Formatting Correctness
            // Validates: Requirements 2.2
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatDate(date, {
                        dateFormat: 'YYYY-MM-DD',
                    })
                    const parts = result.split('-')
                    expect(parts.length).toBe(3)

                    const year = date.getFullYear()
                    expect(parseInt(parts[0])).toBe(year)
                }),
                { numRuns: 100 },
            )
        })

        it('formatDateTime combines date and time correctly', () => {
            // Feature: internationalization-settings, Property 2: Date Formatting Correctness
            // Validates: Requirements 2.2, 2.3
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const dateResult = formatDate(date, settings)
                    const timeResult = formatTime(date, settings)
                    const dateTimeResult = formatDateTime(date, settings)

                    expect(dateTimeResult).toBe(`${dateResult} ${timeResult}`)
                }),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 3: Time Formatting Correctness', () => {
        it('12h format uses AM/PM suffix', () => {
            // Feature: internationalization-settings, Property 3: Time Formatting Correctness
            // Validates: Requirements 2.3
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatTime(date, { timeFormat: '12h' })
                    expect(result.includes('AM') || result.includes('PM')).toBe(
                        true,
                    )
                }),
                { numRuns: 100 },
            )
        })

        it('24h format does not use AM/PM suffix', () => {
            // Feature: internationalization-settings, Property 3: Time Formatting Correctness
            // Validates: Requirements 2.3
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatTime(date, { timeFormat: '24h' })
                    expect(result.includes('AM')).toBe(false)
                    expect(result.includes('PM')).toBe(false)
                }),
                { numRuns: 100 },
            )
        })

        it('12h format hour is between 1 and 12', () => {
            // Feature: internationalization-settings, Property 3: Time Formatting Correctness
            // Validates: Requirements 2.3
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatTime(date, { timeFormat: '12h' })
                    const hourMatch = result.match(/^(\d{1,2}):/)
                    expect(hourMatch).not.toBeNull()

                    const hour = parseInt(hourMatch![1])
                    expect(hour).toBeGreaterThanOrEqual(1)
                    expect(hour).toBeLessThanOrEqual(12)
                }),
                { numRuns: 100 },
            )
        })

        it('24h format hour is between 0 and 23', () => {
            // Feature: internationalization-settings, Property 3: Time Formatting Correctness
            // Validates: Requirements 2.3
            fc.assert(
                fc.property(dateArb, (date) => {
                    const result = formatTime(date, { timeFormat: '24h' })
                    const hourMatch = result.match(/^(\d{2}):/)
                    expect(hourMatch).not.toBeNull()

                    const hour = parseInt(hourMatch![1])
                    expect(hour).toBeGreaterThanOrEqual(0)
                    expect(hour).toBeLessThanOrEqual(23)
                }),
                { numRuns: 100 },
            )
        })

        it('minutes are always between 0 and 59', () => {
            // Feature: internationalization-settings, Property 3: Time Formatting Correctness
            // Validates: Requirements 2.3
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const result = formatTime(date, settings)
                    const minuteMatch = result.match(/:(\d{2})/)
                    expect(minuteMatch).not.toBeNull()

                    const minutes = parseInt(minuteMatch![1])
                    expect(minutes).toBeGreaterThanOrEqual(0)
                    expect(minutes).toBeLessThanOrEqual(59)
                }),
                { numRuns: 100 },
            )
        })
    })

    describe('Short and Long Date Formats', () => {
        it('short date contains month name abbreviation', () => {
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const result = formatShortDate(date, settings)
                    const monthNames = [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'Jun',
                        'Jul',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec',
                    ]
                    const hasMonthName = monthNames.some((m) =>
                        result.includes(m),
                    )
                    expect(hasMonthName).toBe(true)
                }),
                { numRuns: 100 },
            )
        })

        it('long date contains full month name', () => {
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const result = formatLongDate(date, settings)
                    const monthNames = [
                        'January',
                        'February',
                        'March',
                        'April',
                        'May',
                        'June',
                        'July',
                        'August',
                        'September',
                        'October',
                        'November',
                        'December',
                    ]
                    const hasMonthName = monthNames.some((m) =>
                        result.includes(m),
                    )
                    expect(hasMonthName).toBe(true)
                }),
                { numRuns: 100 },
            )
        })

        it('long date contains the year', () => {
            fc.assert(
                fc.property(dateArb, dateSettingsArb, (date, settings) => {
                    const result = formatLongDate(date, settings)
                    expect(result).toContain(date.getFullYear().toString())
                }),
                { numRuns: 100 },
            )
        })
    })
})
