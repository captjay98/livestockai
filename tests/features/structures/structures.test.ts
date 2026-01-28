import { describe, expect, it } from 'vitest'
import {
    STRUCTURE_STATUSES,
    STRUCTURE_TYPES,
} from '~/features/structures/server'

describe('structures/server logic', () => {
    describe('STRUCTURE_TYPES', () => {
        it('should have all structure types', () => {
            expect(STRUCTURE_TYPES.length).toBe(14)
            const values = STRUCTURE_TYPES.map((t) => t.value)
            expect(values).toContain('house')
            expect(values).toContain('pond')
            expect(values).toContain('pen')
            expect(values).toContain('cage')
            expect(values).toContain('barn')
            expect(values).toContain('pasture')
            expect(values).toContain('hive')
            expect(values).toContain('milking_parlor')
            expect(values).toContain('shearing_shed')
            expect(values).toContain('tank')
            expect(values).toContain('tarpaulin')
            expect(values).toContain('raceway')
            expect(values).toContain('feedlot')
            expect(values).toContain('kraal')
        })

        it('should have value and label for each type', () => {
            STRUCTURE_TYPES.forEach((type) => {
                expect(typeof type.value).toBe('string')
                expect(typeof type.label).toBe('string')
                expect(type.value.length).toBeGreaterThan(0)
                expect(type.label.length).toBeGreaterThan(0)
            })
        })
    })

    describe('STRUCTURE_STATUSES', () => {
        it('should have all statuses', () => {
            expect(STRUCTURE_STATUSES.length).toBe(3)
            const values = STRUCTURE_STATUSES.map((s) => s.value)
            expect(values).toContain('active')
            expect(values).toContain('empty')
            expect(values).toContain('maintenance')
        })

        it('should have value and label for each status', () => {
            STRUCTURE_STATUSES.forEach((status) => {
                expect(typeof status.value).toBe('string')
                expect(typeof status.label).toBe('string')
            })
        })
    })
})
