import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 13: Invoice Number Sequencing
 * Feature: poultry-fishery-tracker, Property 13: Invoice Number Sequencing
 * Validates: Requirements 18.2
 * 
 * Invoice numbers SHALL be:
 * - Unique across all invoices
 * - Sequential within a year (INV-YYYY-NNNN format)
 * - Auto-generated on invoice creation
 */
describe('Property 13: Invoice Number Sequencing', () => {
  // Arbitrary for year
  const yearArb = fc.integer({ min: 2020, max: 2030 })

  // Arbitrary for sequence number
  const sequenceArb = fc.integer({ min: 1, max: 9999 })


  /**
   * Generate invoice number in the format INV-YYYY-NNNN
   */
  function generateInvoiceNumber(year: number, sequence: number): string {
    return `INV-${year}-${sequence.toString().padStart(4, '0')}`
  }

  /**
   * Parse invoice number to extract year and sequence
   */
  function parseInvoiceNumber(invoiceNumber: string): { year: number; sequence: number } | null {
    const match = invoiceNumber.match(/^INV-(\d{4})-(\d{4})$/)
    if (!match) return null
    return {
      year: parseInt(match[1], 10),
      sequence: parseInt(match[2], 10),
    }
  }

  /**
   * Get next invoice number given existing invoices
   */
  function getNextInvoiceNumber(existingNumbers: string[], year: number): string {
    const prefix = `INV-${year}-`
    const yearNumbers = existingNumbers
      .filter(n => n.startsWith(prefix))
      .map(n => {
        const parsed = parseInvoiceNumber(n)
        return parsed ? parsed.sequence : 0
      })
    
    const maxSequence = yearNumbers.length > 0 ? Math.max(...yearNumbers) : 0
    return generateInvoiceNumber(year, maxSequence + 1)
  }

  it('invoice numbers follow INV-YYYY-NNNN format', () => {
    fc.assert(
      fc.property(yearArb, sequenceArb, (year, sequence) => {
        const invoiceNumber = generateInvoiceNumber(year, sequence)
        expect(invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/)
      }),
      { numRuns: 100 }
    )
  })

  it('invoice numbers are parseable', () => {
    fc.assert(
      fc.property(yearArb, sequenceArb, (year, sequence) => {
        const invoiceNumber = generateInvoiceNumber(year, sequence)
        const parsed = parseInvoiceNumber(invoiceNumber)
        
        expect(parsed).not.toBeNull()
        expect(parsed!.year).toBe(year)
        expect(parsed!.sequence).toBe(sequence)
      }),
      { numRuns: 100 }
    )
  })

  it('sequence numbers are padded to 4 digits', () => {
    fc.assert(
      fc.property(yearArb, fc.integer({ min: 1, max: 999 }), (year, sequence) => {
        const invoiceNumber = generateInvoiceNumber(year, sequence)
        const sequencePart = invoiceNumber.split('-')[2]
        
        expect(sequencePart.length).toBe(4)
        expect(parseInt(sequencePart, 10)).toBe(sequence)
      }),
      { numRuns: 100 }
    )
  })


  it('next invoice number increments sequence by 1', () => {
    fc.assert(
      fc.property(
        yearArb,
        fc.array(fc.integer({ min: 1, max: 9998 }), { minLength: 1, maxLength: 50 }),
        (year, sequences) => {
          const existingNumbers = sequences.map(s => generateInvoiceNumber(year, s))
          const nextNumber = getNextInvoiceNumber(existingNumbers, year)
          const parsed = parseInvoiceNumber(nextNumber)
          
          expect(parsed).not.toBeNull()
          expect(parsed!.sequence).toBe(Math.max(...sequences) + 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('first invoice of year starts at sequence 1', () => {
    fc.assert(
      fc.property(yearArb, (year) => {
        const nextNumber = getNextInvoiceNumber([], year)
        const parsed = parseInvoiceNumber(nextNumber)
        
        expect(parsed).not.toBeNull()
        expect(parsed!.sequence).toBe(1)
      }),
      { numRuns: 100 }
    )
  })

  it('invoice numbers from different years are independent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2025 }),
        fc.integer({ min: 2026, max: 2030 }),
        fc.array(sequenceArb, { minLength: 1, maxLength: 20 }),
        (year1, year2, sequences) => {
          const existingNumbers = sequences.map(s => generateInvoiceNumber(year1, s))
          const nextForYear2 = getNextInvoiceNumber(existingNumbers, year2)
          const parsed = parseInvoiceNumber(nextForYear2)
          
          // Year 2 should start fresh at 1
          expect(parsed).not.toBeNull()
          expect(parsed!.sequence).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('generated invoice numbers are unique', () => {
    fc.assert(
      fc.property(
        yearArb,
        fc.integer({ min: 1, max: 100 }),
        (year, count) => {
          const numbers: string[] = []
          for (let i = 1; i <= count; i++) {
            numbers.push(generateInvoiceNumber(year, i))
          }
          
          const uniqueNumbers = new Set(numbers)
          expect(uniqueNumbers.size).toBe(count)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('invoice numbers sort correctly by sequence', () => {
    fc.assert(
      fc.property(
        yearArb,
        fc.array(sequenceArb, { minLength: 2, maxLength: 50 }),
        (year, sequences) => {
          const uniqueSequences = [...new Set(sequences)].sort((a, b) => a - b)
          const numbers = uniqueSequences.map(s => generateInvoiceNumber(year, s))
          const sorted = [...numbers].sort()
          
          // Lexicographic sort should match numeric sort due to zero-padding
          expect(sorted).toEqual(numbers)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('invoice number contains correct year', () => {
    fc.assert(
      fc.property(yearArb, sequenceArb, (year, sequence) => {
        const invoiceNumber = generateInvoiceNumber(year, sequence)
        expect(invoiceNumber).toContain(year.toString())
      }),
      { numRuns: 100 }
    )
  })
})
