import { SENSOR_TYPE_CONFIG } from './constants'
import type { SensorStatus, SensorType } from './types'

export function generateApiKey(): string {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

export async function hashApiKey(key: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(key)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyApiKey(
    key: string,
    hash: string,
): Promise<boolean> {
    const keyHash = await hashApiKey(key)
    return keyHash === hash
}

export function validateReadingValue(
    value: number,
    sensorType: SensorType,
): { isValid: boolean; isAnomaly: boolean } {
    const config = SENSOR_TYPE_CONFIG[sensorType]
    const isValid = value >= config.minValid && value <= config.maxValid
    return { isValid, isAnomaly: !isValid }
}

export function getSensorStatus(
    lastReadingAt: Date | null,
    pollingIntervalMinutes: number,
): SensorStatus {
    if (!lastReadingAt) return 'offline'

    const now = Date.now()
    const lastReading = lastReadingAt.getTime()
    const intervalMs = pollingIntervalMinutes * 60 * 1000

    const timeSinceReading = now - lastReading

    if (timeSinceReading <= intervalMs * 2) return 'online'
    if (timeSinceReading <= intervalMs * 4) return 'stale'
    return 'offline'
}

export function formatSensorValue(
    value: number,
    sensorType: SensorType,
): string {
    const config = SENSOR_TYPE_CONFIG[sensorType]
    return `${value.toFixed(1)}${config.unit}`
}
