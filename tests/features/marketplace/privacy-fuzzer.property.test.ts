import { describe, expect, it } from 'vitest'
import * as fc from 'fast-check'
import {
    fuzzListing,
    fuzzLocation,
    fuzzPrice,
    fuzzQuantity,
} from '~/features/marketplace/privacy-fuzzer'

describe('Privacy Fuzzer Property Tests', () => {
    it('Property 3: Quantity fuzzing produces valid ranges', () => {
        fc.assert(
            fc.property(fc.integer({ min: 1, max: 10000 }), (quantity) => {
                const fuzzed = fuzzQuantity(quantity)
                const [min, max] = fuzzed.split('-').map(Number)
                expect(min).toBeLessThanOrEqual(quantity)
                expect(max).toBeGreaterThanOrEqual(quantity)
                expect(min).toBeLessThanOrEqual(max)
            }),
            { numRuns: 100 },
        )
    })

    it('Property 4: Price fuzzing produces valid ranges', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }),
                fc.integer({ min: 1, max: 1000 }),
                (price1, price2) => {
                    const minPrice = Math.min(price1, price2)
                    const maxPrice = Math.max(price1, price2)
                    const fuzzed = fuzzPrice(minPrice, maxPrice, 'NGN')
                    const [min, max] = fuzzed.split('-').map(Number)
                    expect(min).toBeLessThanOrEqual(minPrice)
                    expect(max).toBeGreaterThanOrEqual(maxPrice)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('Property 5: Location fuzzing by level', () => {
        fc.assert(
            fc.property(
                fc.record({
                    coordinates: fc.tuple(fc.float(), fc.float()),
                    locality: fc.string(),
                    region: fc.string(),
                }),
                fc.constantFrom('low', 'medium', 'high'),
                (location, level) => {
                    const fuzzed = fuzzLocation({
                        ...location,
                        country: 'Nigeria'
                    }, level)

                    if (level === 'low') {
                        expect(fuzzed).toContain(location.locality)
                        expect(fuzzed).not.toMatch(/\d+\.\d+/)
                    } else if (level === 'medium') {
                        expect(fuzzed).toContain(location.region)
                        expect(fuzzed).not.toContain(location.locality)
                    } else {
                        expect(
                            fuzzed === 'Location hidden' ||
                                fuzzed.includes('km away'),
                        ).toBe(true)
                    }
                },
            ),
            { numRuns: 100 },
        )
    })

    it('Property 6: Owner sees exact values', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string(),
                    sellerId: fc.string(),
                    quantity: fc.integer({ min: 1, max: 1000 }),
                    price: fc.integer({ min: 1, max: 1000 }),
                    location: fc.record({
                        coordinates: fc.tuple(fc.float(), fc.float()),
                        locality: fc.string(),
                        region: fc.string(),
                    }),
                }),
                (listing) => {
                    const result = fuzzListing({
                        ...listing,
                        minPrice: listing.price.toString(),
                        maxPrice: listing.price.toString(),
                        currency: 'NGN' as const,
                        livestockType: 'poultry' as const,
                        species: 'broiler',
                        description: 'Test description',
                        farmId: 'test-farm',
                        createdAt: new Date() as any,
                        updatedAt: new Date() as any,
                        status: 'active' as const,
                        contactInfo: 'test@example.com',
                        images: [],
                        tags: [],
                        deletedAt: null
                    } as any, listing.sellerId)
                    expect(result.quantity).toBe(listing.quantity)
                    expect((result as any).minPrice).toBe(listing.price.toString())
                    expect(result.location).toEqual(listing.location)
                },
            ),
            { numRuns: 100 },
        )
    })

    it('Property 7: Non-owner sees fuzzed values', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string(),
                    sellerId: fc.string(),
                    quantity: fc.integer({ min: 1, max: 1000 }),
                    price: fc.integer({ min: 1, max: 1000 }),
                    location: fc.record({
                        coordinates: fc.tuple(fc.float(), fc.float()),
                        locality: fc.string(),
                        region: fc.string(),
                    }),
                }),
                fc.string(),
                (listing, viewerId) => {
                    fc.pre(viewerId !== listing.sellerId)
                    const result = fuzzListing({
                        ...listing,
                        minPrice: listing.price.toString(),
                        maxPrice: listing.price.toString(),
                        currency: 'NGN' as const,
                        livestockType: 'poultry' as const,
                        species: 'broiler',
                        description: 'Test description',
                        farmId: 'test-farm',
                        createdAt: new Date() as any,
                        updatedAt: new Date() as any,
                        status: 'active' as const,
                        contactInfo: 'test@example.com',
                        images: [],
                        tags: [],
                        deletedAt: null
                    } as any, viewerId)
                    expect(typeof result.quantity).toBe('string')
                    expect(typeof (result as any).minPrice).toBe('string')
                    expect(typeof result.location).toBe('string')
                },
            ),
            { numRuns: 100 },
        )
    })
})
