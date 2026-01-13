/**
 * Property-Based Tests for Unit Converter
 *
 * Feature: internationalization-settings
 * Property 4: Weight Conversion Round-Trip
 * Property 5: Area Conversion Round-Trip
 * Property 6: Temperature Conversion Round-Trip
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  formatArea,
  formatTemperature,
  formatWeight,
  fromCelsius,
  fromMetricArea,
  fromMetricWeight,
  toCelsius,
  toMetricArea,
  toMetricWeight,
} from '~/features/settings/unit-converter'

// Arbitrary for weight values (reasonable range for livestock)
const weightArb = fc.double({
  min: 0.01,
  max: 10000,
  noNaN: true,
  noDefaultInfinity: true,
})

// Arbitrary for area values (reasonable range for farm structures)
const areaArb = fc.double({
  min: 0.1,
  max: 100000,
  noNaN: true,
  noDefaultInfinity: true,
})

// Arbitrary for temperature values (reasonable range for livestock environments)
const temperatureArb = fc.double({
  min: -40,
  max: 60,
  noNaN: true,
  noDefaultInfinity: true,
})

// Arbitrary for weight units
const weightUnitArb = fc.constantFrom('kg', 'lbs')

// Arbitrary for area units
const areaUnitArb = fc.constantFrom('sqm', 'sqft')

// Arbitrary for temperature units
const temperatureUnitArb = fc.constantFrom('celsius', 'fahrenheit')

describe('Unit Converter Properties', () => {
  describe('Property 4: Weight Conversion Round-Trip', () => {
    it('converting to display unit and back preserves the original value', () => {
      // Feature: internationalization-settings, Property 4: Weight Conversion Round-Trip
      // Validates: Requirements 3.2, 3.5
      fc.assert(
        fc.property(weightArb, weightUnitArb, (valueKg, unit) => {
          const displayValue = fromMetricWeight(valueKg, unit)
          const backToMetric = toMetricWeight(displayValue, unit)

          // Allow for floating point precision loss
          expect(backToMetric).toBeCloseTo(valueKg, 6)
        }),
        { numRuns: 100 },
      )
    })

    it('kg to kg conversion is identity', () => {
      // Feature: internationalization-settings, Property 4: Weight Conversion Round-Trip
      // Validates: Requirements 3.2
      fc.assert(
        fc.property(weightArb, (valueKg) => {
          const result = fromMetricWeight(valueKg, 'kg')
          expect(result).toBeCloseTo(valueKg, 10)
        }),
        { numRuns: 100 },
      )
    })

    it('lbs conversion uses correct factor (2.20462)', () => {
      // Feature: internationalization-settings, Property 4: Weight Conversion Round-Trip
      // Validates: Requirements 3.2
      fc.assert(
        fc.property(weightArb, (valueKg) => {
          const lbs = fromMetricWeight(valueKg, 'lbs')
          expect(lbs).toBeCloseTo(valueKg * 2.20462, 4)
        }),
        { numRuns: 100 },
      )
    })

    it('formatWeight includes correct unit suffix', () => {
      // Feature: internationalization-settings, Property 4: Weight Conversion Round-Trip
      // Validates: Requirements 3.2
      fc.assert(
        fc.property(weightArb, weightUnitArb, (valueKg, unit) => {
          const result = formatWeight(valueKg, { weightUnit: unit })
          expect(result.endsWith(unit)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 5: Area Conversion Round-Trip', () => {
    it('converting to display unit and back preserves the original value', () => {
      // Feature: internationalization-settings, Property 5: Area Conversion Round-Trip
      // Validates: Requirements 3.3, 3.5
      fc.assert(
        fc.property(areaArb, areaUnitArb, (valueSqm, unit) => {
          const displayValue = fromMetricArea(valueSqm, unit)
          const backToMetric = toMetricArea(displayValue, unit)

          // Allow for floating point precision loss
          expect(backToMetric).toBeCloseTo(valueSqm, 6)
        }),
        { numRuns: 100 },
      )
    })

    it('sqm to sqm conversion is identity', () => {
      // Feature: internationalization-settings, Property 5: Area Conversion Round-Trip
      // Validates: Requirements 3.3
      fc.assert(
        fc.property(areaArb, (valueSqm) => {
          const result = fromMetricArea(valueSqm, 'sqm')
          expect(result).toBeCloseTo(valueSqm, 10)
        }),
        { numRuns: 100 },
      )
    })

    it('sqft conversion uses correct factor (10.7639)', () => {
      // Feature: internationalization-settings, Property 5: Area Conversion Round-Trip
      // Validates: Requirements 3.3
      fc.assert(
        fc.property(areaArb, (valueSqm) => {
          const sqft = fromMetricArea(valueSqm, 'sqft')
          expect(sqft).toBeCloseTo(valueSqm * 10.7639, 3)
        }),
        { numRuns: 100 },
      )
    })

    it('formatArea includes correct unit suffix', () => {
      // Feature: internationalization-settings, Property 5: Area Conversion Round-Trip
      // Validates: Requirements 3.3
      fc.assert(
        fc.property(areaArb, areaUnitArb, (valueSqm, unit) => {
          const result = formatArea(valueSqm, { areaUnit: unit })
          const expectedSuffix = unit === 'sqm' ? 'm²' : 'ft²'
          expect(result.endsWith(expectedSuffix)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Property 6: Temperature Conversion Round-Trip', () => {
    it('converting to display unit and back preserves the original value', () => {
      // Feature: internationalization-settings, Property 6: Temperature Conversion Round-Trip
      // Validates: Requirements 3.4, 3.6
      fc.assert(
        fc.property(
          temperatureArb,
          temperatureUnitArb,
          (valueCelsius, unit) => {
            const displayValue = fromCelsius(valueCelsius, unit)
            const backToCelsius = toCelsius(displayValue, unit)

            // Allow for floating point precision loss
            expect(backToCelsius).toBeCloseTo(valueCelsius, 6)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('celsius to celsius conversion is identity', () => {
      // Feature: internationalization-settings, Property 6: Temperature Conversion Round-Trip
      // Validates: Requirements 3.4
      fc.assert(
        fc.property(temperatureArb, (valueCelsius) => {
          const result = fromCelsius(valueCelsius, 'celsius')
          expect(result).toBeCloseTo(valueCelsius, 10)
        }),
        { numRuns: 100 },
      )
    })

    it('fahrenheit conversion uses correct formula (C * 9/5 + 32)', () => {
      // Feature: internationalization-settings, Property 6: Temperature Conversion Round-Trip
      // Validates: Requirements 3.4
      fc.assert(
        fc.property(temperatureArb, (valueCelsius) => {
          const fahrenheit = fromCelsius(valueCelsius, 'fahrenheit')
          const expected = (valueCelsius * 9) / 5 + 32
          expect(fahrenheit).toBeCloseTo(expected, 6)
        }),
        { numRuns: 100 },
      )
    })

    it('0°C equals 32°F', () => {
      const fahrenheit = fromCelsius(0, 'fahrenheit')
      expect(fahrenheit).toBeCloseTo(32, 6)
    })

    it('100°C equals 212°F', () => {
      const fahrenheit = fromCelsius(100, 'fahrenheit')
      expect(fahrenheit).toBeCloseTo(212, 6)
    })

    it('-40°C equals -40°F (intersection point)', () => {
      const fahrenheit = fromCelsius(-40, 'fahrenheit')
      expect(fahrenheit).toBeCloseTo(-40, 6)
    })

    it('formatTemperature includes correct unit suffix', () => {
      // Feature: internationalization-settings, Property 6: Temperature Conversion Round-Trip
      // Validates: Requirements 3.4
      fc.assert(
        fc.property(
          temperatureArb,
          temperatureUnitArb,
          (valueCelsius, unit) => {
            const result = formatTemperature(valueCelsius, {
              temperatureUnit: unit,
            })
            const expectedSuffix = unit === 'celsius' ? '°C' : '°F'
            expect(result.endsWith(expectedSuffix)).toBe(true)
          },
        ),
        { numRuns: 100 },
      )
    })
  })

  describe('Monotonicity Properties', () => {
    it('weight conversion preserves ordering', () => {
      fc.assert(
        fc.property(weightArb, weightArb, weightUnitArb, (a, b, unit) => {
          // Skip when values are too close (floating point precision issues)
          if (Math.abs(a - b) < 1e-10) return

          const convertedA = fromMetricWeight(a, unit)
          const convertedB = fromMetricWeight(b, unit)

          if (a < b) {
            expect(convertedA).toBeLessThan(convertedB)
          } else if (a > b) {
            expect(convertedA).toBeGreaterThan(convertedB)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('area conversion preserves ordering', () => {
      fc.assert(
        fc.property(areaArb, areaArb, areaUnitArb, (a, b, unit) => {
          // Skip when values are too close (floating point precision issues)
          if (Math.abs(a - b) < 1e-10) return

          const convertedA = fromMetricArea(a, unit)
          const convertedB = fromMetricArea(b, unit)

          if (a < b) {
            expect(convertedA).toBeLessThan(convertedB)
          } else if (a > b) {
            expect(convertedA).toBeGreaterThan(convertedB)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('temperature conversion preserves ordering', () => {
      fc.assert(
        fc.property(
          temperatureArb,
          temperatureArb,
          temperatureUnitArb,
          (a, b, unit) => {
            // Skip when values are too close (floating point precision issues)
            if (Math.abs(a - b) < 1e-10) return

            const convertedA = fromCelsius(a, unit)
            const convertedB = fromCelsius(b, unit)

            if (a < b) {
              expect(convertedA).toBeLessThan(convertedB)
            } else if (a > b) {
              expect(convertedA).toBeGreaterThan(convertedB)
            }
          },
        ),
        { numRuns: 100 },
      )
    })
  })
})
