import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  determineAlertSeverity,
  generateRecommendation,
} from '~/features/batches/alert-service'

describe('Alert Service - Property Tests', () => {
  describe('determineAlertSeverity', () => {
    it('Property 10: Alert severity classification is consistent', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 50, max: 150, noNaN: true }), // performance index
          (pi) => {
            const result = determineAlertSeverity(pi)
            
            if (pi < 80) {
              expect(result?.severity).toBe('critical')
              expect(result?.type).toBe('growthDeviation')
            } else if (pi < 90) {
              expect(result?.severity).toBe('warning')
              expect(result?.type).toBe('growthDeviation')
            } else if (pi > 110) {
              expect(result?.severity).toBe('info')
              expect(result?.type).toBe('earlyHarvest')
            } else {
              expect(result).toBeNull()
            }
          }
        )
      )
    })

    it('Property 11: Alert recommendation is always included when alert is triggered', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 50, max: 150, noNaN: true }),
          (pi) => {
            const result = determineAlertSeverity(pi)
            
            if (result) {
              expect(result.recommendation).toBeDefined()
              expect(result.recommendation.length).toBeGreaterThan(0)
              expect(typeof result.recommendation).toBe('string')
            }
          }
        )
      )
    })
  })

  describe('generateRecommendation', () => {
    it('should generate critical recommendations', () => {
      const rec = generateRecommendation(70, 'critical')
      
      expect(rec).toContain('behind')
      expect(rec).toContain('Immediate action')
      expect(rec.length).toBeGreaterThan(50)
    })

    it('should generate warning recommendations', () => {
      const rec = generateRecommendation(85, 'warning')
      
      expect(rec).toContain('behind')
      expect(rec).toContain('Recommended actions')
      expect(rec.length).toBeGreaterThan(50)
    })

    it('should generate info recommendations', () => {
      const rec = generateRecommendation(115, 'info')
      
      expect(rec).toContain('ahead')
      expect(rec).toContain('early harvest')
      expect(rec.length).toBeGreaterThan(50)
    })
  })

  describe('Alert thresholds', () => {
    it('should not alert for performance index 95-110', () => {
      const testCases = [95, 100, 105, 110]
      
      testCases.forEach(pi => {
        const result = determineAlertSeverity(pi)
        expect(result).toBeNull()
      })
    })

    it('should alert critical for PI < 80', () => {
      const testCases = [50, 60, 70, 79]
      
      testCases.forEach(pi => {
        const result = determineAlertSeverity(pi)
        expect(result?.severity).toBe('critical')
      })
    })

    it('should alert warning for PI 80-89', () => {
      const testCases = [80, 85, 89]
      
      testCases.forEach(pi => {
        const result = determineAlertSeverity(pi)
        expect(result?.severity).toBe('warning')
      })
    })

    it('should alert info for PI > 110', () => {
      const testCases = [111, 120, 130]
      
      testCases.forEach(pi => {
        const result = determineAlertSeverity(pi)
        expect(result?.severity).toBe('info')
      })
    })
  })
})
