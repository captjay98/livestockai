/**
 * Property-based tests for sensor data ingestion
 * Validates: Requirements 3.1, 3.2, 3.3
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

// Ingestion validation logic (extracted for testing)
interface IngestInput {
    value: number
    recordedAt: Date
    sensorId: string
}

interface ValidationResult {
    valid: boolean
    error?: string
}

const MAX_READING_AGE_HOURS = 24

function validateIngestion(
    input: IngestInput,
    now: Date = new Date(),
): ValidationResult {
    // Check for NaN or Infinity
    if (!Number.isFinite(input.value)) {
        return { valid: false, error: 'Value must be a finite number' }
    }

    // Check timestamp is not in the future
    if (input.recordedAt > now) {
        return {
            valid: false,
            error: 'Reading timestamp cannot be in the future',
        }
    }

    // Check timestamp is not too old
    const ageHours =
        (now.getTime() - input.recordedAt.getTime()) / (1000 * 60 * 60)
    if (ageHours > MAX_READING_AGE_HOURS) {
        return { valid: false, error: 'Reading timestamp too old to accept' }
    }

    // Check sensor ID format (UUID)
    const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(input.sensorId)) {
        return { valid: false, error: 'Invalid sensor ID format' }
    }

    return { valid: true }
}

// Rate limiting logic
interface RateLimitState {
    requestCount: number
    windowStart: Date
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60

function checkRateLimit(
    state: RateLimitState,
    now: Date = new Date(),
): { allowed: boolean; newState: RateLimitState } {
    const windowAge = now.getTime() - state.windowStart.getTime()

    // Reset window if expired
    if (windowAge >= RATE_LIMIT_WINDOW_MS) {
        return {
            allowed: true,
            newState: { requestCount: 1, windowStart: now },
        }
    }

    // Check if under limit
    if (state.requestCount < RATE_LIMIT_MAX_REQUESTS) {
        return {
            allowed: true,
            newState: { ...state, requestCount: state.requestCount + 1 },
        }
    }

    return { allowed: false, newState: state }
}

describe('Sensor Ingestion Property Tests', () => {
    describe('Property 1: Valid readings are accepted', () => {
        /**
         * Validates: Requirements 3.1
         * Valid sensor readings should always be accepted
         */
        it('should accept readings with valid values and recent timestamps', () => {
            const now = new Date()

            fc.assert(
                fc.property(
                    fc.float({
                        min: -1000,
                        max: 1000,
                        noNaN: true,
                        noDefaultInfinity: true,
                    }),
                    fc.integer({ min: 0, max: MAX_READING_AGE_HOURS * 60 - 1 }), // minutes ago
                    fc.uuid(),
                    (value, minutesAgo, sensorId) => {
                        const recordedAt = new Date(
                            now.getTime() - minutesAgo * 60 * 1000,
                        )

                        const result = validateIngestion(
                            { value, recordedAt, sensorId },
                            now,
                        )

                        expect(result.valid).toBe(true)
                        expect(result.error).toBeUndefined()
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 2: Future timestamps are rejected', () => {
        /**
         * Validates: Requirements 3.2
         * Readings with future timestamps should be rejected
         */
        it('should reject readings with future timestamps', () => {
            const now = new Date()

            fc.assert(
                fc.property(
                    fc.float({
                        min: -1000,
                        max: 1000,
                        noNaN: true,
                        noDefaultInfinity: true,
                    }),
                    fc.integer({ min: 1, max: 1000 }), // minutes in future
                    fc.uuid(),
                    (value, minutesInFuture, sensorId) => {
                        const recordedAt = new Date(
                            now.getTime() + minutesInFuture * 60 * 1000,
                        )

                        const result = validateIngestion(
                            { value, recordedAt, sensorId },
                            now,
                        )

                        expect(result.valid).toBe(false)
                        expect(result.error).toContain('future')
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 3: Old timestamps are rejected', () => {
        /**
         * Validates: Requirements 3.3
         * Readings older than MAX_READING_AGE_HOURS should be rejected
         */
        it('should reject readings older than the maximum age', () => {
            const now = new Date()

            fc.assert(
                fc.property(
                    fc.float({
                        min: -1000,
                        max: 1000,
                        noNaN: true,
                        noDefaultInfinity: true,
                    }),
                    fc.integer({
                        min: MAX_READING_AGE_HOURS * 60 + 1,
                        max: 10000,
                    }), // minutes ago (too old)
                    fc.uuid(),
                    (value, minutesAgo, sensorId) => {
                        const recordedAt = new Date(
                            now.getTime() - minutesAgo * 60 * 1000,
                        )

                        const result = validateIngestion(
                            { value, recordedAt, sensorId },
                            now,
                        )

                        expect(result.valid).toBe(false)
                        expect(result.error).toContain('too old')
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 4: Invalid values are rejected', () => {
        /**
         * Validates: Requirements 3.1
         * NaN and Infinity values should be rejected
         */
        it('should reject NaN values', () => {
            const now = new Date()

            const result = validateIngestion(
                {
                    value: NaN,
                    recordedAt: now,
                    sensorId: '00000000-0000-0000-0000-000000000000',
                },
                now,
            )

            expect(result.valid).toBe(false)
            expect(result.error).toContain('finite')
        })

        it('should reject Infinity values', () => {
            const now = new Date()

            const resultPos = validateIngestion(
                {
                    value: Infinity,
                    recordedAt: now,
                    sensorId: '00000000-0000-0000-0000-000000000000',
                },
                now,
            )

            const resultNeg = validateIngestion(
                {
                    value: -Infinity,
                    recordedAt: now,
                    sensorId: '00000000-0000-0000-0000-000000000000',
                },
                now,
            )

            expect(resultPos.valid).toBe(false)
            expect(resultNeg.valid).toBe(false)
        })
    })

    describe('Property 5: Rate limiting correctness', () => {
        /**
         * Validates: Requirements 3.4
         * Rate limiting should allow up to MAX_REQUESTS per window
         */
        it('should allow requests up to the rate limit', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: RATE_LIMIT_MAX_REQUESTS - 1 }),
                    (requestCount) => {
                        const now = new Date()
                        const state: RateLimitState = {
                            requestCount,
                            windowStart: now,
                        }

                        const result = checkRateLimit(state, now)

                        expect(result.allowed).toBe(true)
                        expect(result.newState.requestCount).toBe(
                            requestCount + 1,
                        )
                    },
                ),
                { numRuns: 100 },
            )
        })

        it('should reject requests over the rate limit', () => {
            const now = new Date()
            const state: RateLimitState = {
                requestCount: RATE_LIMIT_MAX_REQUESTS,
                windowStart: now,
            }

            const result = checkRateLimit(state, now)

            expect(result.allowed).toBe(false)
        })

        it('should reset rate limit after window expires', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: RATE_LIMIT_MAX_REQUESTS, max: 1000 }),
                    fc.integer({
                        min: RATE_LIMIT_WINDOW_MS,
                        max: RATE_LIMIT_WINDOW_MS * 10,
                    }),
                    (requestCount, windowAgeMs) => {
                        const now = new Date()
                        const windowStart = new Date(
                            now.getTime() - windowAgeMs,
                        )
                        const state: RateLimitState = {
                            requestCount,
                            windowStart,
                        }

                        const result = checkRateLimit(state, now)

                        expect(result.allowed).toBe(true)
                        expect(result.newState.requestCount).toBe(1)
                    },
                ),
                { numRuns: 100 },
            )
        })
    })

    describe('Property 6: Sensor ID validation', () => {
        /**
         * Validates: Requirements 3.1
         * Invalid sensor IDs should be rejected
         */
        it('should reject invalid sensor ID formats', () => {
            const now = new Date()
            const invalidIds = [
                'not-a-uuid',
                '12345',
                '',
                'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                '00000000-0000-0000-0000-00000000000', // too short
            ]

            for (const sensorId of invalidIds) {
                const result = validateIngestion(
                    {
                        value: 25.5,
                        recordedAt: now,
                        sensorId,
                    },
                    now,
                )

                expect(result.valid).toBe(false)
            }
        })
    })
})
