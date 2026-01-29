import { describe, expect, it } from 'vitest'
import { calculateFCR, calculateMortalityRate } from '~/lib/utils/calculations'

describe('calculateFCR', () => {
  it('should calculate FCR correctly for valid inputs', () => {
    expect(calculateFCR(150, 100)).toBe(1.5)
    expect(calculateFCR(200, 80)).toBe(2.5)
    expect(calculateFCR(100, 50)).toBe(2)
  })

  it('should round to 2 decimal places', () => {
    expect(calculateFCR(100, 33)).toBe(3.03)
    expect(calculateFCR(100, 37)).toBe(2.7)
  })

  it('should return null for invalid inputs', () => {
    expect(calculateFCR(0, 100)).toBeNull()
    expect(calculateFCR(100, 0)).toBeNull()
    expect(calculateFCR(-50, 100)).toBeNull()
    expect(calculateFCR(100, -50)).toBeNull()
  })
})

describe('calculateMortalityRate', () => {
  it('should calculate mortality rate correctly', () => {
    expect(calculateMortalityRate(100, 5)).toBe(5)
    expect(calculateMortalityRate(200, 10)).toBe(5)
    expect(calculateMortalityRate(50, 1)).toBe(2)
  })

  it('should handle edge cases', () => {
    expect(calculateMortalityRate(100, 0)).toBe(0)
    expect(calculateMortalityRate(0, 5)).toBe(0)
    expect(calculateMortalityRate(100, 100)).toBe(100)
  })

  it('should handle mortality exceeding initial quantity', () => {
    expect(calculateMortalityRate(100, 150)).toBe(150)
  })
})
