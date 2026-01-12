/**
 * Property-Based Tests for Currency Formatter
 *
 * Feature: internationalization-settings
 * Property 1: Currency Formatting Correctness
 * Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7
 */

import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
  formatCompactCurrency,
  formatCurrency,
  parseCurrency,
} from './currency-formatter'
import type { UserSettings } from './currency-presets'

// Arbitrary for valid currency settings
const currencySettingsArb = fc.record({
  currencySymbol: fc.constantFrom(
    '$',
    '€',
    '£',
    '₦',
    '¥',
    '₹',
    'R',
    'kr',
    'zł',
    '₺',
    'CHF',
    'KSh',
  ),
  currencySymbolPosition: fc.constantFrom('before', 'after'),
  currencyDecimals: fc.integer({ min: 0, max: 3 }),
  thousandSeparator: fc.constantFrom(',', '.', ' ', "'"),
  decimalSeparator: fc.constantFrom('.', ','),
})

// Arbitrary for positive monetary amounts
const amountArb = fc.double({
  min: 0,
  max: 1_000_000_000,
  noNaN: true,
  noDefaultInfinity: true,
})

describe('Currency Formatter Properties', () => {
  describe('Property 1: Currency Formatting Correctness', () => {
    it('formatted output contains the currency symbol exactly once', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.3
      fc.assert(
        fc.property(amountArb, currencySettingsArb, (amount, settings) => {
          const result = formatCurrency(amount, settings)
          const symbolCount = result.split(settings.currencySymbol).length - 1
          expect(symbolCount).toBe(1)
        }),
        { numRuns: 100 },
      )
    })

    it('symbol is positioned correctly based on currencySymbolPosition', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.4
      fc.assert(
        fc.property(amountArb, currencySettingsArb, (amount, settings) => {
          const result = formatCurrency(amount, settings)

          if (settings.currencySymbolPosition === 'before') {
            expect(result.startsWith(settings.currencySymbol)).toBe(true)
          } else {
            expect(result.endsWith(settings.currencySymbol)).toBe(true)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('output has correct number of decimal places', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.5
      fc.assert(
        fc.property(amountArb, currencySettingsArb, (amount, settings) => {
          // Skip if thousand and decimal separators are the same (ambiguous parsing)
          if (settings.thousandSeparator === settings.decimalSeparator) return

          const result = formatCurrency(amount, settings)

          // Remove the currency symbol to analyze the number part
          const numberPart = result.replace(settings.currencySymbol, '').trim()

          if (settings.currencyDecimals === 0) {
            // Should not contain decimal separator
            expect(numberPart.includes(settings.decimalSeparator)).toBe(false)
          } else {
            // Should contain decimal separator with correct number of digits after
            const parts = numberPart.split(settings.decimalSeparator)
            expect(parts.length).toBe(2)
            expect(parts[1].length).toBe(settings.currencyDecimals)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('thousand separator is used for values >= 1000', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.6
      const largeAmountArb = fc.double({
        min: 1000,
        max: 1_000_000_000,
        noNaN: true,
        noDefaultInfinity: true,
      })

      fc.assert(
        fc.property(largeAmountArb, currencySettingsArb, (amount, settings) => {
          // Skip if thousand and decimal separators are the same (invalid config)
          if (settings.thousandSeparator === settings.decimalSeparator) return

          const result = formatCurrency(amount, settings)
          const numberPart = result.replace(settings.currencySymbol, '').trim()

          // For amounts >= 1000, there should be at least one thousand separator
          expect(numberPart.includes(settings.thousandSeparator)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('decimal separator is used correctly', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.7
      fc.assert(
        fc.property(amountArb, currencySettingsArb, (amount, settings) => {
          // Only test when decimals > 0
          if (settings.currencyDecimals === 0) return

          const result = formatCurrency(amount, settings)
          const numberPart = result.replace(settings.currencySymbol, '').trim()

          // Should contain the configured decimal separator
          expect(numberPart.includes(settings.decimalSeparator)).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('formatCurrency and parseCurrency are consistent (round-trip)', () => {
      // Feature: internationalization-settings, Property 1: Currency Formatting Correctness
      // Validates: Requirements 1.3, 1.4, 1.5, 1.6, 1.7
      fc.assert(
        fc.property(amountArb, currencySettingsArb, (amount, settings) => {
          // Skip if thousand and decimal separators are the same (ambiguous parsing)
          if (settings.thousandSeparator === settings.decimalSeparator) return

          const formatted = formatCurrency(amount, settings)
          const parsed = parseCurrency(formatted, settings)

          expect(parsed).not.toBeNull()
          // Allow for floating point precision loss
          expect(parsed).toBeCloseTo(amount, settings.currencyDecimals)
        }),
        { numRuns: 100 },
      )
    })
  })

  describe('Compact Currency Formatting', () => {
    it('compact format uses K suffix for thousands', () => {
      const thousandsArb = fc.double({
        min: 1000,
        max: 999999,
        noNaN: true,
        noDefaultInfinity: true,
      })

      fc.assert(
        fc.property(thousandsArb, currencySettingsArb, (amount, settings) => {
          const result = formatCompactCurrency(amount, settings)
          expect(result.includes('K')).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('compact format uses M suffix for millions', () => {
      const millionsArb = fc.double({
        min: 1_000_000,
        max: 999_999_999,
        noNaN: true,
        noDefaultInfinity: true,
      })

      fc.assert(
        fc.property(millionsArb, currencySettingsArb, (amount, settings) => {
          const result = formatCompactCurrency(amount, settings)
          expect(result.includes('M')).toBe(true)
        }),
        { numRuns: 100 },
      )
    })

    it('compact format uses B suffix for billions', () => {
      const billionsArb = fc.double({
        min: 1_000_000_000,
        max: 10_000_000_000,
        noNaN: true,
        noDefaultInfinity: true,
      })

      fc.assert(
        fc.property(billionsArb, currencySettingsArb, (amount, settings) => {
          const result = formatCompactCurrency(amount, settings)
          expect(result.includes('B')).toBe(true)
        }),
        { numRuns: 100 },
      )
    })
  })
})
