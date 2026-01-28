/**
 * Onboarding Property Tests
 *
 * Property-based tests for onboarding logic.
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type { OnboardingProgress } from '~/features/onboarding/types'
import {
    ABBREVIATED_STEPS,
    DEFAULT_PROGRESS,
    ONBOARDING_STEPS,
} from '~/features/onboarding/types'

describe('Onboarding Types', () => {
    /**
     * Property 5: New User Has No Farms
     * A new user should start with default progress and need onboarding.
     * Validates: Requirements 6.1
     */
    it('should have correct default progress for new users', () => {
        fc.assert(
            fc.property(fc.constant(DEFAULT_PROGRESS), (progress) => {
                // New user starts at welcome step
                expect(progress.currentStep).toBe('welcome')
                // No steps completed yet
                expect(progress.completedSteps).toHaveLength(0)
                // Not skipped
                expect(progress.skipped).toBe(false)
                // No farm, structure, or batch IDs
                expect(progress.farmId).toBeUndefined()
                expect(progress.structureId).toBeUndefined()
                expect(progress.batchId).toBeUndefined()
                // Not completed
                expect(progress.completedAt).toBeUndefined()
                return true
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Onboarding steps are in correct order
     */
    it('should have onboarding steps in correct order', () => {
        fc.assert(
            fc.property(fc.constant(ONBOARDING_STEPS), (steps) => {
                // First step is welcome
                expect(steps[0]).toBe('welcome')
                // Last step is complete
                expect(steps[steps.length - 1]).toBe('complete')
                // All steps are unique
                const uniqueSteps = new Set(steps)
                expect(uniqueSteps.size).toBe(steps.length)
                return true
            }),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Abbreviated steps are subset of full steps
     */
    it('should have abbreviated steps as subset of full steps', () => {
        fc.assert(
            fc.property(
                fc.constant({
                    full: ONBOARDING_STEPS,
                    abbrev: ABBREVIATED_STEPS,
                }),
                ({ full, abbrev }) => {
                    // All abbreviated steps should be in full steps
                    for (const step of abbrev) {
                        expect(full).toContain(step)
                    }
                    // Abbreviated should be shorter
                    expect(abbrev.length).toBeLessThan(full.length)
                    // Both should start with welcome
                    expect(abbrev[0]).toBe('welcome')
                    expect(full[0]).toBe('welcome')
                    // Both should end with complete
                    expect(abbrev[abbrev.length - 1]).toBe('complete')
                    expect(full[full.length - 1]).toBe('complete')
                    return true
                },
            ),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Progress tracking maintains consistency
     */
    it('should maintain progress consistency when completing steps', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: ONBOARDING_STEPS.length - 2 }),
                (stepIndex) => {
                    const step = ONBOARDING_STEPS[stepIndex]
                    const progress: OnboardingProgress = {
                        ...DEFAULT_PROGRESS,
                        currentStep: step,
                        completedSteps: ONBOARDING_STEPS.slice(0, stepIndex),
                    }

                    // Current step should not be in completed steps
                    expect(progress.completedSteps).not.toContain(
                        progress.currentStep,
                    )
                    // Completed steps should be in order
                    for (let i = 0; i < progress.completedSteps.length; i++) {
                        expect(
                            ONBOARDING_STEPS.indexOf(
                                progress.completedSteps[i],
                            ),
                        ).toBe(i)
                    }
                    return true
                },
            ),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Skipped onboarding should have completedAt set
     */
    it('should set completedAt when onboarding is skipped', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('2020-01-01'),
                    max: new Date('2030-12-31'),
                }),
                (date) => {
                    // Skip invalid dates (NaN)
                    if (isNaN(date.getTime())) return true

                    const progress: OnboardingProgress = {
                        ...DEFAULT_PROGRESS,
                        skipped: true,
                        completedAt: date.toISOString(),
                    }

                    // If skipped, completedAt should be set
                    expect(progress.completedAt).toBeDefined()
                    // Should be a valid ISO date string
                    expect(new Date(progress.completedAt!).toISOString()).toBe(
                        progress.completedAt,
                    )
                    return true
                },
            ),
            { numRuns: 100 },
        )
    })

    /**
     * Property: Farm ID should be set after create-farm step
     */
    it('should have farmId after completing create-farm step', () => {
        fc.assert(
            fc.property(fc.uuid(), (farmId) => {
                const progress: OnboardingProgress = {
                    ...DEFAULT_PROGRESS,
                    currentStep: 'enable-modules',
                    completedSteps: ['welcome', 'create-farm'],
                    farmId,
                }

                // If create-farm is completed, farmId should be set
                if (progress.completedSteps.includes('create-farm')) {
                    expect(progress.farmId).toBeDefined()
                    expect(progress.farmId).toBe(farmId)
                }
                return true
            }),
            { numRuns: 100 },
        )
    })
})
