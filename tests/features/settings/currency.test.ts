import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import Decimal from 'decimal.js'
import {
  calculatePercentage,
  compare,
  divide,
  equals,
  formatCurrency,
  formatCurrencyCompact,
  isValidAmount,
  multiply,
  parseCurrency,
  roundCurrency,
  subtract,
  sumAmounts,
  toDbString,
  toDecimal,
} from '~/features/settings/currency'

describe('Currency Utilities', () => {
  describe('Unit Tests', () => {
    describe('toDecimal', () => {
      it('converts numbers correctly', () => {
        expect(toDecimal(100).toString()).toBe('100')
        expect(toDecimal(100.5).toString()).toBe('100.5')
        expect(toDecimal(0).toString()).toBe('0')
      })

      it('converts strings correctly', () => {
        expect(toDecimal('100').toString()).toBe('100')
        expect(toDecimal('100.50').toString()).toBe('100.5')
        expect(toDecimal('1500.99').toString()).toBe('1500.99')
      })

      it('passes through Decimal instances', () => {
        const d = new Decimal('100.50')
        expect(toDecimal(d)).toBe(d)
      })
    })

    describe('toDbString', () => {
      it('formats with 2 decimal places', () => {
        expect(toDbString(100)).toBe('100.00')
        expect(toDbString(100.5)).toBe('100.50')
        expect(toDbString(100.999)).toBe('101.00') // rounds
        expect(toDbString('1500.50')).toBe('1500.50')
      })
    })

    describe('formatCurrency', () => {
      it('formats zero correctly', () => {
        expect(formatCurrency(0)).toBe('$0.00')
      })

      it('formats small amounts correctly', () => {
        expect(formatCurrency(100)).toBe('$100.00')
        expect(formatCurrency(100.5)).toBe('$100.50')
      })

      it('formats large amounts with separators', () => {
        expect(formatCurrency(1500000)).toBe('$1,500,000.00')
        expect(formatCurrency('2500000.75')).toBe('$2,500,000.75')
      })

      it('handles Decimal input', () => {
        expect(formatCurrency(new Decimal('1500.50'))).toBe('$1,500.50')
      })
    })

    describe('parseCurrency', () => {
      it('parses valid currency strings', () => {
        expect(parseCurrency('1500.50')?.toString()).toBe('1500.5')
        expect(parseCurrency('₦1,500.50')?.toString()).toBe('1500.5')
        expect(parseCurrency('₦ 2,500,000.00')?.toString()).toBe('2500000')
      })

      it('returns null for invalid strings', () => {
        expect(parseCurrency('invalid')).toBeNull()
        expect(parseCurrency('-100')).toBeNull()
        expect(parseCurrency('')).toBeNull()
      })
    })

    describe('formatCurrencyCompact', () => {
      it('formats millions correctly', () => {
        expect(formatCurrencyCompact(1500000)).toBe('$1.5M')
        expect(formatCurrencyCompact(2300000)).toBe('$2.3M')
      })

      it('formats thousands correctly', () => {
        expect(formatCurrencyCompact(1500)).toBe('$1.5K')
        expect(formatCurrencyCompact(25000)).toBe('$25K')
      })

      it('formats small amounts normally', () => {
        expect(formatCurrencyCompact(500)).toBe('$500.00')
        expect(formatCurrencyCompact(999)).toBe('$999.00')
      })
    })

    describe('calculatePercentage', () => {
      it('calculates percentages correctly', () => {
        expect(calculatePercentage(50, 100)).toBe(50)
        expect(calculatePercentage(25, 100)).toBe(25)
        expect(calculatePercentage(1, 3)).toBeCloseTo(33.33, 1)
      })

      it('handles zero total', () => {
        expect(calculatePercentage(50, 0)).toBe(0)
      })
    })

    describe('sumAmounts', () => {
      it('sums multiple amounts', () => {
        expect(sumAmounts(100, 200, 300).toString()).toBe('600')
        expect(sumAmounts('100.50', '200.25', '300.25').toString()).toBe('601')
      })

      it('handles empty input', () => {
        expect(sumAmounts().toString()).toBe('0')
      })
    })

    describe('multiply', () => {
      it('multiplies amounts correctly', () => {
        expect(multiply(100, 5).toString()).toBe('500')
        expect(multiply('10.50', 3).toString()).toBe('31.5')
      })
    })

    describe('divide', () => {
      it('divides amounts correctly', () => {
        expect(divide(100, 4)?.toString()).toBe('25')
        expect(divide('100', '3')?.toFixed(2)).toBe('33.33')
      })

      it('returns null for division by zero', () => {
        expect(divide(100, 0)).toBeNull()
      })
    })

    describe('subtract', () => {
      it('subtracts amounts correctly', () => {
        expect(subtract(100, 30).toString()).toBe('70')
        expect(subtract('100.50', '50.25').toString()).toBe('50.25')
      })
    })

    describe('isValidAmount', () => {
      it('validates positive amounts', () => {
        expect(isValidAmount(100)).toBe(true)
        expect(isValidAmount(0)).toBe(true)
        expect(isValidAmount('1500.50')).toBe(true)
      })

      it('rejects negative amounts', () => {
        expect(isValidAmount(-100)).toBe(false)
        expect(isValidAmount('-50')).toBe(false)
      })
    })

    describe('roundCurrency', () => {
      it('rounds to 2 decimal places', () => {
        expect(roundCurrency(100.555).toString()).toBe('100.56')
        expect(roundCurrency(100.554).toString()).toBe('100.55')
        expect(roundCurrency(100.5).toString()).toBe('100.5')
      })
    })

    describe('compare', () => {
      it('compares amounts correctly', () => {
        expect(compare(100, 200)).toBe(-1)
        expect(compare(200, 100)).toBe(1)
        expect(compare(100, 100)).toBe(0)
        expect(compare('100.50', '100.50')).toBe(0)
      })
    })

    describe('equals', () => {
      it('checks equality correctly', () => {
        expect(equals(100, 100)).toBe(true)
        expect(equals('100.50', 100.5)).toBe(true)
        expect(equals(100, 200)).toBe(false)
      })
    })
  })

  describe('Property Tests', () => {
    // Arbitrary for valid currency amounts (positive numbers with up to 2 decimal places)
    const currencyArb = fc
      .double({ min: 0, max: 1_000_000_000, noNaN: true })
      .map((n) => Math.round(n * 100) / 100) // Round to 2 decimal places

    it('formatCurrency produces strings starting with $ and containing correct value', () => {
      fc.assert(
        fc.property(currencyArb, (amount) => {
          const formatted = formatCurrency(amount)

          // Should start with $
          expect(formatted.startsWith('$')).toBe(true)

          // Should be parseable back (approximately)
          const parsed = parseCurrency(formatted)
          expect(parsed).not.toBeNull()
          if (parsed) {
            expect(parsed.toNumber()).toBeCloseTo(amount, 2)
          }
        }),
        { numRuns: 100 },
      )
    })

    it('toDbString and toDecimal are inverse operations', () => {
      fc.assert(
        fc.property(currencyArb, (amount) => {
          const dbString = toDbString(amount)
          const backToDecimal = toDecimal(dbString)

          // Should round-trip correctly (within 2 decimal places)
          expect(backToDecimal.toFixed(2)).toBe(toDecimal(amount).toFixed(2))
        }),
        { numRuns: 100 },
      )
    })

    it('sumAmounts is associative and commutative', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, currencyArb, (a, b, c) => {
          // Commutative: a + b = b + a
          expect(sumAmounts(a, b).equals(sumAmounts(b, a))).toBe(true)

          // Associative: (a + b) + c = a + (b + c)
          const leftAssoc = sumAmounts(sumAmounts(a, b).toNumber(), c)
          const rightAssoc = sumAmounts(a, sumAmounts(b, c).toNumber())
          expect(leftAssoc.toFixed(2)).toBe(rightAssoc.toFixed(2))
        }),
        { numRuns: 100 },
      )
    })

    it('calculatePercentage returns value between 0 and 100 for valid inputs', () => {
      fc.assert(
        fc.property(
          currencyArb,
          fc.double({ min: 0.01, max: 1_000_000_000, noNaN: true }),
          (part, total) => {
            // Ensure part <= total for meaningful percentage
            const actualPart = Math.min(part, total)
            const percentage = calculatePercentage(actualPart, total)

            expect(percentage).toBeGreaterThanOrEqual(0)
            expect(percentage).toBeLessThanOrEqual(100)
          },
        ),
        { numRuns: 100 },
      )
    })

    it('parseCurrency and formatCurrency are consistent', () => {
      fc.assert(
        fc.property(currencyArb, (amount) => {
          const formatted = formatCurrency(amount)
          const parsed = parseCurrency(formatted)

          expect(parsed).not.toBeNull()
          if (parsed) {
            // Should be equal within 2 decimal places
            expect(parsed.toFixed(2)).toBe(toDecimal(amount).toFixed(2))
          }
        }),
        { numRuns: 100 },
      )
    })

    it('multiply and divide are inverse operations', () => {
      fc.assert(
        fc.property(
          currencyArb,
          fc.double({ min: 0.01, max: 1000, noNaN: true }),
          (amount, factor) => {
            const multiplied = multiply(amount, factor)
            const divided = divide(multiplied, factor)

            expect(divided).not.toBeNull()
            if (divided) {
              // Should round-trip correctly (within reasonable precision)
              expect(divided.toFixed(2)).toBe(toDecimal(amount).toFixed(2))
            }
          },
        ),
        { numRuns: 100 },
      )
    })

    it('subtract is the inverse of sumAmounts', () => {
      fc.assert(
        fc.property(currencyArb, currencyArb, (a, b) => {
          const sum = sumAmounts(a, b)
          const difference = subtract(sum, b)

          expect(difference.toFixed(2)).toBe(toDecimal(a).toFixed(2))
        }),
        { numRuns: 100 },
      )
    })
  })
})
