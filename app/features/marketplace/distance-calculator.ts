/**
 * Geographic distance calculations for marketplace filtering
 */

const EARTH_RADIUS_KM = 6371

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const dLat = toRadians(lat2 - lat1)
    const dLon = toRadians(lon2 - lon1)

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) ** 2

    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calculate bounding box for SQL pre-filtering
 */
export function getBoundingBox(
    lat: number,
    lon: number,
    radiusKm: number,
): { minLat: number; maxLat: number; minLon: number; maxLon: number } {
    const bufferedRadius = radiusKm * 1.2
    const latDelta = (bufferedRadius / EARTH_RADIUS_KM) * (180 / Math.PI)
    const lonDelta = latDelta / Math.cos(toRadians(lat))

    return {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
        minLon: lon - lonDelta,
        maxLon: lon + lonDelta,
    }
}

/**
 * Filter listings by distance and add distance property
 */
export function filterByDistance<
    T extends { latitude: string | number; longitude: string | number },
>(
    listings: Array<T>,
    viewerLat: number,
    viewerLon: number,
    radiusKm: number,
): Array<T & { distanceKm: number }> {
    return listings
        .map((listing) => ({
            ...listing,
            distanceKm: calculateDistance(
                viewerLat,
                viewerLon,
                Number(listing.latitude),
                Number(listing.longitude),
            ),
        }))
        .filter((listing) => listing.distanceKm <= radiusKm)
        .sort((a, b) => a.distanceKm - b.distanceKm)
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
}
