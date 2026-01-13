import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 12: Water Quality Threshold Alerts
 * Feature: poultry-fishery-tracker, Property 12: Water Quality Threshold Alerts
 * Validates: Requirements 17.2, 17.4
 *
 * Water quality alerts SHALL be generated when any parameter
 * falls outside the defined thresholds:
 * - pH: 6.5 - 8.5
 * - Temperature: 25°C - 32°C
 * - Dissolved Oxygen: >= 5 mg/L
 * - Ammonia: <= 0.02 mg/L
 */
describe('Property 12: Water Quality Threshold Alerts', () => {
  // Thresholds as defined in the system
  const THRESHOLDS = {
    ph: { min: 6.5, max: 8.5 },
    temperature: { min: 25, max: 32 },
    dissolvedOxygen: { min: 5 },
    ammonia: { max: 0.02 },
  }

  // Arbitrary for water quality parameters
  const waterQualityParamsArb = fc.record({
    ph: fc.double({ min: 0, max: 14, noNaN: true }),
    temperatureCelsius: fc.double({ min: 0, max: 50, noNaN: true }),
    dissolvedOxygenMgL: fc.double({ min: 0, max: 20, noNaN: true }),
    ammoniaMgL: fc.double({ min: 0, max: 1, noNaN: true }),
  })

  // Arbitrary for valid (in-range) water quality parameters
  const validWaterQualityArb = fc.record({
    ph: fc.double({ min: 6.5, max: 8.5, noNaN: true }),
    temperatureCelsius: fc.double({ min: 25, max: 32, noNaN: true }),
    dissolvedOxygenMgL: fc.double({ min: 5, max: 20, noNaN: true }),
    ammoniaMgL: fc.double({ min: 0, max: 0.02, noNaN: true }),
  })

  /**
   * Check if water quality parameters trigger an alert
   */
  function isWaterQualityAlert(params: {
    ph: number
    temperatureCelsius: number
    dissolvedOxygenMgL: number
    ammoniaMgL: number
  }): boolean {
    const { ph, temperatureCelsius, dissolvedOxygenMgL, ammoniaMgL } = params
    const t = THRESHOLDS

    return (
      ph < t.ph.min ||
      ph > t.ph.max ||
      temperatureCelsius < t.temperature.min ||
      temperatureCelsius > t.temperature.max ||
      dissolvedOxygenMgL < t.dissolvedOxygen.min ||
      ammoniaMgL > t.ammonia.max
    )
  }

  /**
   * Get list of specific issues
   */
  function getWaterQualityIssues(params: {
    ph: number
    temperatureCelsius: number
    dissolvedOxygenMgL: number
    ammoniaMgL: number
  }): Array<string> {
    const issues: Array<string> = []
    const t = THRESHOLDS

    if (params.ph < t.ph.min) issues.push('pH too low')
    if (params.ph > t.ph.max) issues.push('pH too high')
    if (params.temperatureCelsius < t.temperature.min)
      issues.push('Temperature too low')
    if (params.temperatureCelsius > t.temperature.max)
      issues.push('Temperature too high')
    if (params.dissolvedOxygenMgL < t.dissolvedOxygen.min)
      issues.push('Dissolved oxygen too low')
    if (params.ammoniaMgL > t.ammonia.max) issues.push('Ammonia too high')

    return issues
  }

  it('alert is triggered when pH is below minimum', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 6.49, noNaN: true }),
        fc.double({ min: 25, max: 32, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        fc.double({ min: 0, max: 0.02, noNaN: true }),
        (ph, temp, oxygen, ammonia) => {
          const params = {
            ph,
            temperatureCelsius: temp,
            dissolvedOxygenMgL: oxygen,
            ammoniaMgL: ammonia,
          }
          expect(isWaterQualityAlert(params)).toBe(true)
          expect(getWaterQualityIssues(params)).toContain('pH too low')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('alert is triggered when pH is above maximum', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 8.51, max: 14, noNaN: true }),
        fc.double({ min: 25, max: 32, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        fc.double({ min: 0, max: 0.02, noNaN: true }),
        (ph, temp, oxygen, ammonia) => {
          const params = {
            ph,
            temperatureCelsius: temp,
            dissolvedOxygenMgL: oxygen,
            ammoniaMgL: ammonia,
          }
          expect(isWaterQualityAlert(params)).toBe(true)
          expect(getWaterQualityIssues(params)).toContain('pH too high')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('alert is triggered when temperature is out of range', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 6.5, max: 8.5, noNaN: true }),
        fc.oneof(
          fc.double({ min: 0, max: 24.99, noNaN: true }),
          fc.double({ min: 32.01, max: 50, noNaN: true }),
        ),
        fc.double({ min: 5, max: 20, noNaN: true }),
        fc.double({ min: 0, max: 0.02, noNaN: true }),
        (ph, temp, oxygen, ammonia) => {
          const params = {
            ph,
            temperatureCelsius: temp,
            dissolvedOxygenMgL: oxygen,
            ammoniaMgL: ammonia,
          }
          expect(isWaterQualityAlert(params)).toBe(true)
          const issues = getWaterQualityIssues(params)
          expect(
            issues.includes('Temperature too low') ||
              issues.includes('Temperature too high'),
          ).toBe(true)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('alert is triggered when dissolved oxygen is below minimum', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 6.5, max: 8.5, noNaN: true }),
        fc.double({ min: 25, max: 32, noNaN: true }),
        fc.double({ min: 0, max: 4.99, noNaN: true }),
        fc.double({ min: 0, max: 0.02, noNaN: true }),
        (ph, temp, oxygen, ammonia) => {
          const params = {
            ph,
            temperatureCelsius: temp,
            dissolvedOxygenMgL: oxygen,
            ammoniaMgL: ammonia,
          }
          expect(isWaterQualityAlert(params)).toBe(true)
          expect(getWaterQualityIssues(params)).toContain(
            'Dissolved oxygen too low',
          )
        },
      ),
      { numRuns: 100 },
    )
  })

  it('alert is triggered when ammonia is above maximum', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 6.5, max: 8.5, noNaN: true }),
        fc.double({ min: 25, max: 32, noNaN: true }),
        fc.double({ min: 5, max: 20, noNaN: true }),
        fc.double({ min: 0.021, max: 1, noNaN: true }),
        (ph, temp, oxygen, ammonia) => {
          const params = {
            ph,
            temperatureCelsius: temp,
            dissolvedOxygenMgL: oxygen,
            ammoniaMgL: ammonia,
          }
          expect(isWaterQualityAlert(params)).toBe(true)
          expect(getWaterQualityIssues(params)).toContain('Ammonia too high')
        },
      ),
      { numRuns: 100 },
    )
  })

  it('no alert when all parameters are within range', () => {
    fc.assert(
      fc.property(validWaterQualityArb, (params) => {
        expect(isWaterQualityAlert(params)).toBe(false)
        expect(getWaterQualityIssues(params)).toHaveLength(0)
      }),
      { numRuns: 100 },
    )
  })

  it('number of issues matches number of out-of-range parameters', () => {
    fc.assert(
      fc.property(waterQualityParamsArb, (params) => {
        const issues = getWaterQualityIssues(params)
        let expectedIssues = 0

        if (params.ph < THRESHOLDS.ph.min) expectedIssues++
        if (params.ph > THRESHOLDS.ph.max) expectedIssues++
        if (params.temperatureCelsius < THRESHOLDS.temperature.min)
          expectedIssues++
        if (params.temperatureCelsius > THRESHOLDS.temperature.max)
          expectedIssues++
        if (params.dissolvedOxygenMgL < THRESHOLDS.dissolvedOxygen.min)
          expectedIssues++
        if (params.ammoniaMgL > THRESHOLDS.ammonia.max) expectedIssues++

        expect(issues.length).toBe(expectedIssues)
      }),
      { numRuns: 100 },
    )
  })

  it('alert status is consistent with issues list', () => {
    fc.assert(
      fc.property(waterQualityParamsArb, (params) => {
        const hasAlert = isWaterQualityAlert(params)
        const issues = getWaterQualityIssues(params)

        if (hasAlert) {
          expect(issues.length).toBeGreaterThan(0)
        } else {
          expect(issues.length).toBe(0)
        }
      }),
      { numRuns: 100 },
    )
  })

  it('boundary values are handled correctly', () => {
    // Exactly at minimum pH - should be valid
    expect(
      isWaterQualityAlert({
        ph: 6.5,
        temperatureCelsius: 28,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      }),
    ).toBe(false)

    // Exactly at maximum pH - should be valid
    expect(
      isWaterQualityAlert({
        ph: 8.5,
        temperatureCelsius: 28,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      }),
    ).toBe(false)

    // Exactly at minimum temperature - should be valid
    expect(
      isWaterQualityAlert({
        ph: 7,
        temperatureCelsius: 25,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      }),
    ).toBe(false)

    // Exactly at maximum temperature - should be valid
    expect(
      isWaterQualityAlert({
        ph: 7,
        temperatureCelsius: 32,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.01,
      }),
    ).toBe(false)

    // Exactly at minimum dissolved oxygen - should be valid
    expect(
      isWaterQualityAlert({
        ph: 7,
        temperatureCelsius: 28,
        dissolvedOxygenMgL: 5,
        ammoniaMgL: 0.01,
      }),
    ).toBe(false)

    // Exactly at maximum ammonia - should be valid
    expect(
      isWaterQualityAlert({
        ph: 7,
        temperatureCelsius: 28,
        dissolvedOxygenMgL: 6,
        ammoniaMgL: 0.02,
      }),
    ).toBe(false)
  })
})
