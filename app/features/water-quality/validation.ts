import type { WaterQualitySearchParams } from './types'

export function validateWaterQualitySearch(
    search: Record<string, unknown>,
): WaterQualitySearchParams {
    const validSortBy = [
        'date',
        'ph',
        'temperatureCelsius',
        'dissolvedOxygenMgL',
        'ammoniaMgL',
        'createdAt',
    ] as const

    return {
        page: Number(search.page) || 1,
        pageSize: Number(search.pageSize) || 10,
        sortBy:
            typeof search.sortBy === 'string' &&
            (validSortBy as ReadonlyArray<string>).includes(search.sortBy)
                ? search.sortBy
                : 'date',
        sortOrder:
            typeof search.sortOrder === 'string' &&
            (search.sortOrder === 'asc' || search.sortOrder === 'desc')
                ? search.sortOrder
                : 'desc',
        q: typeof search.q === 'string' ? search.q : '',
    }
}
