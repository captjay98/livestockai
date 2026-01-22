import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import type {
  CreateWaterQualityInput,
} from '~/features/water-quality/server'
import {
  buildWaterQualitySummary,
  calculateAverageParameter,
  calculateParameterTrend,
  determineParameterStatus,
  getWaterQualityIssues,
  isWaterQualityAlert,
  validateReadingData,
  validateUpdateData,
} from '~/features/water-quality/service'

describe('Water Quality Service', () => {
  describe('validateReadingData', () => {
    const validData: CreateWaterQualityInput = {
      batchId: 'batch-1',
      date: new Date(),
      ph: 7.0,
      temperatureCelsius: 27,
      dissolvedOxygenMgL: 6,
      ammoniaMgL: 0.01,
    }

    it('should accept valid data', () => {
      const result = validateReadingData(validData)
      expect(result).toBeNull()
    })

    it('should reject empty batch ID', () => {
      const result = validateReadingData({ ...validData, batchId: '' })
      expect(result).toBe('Batch ID is required')
    })

    it('should reject whitespace-only batch ID', () => {
      const result = validateReadingData({ ...validData, batchId: '   ' })
      expect(result).toBe('Batch ID is required')
    })

    it('should reject invalid date', () => {
      const result = validateReadingData({ ...validData, date: new Date('invalid') as any })
      expect(result).toBe('Valid measurement date is required')
    })

    it('should reject pH below 0', () => {
      const result = validateReadingData({ ...validData, ph: -1 })
      expect(result).toBe('pH must be between 0 and 14')
    })

    it('should reject pH above 14', () => {
      const result = validateReadingData({ ...validData, ph: 15 })
      expect(result).toBe('pH must be between 0 and 14')
    })

    it('should reject pH below minimum threshold', () => {
      const result = validateReadingData({ ...validData, ph: 6.0 })
      expect(result).toBe('pH must be between 6.5 and 9')
    })

    it('should reject pH above maximum threshold', () => {
      const result = validateReadingData({ ...validData, ph: 10.0 })
      expect(result).toBe('pH must be between 6.5 and 9')
    })

    it('should reject temperature below -10', () => {
      const result = validateReadingData({ ...validData, temperatureCelsius: -15 })
      expect(result).toBe('Temperature must be between -10°C and 50°C')
    })

    it('should reject temperature above 50', () => {
      const result = validateReadingData({ ...validData, temperatureCelsius: 55 })
      expect(result).toBe('Temperature must be between -10°C and 50°C')
    })

    it('should reject temperature below minimum threshold', () => {
      const result = validateReadingData({ ...validData, temperatureCelsius: 20 })
      expect(result).toBe('Temperature must be between 25°C and 30°C')
    })

    it('should reject temperature above maximum threshold', () => {
      const result = validateReadingData({ ...validData, temperatureCelsius: 35 })
      expect(result).toBe('Temperature must be between 25°C and 30°C')
    })

    it('should reject negative dissolved oxygen', () => {
      const result = validateReadingData({ ...validData, dissolvedOxygenMgL: -1 })
      expect(result).toBe('Dissolved oxygen cannot be negative')
    })

    it('should reject dissolved oxygen below minimum threshold', () => {
      const result = validateReadingData({ ...validData, dissolvedOxygenMgL: 3 })
      expect(result).toBe('Dissolved oxygen must be at least 5 mg/L')
    })

    it('should reject negative ammonia', () => {
      const result = validateReadingData({ ...validData, ammoniaMgL: -0.01 })
      expect(result).toBe('Ammonia cannot be negative')
    })

    it('should reject ammonia above maximum threshold', () => {
      const result = validateReadingData({ ...validData, ammoniaMgL: 0.1 })
      expect(result).toBe('Ammonia must be at most 0.02 mg/L')
    })

    it('should accept edge case pH values', () => {
      expect(validateReadingData({ ...validData, ph: 6.5 })).toBeNull()
      expect(validateReadingData({ ...validData, ph: 9.0 })).toBeNull()
    })

    it('should accept edge case temperature values', () => {
      expect(validateReadingData({ ...validData, temperatureCelsius: 25 })).toBeNull()
      expect(validateReadingData({ ...validData, temperatureCelsius: 30 })).toBeNull()
    })

    it('should accept edge case dissolved oxygen values', () => {
      expect(validateReadingData({ ...validData, dissolvedOxygenMgL: 5 })).toBeNull()
      expect(validateReadingData({ ...validData, dissolvedOxygenMgL: 10 })).toBeNull()
    })

    it('should accept edge case ammonia values', () => {
      expect(validateReadingData({ ...validData, ammoniaMgL: 0 })).toBeNull()
      expect(validateReadingData({ ...validData, ammoniaMgL: 0.02 })).toBeNull()
    })
  })

  describe('validateUpdateData', () => {
    it('should accept valid update data', () => {
      const result = validateUpdateData({
        ph: 7.5,
        temperatureCelsius: 28,
      })
      expect(result).toBeNull()
    })

    it('should accept empty update data', () => {
      const result = validateUpdateData({})
      expect(result).toBeNull()
    })

    it('should accept null values', () => {
      const result = validateUpdateData({
        ph: undefined,
        temperatureCelsius: undefined,
      })
      expect(result).toBeNull()
    })

    it('should reject invalid date', () => {
      const result = validateUpdateData({ date: new Date('invalid') as any })
      expect(result).toBe('Measurement date is invalid')
    })

    it('should reject out-of-range pH in update', () => {
      const result = validateUpdateData({ ph: 3 })
      expect(result).toBe('pH must be between 6.5 and 9')
    })

    it('should reject out-of-range temperature in update', () => {
      const result = validateUpdateData({ temperatureCelsius: -15 })
      expect(result).toBe('Temperature must be between -10°C and 50°C')
    })

    it('should reject negative dissolved oxygen in update', () => {
      const result = validateUpdateData({ dissolvedOxygenMgL: -1 })
      expect(result).toBe('Dissolved oxygen cannot be negative')
    })

    it('should reject high ammonia in update', () => {
      const result = validateUpdateData({ ammoniaMgL: 0.1 })
      expect(result).toBe('Ammonia must be at most 0.02 mg/L')
    })
  })

  describe('calculateAverageParameter', () => {
    const readings = [
      { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      { ph: '7.5', temperatureCelsius: '28.0', dissolvedOxygenMgL: '5.5', ammoniaMgL: '0.02' },
      { ph: '8.0', temperatureCelsius: '26.0', dissolvedOxygenMgL: '6.5', ammoniaMgL: '0.015' },
    ]

    it('should calculate average pH correctly', () => {
      const result = calculateAverageParameter(readings, 'ph')
      expect(result).toBeCloseTo(7.5, 2)
    })

    it('should calculate average temperature correctly', () => {
      const result = calculateAverageParameter(readings, 'temperatureCelsius')
      expect(result).toBeCloseTo(27, 2)
    })

    it('should calculate average dissolved oxygen correctly', () => {
      const result = calculateAverageParameter(readings, 'dissolvedOxygenMgL')
      expect(result).toBeCloseTo(6, 2)
    })

    it('should calculate average ammonia correctly', () => {
      const result = calculateAverageParameter(readings, 'ammoniaMgL')
      expect(result).toBeCloseTo(0.015, 3)
    })

    it('should return null for empty array', () => {
      const result = calculateAverageParameter([], 'ph')
      expect(result).toBeNull()
    })

    it('should handle invalid string values', () => {
      const invalidReadings = [
        { ph: 'invalid', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
        { ph: '7.0', temperatureCelsius: '28.0', dissolvedOxygenMgL: '5.5', ammoniaMgL: '0.02' },
      ]
      const result = calculateAverageParameter(invalidReadings, 'ph')
      expect(result).toBeCloseTo(3.5, 2)
    })
  })

  describe('determineParameterStatus', () => {
    describe('pH status', () => {
      it('should return optimal for ideal pH range', () => {
        expect(determineParameterStatus('ph', 7.0)).toBe('optimal')
        expect(determineParameterStatus('ph', 8.0)).toBe('optimal')
      })

      it('should return acceptable for threshold values', () => {
        expect(determineParameterStatus('ph', 6.5)).toBe('acceptable')
        expect(determineParameterStatus('ph', 9.0)).toBe('acceptable')
      })

      it('should return warning for slightly out of range', () => {
        expect(determineParameterStatus('ph', 6.0)).toBe('warning')
        expect(determineParameterStatus('ph', 9.5)).toBe('warning')
      })

      it('should return critical for far out of range', () => {
        expect(determineParameterStatus('ph', 4.0)).toBe('critical')
        expect(determineParameterStatus('ph', 11.0)).toBe('critical')
      })
    })

    describe('temperature status', () => {
      it('should return optimal for ideal temperature range', () => {
        expect(determineParameterStatus('temperatureCelsius', 27)).toBe('optimal')
        expect(determineParameterStatus('temperatureCelsius', 28)).toBe('optimal')
      })

      it('should return acceptable for threshold values', () => {
        expect(determineParameterStatus('temperatureCelsius', 25)).toBe('acceptable')
        expect(determineParameterStatus('temperatureCelsius', 30)).toBe('acceptable')
      })

      it('should return warning for slightly out of range', () => {
        expect(determineParameterStatus('temperatureCelsius', 22)).toBe('warning')
        expect(determineParameterStatus('temperatureCelsius', 33)).toBe('warning')
      })

      it('should return critical for far out of range', () => {
        expect(determineParameterStatus('temperatureCelsius', 15)).toBe('critical')
        expect(determineParameterStatus('temperatureCelsius', 40)).toBe('critical')
      })
    })

    describe('dissolved oxygen status', () => {
      it('should return optimal for high DO', () => {
        expect(determineParameterStatus('dissolvedOxygenMgL', 8)).toBe('optimal')
        expect(determineParameterStatus('dissolvedOxygenMgL', 10)).toBe('optimal')
      })

      it('should return acceptable for minimum DO', () => {
        expect(determineParameterStatus('dissolvedOxygenMgL', 5)).toBe('acceptable')
      })

      it('should return warning for slightly below minimum', () => {
        expect(determineParameterStatus('dissolvedOxygenMgL', 3.5)).toBe('warning')
      })

      it('should return critical for very low DO', () => {
        expect(determineParameterStatus('dissolvedOxygenMgL', 1)).toBe('critical')
      })
    })

    describe('ammonia status', () => {
      it('should return optimal for very low ammonia', () => {
        expect(determineParameterStatus('ammoniaMgL', 0.005)).toBe('optimal')
        expect(determineParameterStatus('ammoniaMgL', 0.01)).toBe('optimal')
      })

      it('should return acceptable for threshold ammonia', () => {
        expect(determineParameterStatus('ammoniaMgL', 0.02)).toBe('acceptable')
      })

      it('should return warning for slightly above threshold', () => {
        expect(determineParameterStatus('ammoniaMgL', 0.03)).toBe('warning')
      })

      it('should return critical for high ammonia', () => {
        expect(determineParameterStatus('ammoniaMgL', 0.1)).toBe('critical')
      })
    })
  })

  describe('isWaterQualityAlert', () => {
    it('should return false for optimal parameters', () => {
      const result = isWaterQualityAlert({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(false)
    })

    it('should return true for low pH', () => {
      const result = isWaterQualityAlert({
        ph: 6.0,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(true)
    })

    it('should return true for high pH', () => {
      const result = isWaterQualityAlert({
        ph: 10.0,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(true)
    })

    it('should return true for low temperature', () => {
      const result = isWaterQualityAlert({
        ph: 7.5,
        temperatureCelsius: 20,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(true)
    })

    it('should return true for high temperature', () => {
      const result = isWaterQualityAlert({
        ph: 7.5,
        temperatureCelsius: 35,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(true)
    })

    it('should return true for low dissolved oxygen', () => {
      const result = isWaterQualityAlert({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 3,
        ammoniaMgL: 0.01,
      })
      expect(result).toBe(true)
    })

    it('should return true for high ammonia', () => {
      const result = isWaterQualityAlert({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.1,
      })
      expect(result).toBe(true)
    })

    it('should return true for multiple issues', () => {
      const result = isWaterQualityAlert({
        ph: 5.5,
        temperatureCelsius: 35,
        dissolvedOxygenMgL: 2,
        ammoniaMgL: 0.1,
      })
      expect(result).toBe(true)
    })
  })

  describe('getWaterQualityIssues', () => {
    it('should return empty array for optimal parameters', () => {
      const result = getWaterQualityIssues({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result).toEqual([])
    })

    it('should report low pH issue', () => {
      const result = getWaterQualityIssues({
        ph: 6.0,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('pH too low')
    })

    it('should report high pH issue', () => {
      const result = getWaterQualityIssues({
        ph: 10.0,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('pH too high')
    })

    it('should report low temperature issue', () => {
      const result = getWaterQualityIssues({
        ph: 7.5,
        temperatureCelsius: 20,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('Temperature too low')
    })

    it('should report high temperature issue', () => {
      const result = getWaterQualityIssues({
        ph: 7.5,
        temperatureCelsius: 35,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('Temperature too high')
    })

    it('should report low dissolved oxygen issue', () => {
      const result = getWaterQualityIssues({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 3,
        ammoniaMgL: 0.01,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('Dissolved oxygen too low')
    })

    it('should report high ammonia issue', () => {
      const result = getWaterQualityIssues({
        ph: 7.5,
        temperatureCelsius: 27,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.1,
      })
      expect(result.length).toBe(1)
      expect(result[0]).toContain('Ammonia too high')
    })

    it('should report multiple issues', () => {
      const result = getWaterQualityIssues({
        ph: 5.5,
        temperatureCelsius: 35,
        dissolvedOxygenMgL: 2,
        ammoniaMgL: 0.1,
      })
      expect(result.length).toBe(4)
    })
  })

  describe('buildWaterQualitySummary', () => {
    const readings = [
      { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      { ph: '7.5', temperatureCelsius: '28.0', dissolvedOxygenMgL: '5.5', ammoniaMgL: '0.02' },
      { ph: '8.0', temperatureCelsius: '26.0', dissolvedOxygenMgL: '6.5', ammoniaMgL: '0.015' },
    ]

    it('should calculate averages', () => {
      const summary = buildWaterQualitySummary(readings)
      expect(summary.averagePh).toBeCloseTo(7.5, 2)
      expect(summary.averageTemperature).toBeCloseTo(27, 2)
      expect(summary.averageDissolvedOxygen).toBeCloseTo(6, 2)
      expect(summary.averageAmmonia).toBeCloseTo(0.015, 3)
    })

    it('should determine status for each parameter', () => {
      const summary = buildWaterQualitySummary(readings)
      // pH average is 7.5, which is optimal (7.0-8.5)
      expect(summary.phStatus).toBe('optimal')
      // Temperature average is 27, which is optimal (26-29)
      expect(summary.temperatureStatus).toBe('optimal')
      // DO average is 6, which is at threshold (>= 7 for optimal, >= 5 for acceptable)
      expect(summary.dissolvedOxygenStatus).toBe('acceptable')
      // Ammonia average is 0.015, which is between 0.01 and 0.02 (optimal is <= 0.01, acceptable is <= 0.02)
      expect(summary.ammoniaStatus).toBe('acceptable')
    })

    it('should count alerts', () => {
      const summary = buildWaterQualitySummary(readings)
      expect(summary.alertCount).toBe(0)
      expect(summary.issueCount).toBe(0)
    })

    it('should handle empty readings', () => {
      const summary = buildWaterQualitySummary([])
      expect(summary.averagePh).toBeNull()
      expect(summary.averageTemperature).toBeNull()
      expect(summary.averageDissolvedOxygen).toBeNull()
      expect(summary.averageAmmonia).toBeNull()
      expect(summary.phStatus).toBe('acceptable')
    })

    it('should count alerts when readings have issues', () => {
      const badReadings = [
        { ph: '5.0', temperatureCelsius: '35.0', dissolvedOxygenMgL: '2.0', ammoniaMgL: '0.1' },
      ]
      const summary = buildWaterQualitySummary(badReadings)
      expect(summary.alertCount).toBe(1)
      expect(summary.issueCount).toBe(4)
    })
  })

  describe('calculateParameterTrend', () => {
    it('should return stable for single reading', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'ph')
      expect(result).toBe('stable')
    })

    it('should return stable for similar values', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
        { ph: '7.1', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'ph')
      expect(result).toBe('stable')
    })

    it('should detect improving dissolved oxygen', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '5.0', ammoniaMgL: '0.01' },
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'dissolvedOxygenMgL')
      expect(result).toBe('improving')
    })

    it('should detect declining dissolved oxygen', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '5.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'dissolvedOxygenMgL')
      expect(result).toBe('declining')
    })

    it('should detect improving (decreasing) ammonia', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.02' },
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'ammoniaMgL')
      expect(result).toBe('improving')
    })

    it('should detect declining (increasing) ammonia', () => {
      const readings = [
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.02' },
      ]
      const result = calculateParameterTrend(readings, 'ammoniaMgL')
      expect(result).toBe('declining')
    })

    it('should handle empty readings', () => {
      const result = calculateParameterTrend([], 'ph')
      expect(result).toBe('stable')
    })

    it('should handle invalid values gracefully', () => {
      const readings = [
        { ph: 'invalid', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
        { ph: '7.0', temperatureCelsius: '27.0', dissolvedOxygenMgL: '6.0', ammoniaMgL: '0.01' },
      ]
      const result = calculateParameterTrend(readings, 'ph')
      expect(result).toBe('stable')
    })
  })

  describe('property-based tests', () => {
    describe('validateReadingData', () => {
      it('should accept valid pH values between 6.5 and 9.0', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 6.5, max: 9 }),
            (ph) => {
              const validData: CreateWaterQualityInput = {
                batchId: 'batch-1',
                date: new Date(),
                ph,
                temperatureCelsius: 27,
                dissolvedOxygenMgL: 6,
                ammoniaMgL: 0.01,
              }
              expect(validateReadingData(validData)).toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })

      it('should accept valid temperature between 25 and 30', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 25, max: 30 }),
            (temp) => {
              const validData: CreateWaterQualityInput = {
                batchId: 'batch-1',
                date: new Date(),
                ph: 7.5,
                temperatureCelsius: temp,
                dissolvedOxygenMgL: 6,
                ammoniaMgL: 0.01,
              }
              expect(validateReadingData(validData)).toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })

      it('should accept valid DO >= 5', () => {
        fc.assert(
          fc.property(
            fc.float({ min: 5, max: 15 }),
            (doVal) => {
              const validData: CreateWaterQualityInput = {
                batchId: 'batch-1',
                date: new Date(),
                ph: 7.5,
                temperatureCelsius: 27,
                dissolvedOxygenMgL: doVal,
                ammoniaMgL: 0.01,
              }
              expect(validateReadingData(validData)).toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })

      it('should accept valid ammonia <= 0.02', () => {
        // Use integer values from 0 to 20 and divide by 1000 to get valid 32-bit floats
        fc.assert(
          fc.property(
            fc.nat({ max: 20 }),
            (scaled) => {
              const ammonia = scaled / 1000 // Values from 0 to 0.02
              const validData: CreateWaterQualityInput = {
                batchId: 'batch-1',
                date: new Date(),
                ph: 7.5,
                temperatureCelsius: 27,
                dissolvedOxygenMgL: 6,
                ammoniaMgL: ammonia,
              }
              expect(validateReadingData(validData)).toBeNull()
            },
          ),
          { numRuns: 50 },
        )
      })
    })

    describe('calculateAverageParameter', () => {
      it('should always return a value between min and max of readings', () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                ph: fc.oneof(
                  fc.float({ min: 0, max: 14 }),
                  fc.constant('invalid'),
                ),
                temperatureCelsius: fc.float({ min: -10, max: 50 }),
                dissolvedOxygenMgL: fc.float({ min: 0, max: 20 }),
                ammoniaMgL: fc.float({ min: 0, max: 1 }),
              }),
              { minLength: 1, maxLength: 10 },
            ),
            (readings) => {
              const result = calculateAverageParameter(
                readings.map((r) => ({
                  ph: r.ph.toString(),
                  temperatureCelsius: r.temperatureCelsius.toString(),
                  dissolvedOxygenMgL: r.dissolvedOxygenMgL.toString(),
                  ammoniaMgL: r.ammoniaMgL.toString(),
                })),
                'ph',
              )
              if (result !== null) {
                expect(result).toBeGreaterThanOrEqual(0)
                expect(result).toBeLessThanOrEqual(14)
              }
            },
          ),
          { numRuns: 100 },
        )
      })
    })

    describe('isWaterQualityAlert', () => {
      it('should return false when all parameters are within thresholds', () => {
        // Use integer values to generate valid 32-bit floats
        // Use ranges that are safely within non-alert thresholds
        fc.assert(
          fc.property(
            fc.nat({ max: 20 }), // 6.5 to 8.5 (scaled by 10)
            fc.nat({ max: 4 }), // 25 to 29 (scaled by 1) - safely below 30
            fc.nat({ max: 10 }), // 5 to 14 (scaled by 1)
            fc.nat({ max: 18 }), // 0 to 0.018 (scaled by 1000) - safely below 0.02 to avoid fp precision issues
            (phScaled, tempScaled, doScaled, ammoniaScaled) => {
              const ph = 6.5 + phScaled / 10 // 6.5 to 8.5
              const temp = 25 + tempScaled // 25 to 29
              const doVal = 5 + doScaled // 5 to 14
              const ammonia = ammoniaScaled / 1000 // 0 to 0.019
              const result = isWaterQualityAlert({
                ph,
                temperatureCelsius: temp,
                dissolvedOxygenMgL: doVal,
                ammoniaMgL: ammonia,
              })
              expect(result).toBe(false)
            },
          ),
          { numRuns: 100 },
        )
      })
    })
  })
})
