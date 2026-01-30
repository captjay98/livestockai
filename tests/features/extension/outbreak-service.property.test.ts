import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  MortalityData,
  OutbreakPattern,
  OutbreakThresholds,
} from '~/features/extension/outbreak-service'
import {
  classifySeverity,
  detectOutbreaks,
  shouldCreateAlert,
} from '~/features/extension/outbreak-service'

/**
 * Property-Based Tests for Extension Worker Mode - Outbreak Service
 *
 * Feature: complete-extension-worker-mode
 * Validates: Requirements 5.7, 17.2
 */

describe('Outbreak Service - Property-Based Tests', () => {
  const defaultThresholds: OutbreakThresholds = {
    watchThreshold: 5,
    alertThreshold: 10,
    criticalThreshold: 15,
    minFarmsWatch: 2,
    minFarmsAlert: 3,
    minFarmsCritical: 5,
  }

  const mortalityDataArbitrary = fc.record({
    farmId: fc.uuid(),
    species: fc.constantFrom('broiler', 'layer', 'catfish', 'cattle'),
    livestockType: fc.constantFrom('poultry', 'aquaculture', 'livestock'),
    mortalityRate: fc.double({ min: 0, max: 100, noNaN: true }),
    districtId: fc.uuid(),
  })

  /**
   * Property 7: Outbreak Clustering
   *
   * For any set of farms with high mortality, outbreak detection should only
   * cluster farms that share the same district AND species. Farms in different
   * districts or with different species should not be in the same outbreak alert.
   *
   * Validates: Requirements 5.7, 17.2
   */
  describe('Property 7: Outbreak clustering', () => {
    it('should only cluster farms with same district, species, and livestock type', () => {
      fc.assert(
        fc.property(
          fc.array(mortalityDataArbitrary, { minLength: 5, maxLength: 20 }),
          (mortalityData) => {
            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            // Verify each pattern has consistent district/species/type
            return patterns.every((pattern) => {
              const farms = mortalityData.filter((farm) =>
                pattern.affectedFarms.some((af) => af.farmId === farm.farmId),
              )

              return farms.every(
                (farm) =>
                  farm.districtId === pattern.districtId &&
                  farm.species === pattern.species &&
                  farm.livestockType === pattern.livestockType,
              )
            })
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should create separate patterns for different districts', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.uuid(),
          fc.constantFrom('broiler', 'layer'),
          fc.constantFrom('poultry'),
          fc.array(fc.double({ min: 10, max: 20, noNaN: true }), {
            minLength: 3,
            maxLength: 5,
          }),
          (district1, district2, species, livestockType, mortalityRates) => {
            fc.pre(district1 !== district2)

            // Create farms in two different districts
            const mortalityData: Array<MortalityData> = mortalityRates.flatMap(
              (rate, idx) => [
                {
                  farmId: `farm-d1-${idx}`,
                  species,
                  livestockType,
                  mortalityRate: rate,
                  districtId: district1,
                },
                {
                  farmId: `farm-d2-${idx}`,
                  species,
                  livestockType,
                  mortalityRate: rate,
                  districtId: district2,
                },
              ],
            )

            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            // Should have separate patterns for each district
            const district1Patterns = patterns.filter(
              (p) => p.districtId === district1,
            )
            const district2Patterns = patterns.filter(
              (p) => p.districtId === district2,
            )

            return district1Patterns.length > 0 && district2Patterns.length > 0
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should create separate patterns for different species', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.array(fc.double({ min: 10, max: 20, noNaN: true }), {
            minLength: 3,
            maxLength: 5,
          }),
          (districtId, mortalityRates) => {
            // Create farms with two different species in same district
            const mortalityData: Array<MortalityData> = mortalityRates.flatMap(
              (rate, idx) => [
                {
                  farmId: `farm-broiler-${idx}`,
                  species: 'broiler',
                  livestockType: 'poultry',
                  mortalityRate: rate,
                  districtId,
                },
                {
                  farmId: `farm-catfish-${idx}`,
                  species: 'catfish',
                  livestockType: 'aquaculture',
                  mortalityRate: rate,
                  districtId,
                },
              ],
            )

            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            // Should have separate patterns for each species
            const broilerPatterns = patterns.filter(
              (p) => p.species === 'broiler',
            )
            const catfishPatterns = patterns.filter(
              (p) => p.species === 'catfish',
            )

            return broilerPatterns.length > 0 && catfishPatterns.length > 0
          },
        ),
        { numRuns: 50 },
      )
    })

    it('should not include farms below watch threshold', () => {
      fc.assert(
        fc.property(
          fc.array(mortalityDataArbitrary, { minLength: 5, maxLength: 20 }),
          (mortalityData) => {
            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            // All affected farms should be above watch threshold
            return patterns.every((pattern) =>
              pattern.affectedFarms.every(
                (farm) =>
                  farm.mortalityRate >= defaultThresholds.watchThreshold,
              ),
            )
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should calculate correct average mortality rate', () => {
      fc.assert(
        fc.property(
          fc.array(mortalityDataArbitrary, { minLength: 5, maxLength: 20 }),
          (mortalityData) => {
            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            return patterns.every((pattern) => {
              const sum = pattern.affectedFarms.reduce(
                (acc, farm) => acc + farm.mortalityRate,
                0,
              )
              const expected = sum / pattern.affectedFarms.length
              return Math.abs(pattern.averageMortalityRate - expected) < 0.0001
            })
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Property 8: Outbreak Severity Classification
   *
   * For any outbreak alert:
   * - 'critical' if affected farm count >= 5 OR average mortality >= red threshold
   * - 'alert' if affected farm count >= 3
   * - 'watch' otherwise
   *
   * Validates: Requirements 11.3, 17.2
   */
  describe('Property 8: Outbreak severity classification', () => {
    it('should classify as critical when farm count >= minFarmsCritical and mortality >= criticalThreshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }),
          fc.double({ min: 15, max: 50, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )
            return severity === 'critical'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should classify as alert when farm count >= minFarmsAlert and mortality >= alertThreshold', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 4 }),
          fc.double({ min: 10, max: 14.9, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )
            return severity === 'alert'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should classify as watch when below alert thresholds', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 2 }),
          fc.double({ min: 5, max: 9.9, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )
            return severity === 'watch'
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should always return one of three valid severities', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.double({ min: 0, max: 100, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )

            return ['watch', 'alert', 'critical'].includes(severity)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should be monotonic with respect to farm count', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.double({ min: 15, max: 50, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity1 = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )
            const severity2 = classifySeverity(
              farmCount + 5,
              avgMortality,
              defaultThresholds,
            )

            const severityOrder = { watch: 0, alert: 1, critical: 2 }
            return severityOrder[severity2] >= severityOrder[severity1]
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should be monotonic with respect to mortality rate', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 10 }),
          fc.double({ min: 5, max: 20, noNaN: true }),
          (farmCount, avgMortality) => {
            const severity1 = classifySeverity(
              farmCount,
              avgMortality,
              defaultThresholds,
            )
            const severity2 = classifySeverity(
              farmCount,
              avgMortality + 10,
              defaultThresholds,
            )

            const severityOrder = { watch: 0, alert: 1, critical: 2 }
            return severityOrder[severity2] >= severityOrder[severity1]
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should handle boundary values correctly', () => {
      // Exactly at critical threshold
      const atCritical = classifySeverity(
        defaultThresholds.minFarmsCritical,
        defaultThresholds.criticalThreshold,
        defaultThresholds,
      )
      expect(atCritical).toBe('critical')

      // Just below critical threshold
      const belowCritical = classifySeverity(
        defaultThresholds.minFarmsCritical,
        defaultThresholds.criticalThreshold - 0.1,
        defaultThresholds,
      )
      expect(belowCritical).toBe('alert')

      // Exactly at alert threshold
      const atAlert = classifySeverity(
        defaultThresholds.minFarmsAlert,
        defaultThresholds.alertThreshold,
        defaultThresholds,
      )
      expect(atAlert).toBe('alert')

      // Just below alert threshold
      const belowAlert = classifySeverity(
        defaultThresholds.minFarmsAlert,
        defaultThresholds.alertThreshold - 0.1,
        defaultThresholds,
      )
      expect(belowAlert).toBe('watch')
    })
  })

  /**
   * Additional property: shouldCreateAlert
   */
  describe('Additional: Should create alert', () => {
    it('should not create alert when active alert exists for same species/type', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('broiler', 'layer'),
          fc.constantFrom('poultry'),
          (districtId, species, livestockType) => {
            const pattern: OutbreakPattern = {
              districtId,
              species,
              livestockType,
              affectedFarms: [],
              averageMortalityRate: 15,
              severity: 'critical',
            }

            const existingAlerts = [
              { species, livestockType, status: 'active' },
            ]

            return !shouldCreateAlert(pattern, existingAlerts)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should create alert when no active alert exists', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('broiler', 'layer'),
          fc.constantFrom('poultry'),
          (districtId, species, livestockType) => {
            const pattern: OutbreakPattern = {
              districtId,
              species,
              livestockType,
              affectedFarms: [],
              averageMortalityRate: 15,
              severity: 'critical',
            }

            const existingAlerts = [
              {
                species: 'catfish',
                livestockType: 'aquaculture',
                status: 'active',
              },
            ]

            return shouldCreateAlert(pattern, existingAlerts)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('should create alert when existing alert is resolved', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('broiler', 'layer'),
          fc.constantFrom('poultry'),
          (districtId, species, livestockType) => {
            const pattern: OutbreakPattern = {
              districtId,
              species,
              livestockType,
              affectedFarms: [],
              averageMortalityRate: 15,
              severity: 'critical',
            }

            const existingAlerts = [
              { species, livestockType, status: 'resolved' },
            ]

            return shouldCreateAlert(pattern, existingAlerts)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  /**
   * Integration property: End-to-end outbreak detection
   */
  describe('Integration: End-to-end outbreak detection', () => {
    it('should detect outbreaks and classify severity correctly', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom('broiler', 'layer'),
          fc.constantFrom('poultry'),
          fc.array(fc.double({ min: 15, max: 30, noNaN: true }), {
            minLength: 5,
            maxLength: 10,
          }),
          (districtId, species, livestockType, mortalityRates) => {
            const mortalityData: Array<MortalityData> = mortalityRates.map(
              (rate, idx) => ({
                farmId: `farm-${idx}`,
                species,
                livestockType,
                mortalityRate: rate,
                districtId,
              }),
            )

            const patterns = detectOutbreaks(mortalityData, defaultThresholds)

            // Should detect at least one pattern
            if (patterns.length === 0) return false

            const pattern = patterns[0]

            // Should be critical (5+ farms with 15+ mortality)
            return (
              pattern.severity === 'critical' &&
              pattern.affectedFarms.length >= 5 &&
              pattern.averageMortalityRate >= 15
            )
          },
        ),
        { numRuns: 50 },
      )
    })
  })
})
