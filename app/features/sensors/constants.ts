import type { SensorType } from '~/lib/db/types'

export const SENSOR_TYPES: Array<SensorType> = [
    'temperature',
    'humidity',
    'ammonia',
    'dissolved_oxygen',
    'ph',
    'water_level',
    'water_temperature',
    'hive_weight',
    'hive_temperature',
    'hive_humidity',
]

export const POLLING_INTERVALS = [5, 15, 30, 60] as const

interface SensorConfig {
    label: string
    unit: string
    minValid: number
    maxValid: number
    defaultThresholds: {
        min: number
        max: number
    }
}

export const SENSOR_TYPE_CONFIG: Record<SensorType, SensorConfig> = {
    temperature: {
        label: 'Temperature',
        unit: '°C',
        minValid: -40,
        maxValid: 85,
        defaultThresholds: { min: 20, max: 30 },
    },
    humidity: {
        label: 'Humidity',
        unit: '%',
        minValid: 0,
        maxValid: 100,
        defaultThresholds: { min: 40, max: 70 },
    },
    ammonia: {
        label: 'Ammonia',
        unit: 'ppm',
        minValid: 0,
        maxValid: 100,
        defaultThresholds: { min: 0, max: 25 },
    },
    dissolved_oxygen: {
        label: 'Dissolved Oxygen',
        unit: 'mg/L',
        minValid: 0,
        maxValid: 20,
        defaultThresholds: { min: 5, max: 8 },
    },
    ph: {
        label: 'pH',
        unit: '',
        minValid: 0,
        maxValid: 14,
        defaultThresholds: { min: 6.5, max: 8.5 },
    },
    water_level: {
        label: 'Water Level',
        unit: 'cm',
        minValid: 0,
        maxValid: 200,
        defaultThresholds: { min: 10, max: 90 },
    },
    water_temperature: {
        label: 'Water Temperature',
        unit: '°C',
        minValid: 0,
        maxValid: 50,
        defaultThresholds: { min: 25, max: 30 },
    },
    hive_weight: {
        label: 'Hive Weight',
        unit: 'kg',
        minValid: 0,
        maxValid: 100,
        defaultThresholds: { min: 20, max: 80 },
    },
    hive_temperature: {
        label: 'Hive Temperature',
        unit: '°C',
        minValid: 0,
        maxValid: 50,
        defaultThresholds: { min: 30, max: 37 },
    },
    hive_humidity: {
        label: 'Hive Humidity',
        unit: '%',
        minValid: 0,
        maxValid: 100,
        defaultThresholds: { min: 50, max: 70 },
    },
}

export function getDefaultThresholds(
    sensorType: SensorType,
    species?: string,
): { min: number; max: number } {
    const baseThresholds = SENSOR_TYPE_CONFIG[sensorType].defaultThresholds

    // Species-specific adjustments
    if (species && sensorType === 'temperature') {
        switch (species.toLowerCase()) {
            case 'broiler':
            case 'layer':
                return { min: 20, max: 25 }
            case 'catfish':
            case 'tilapia':
                return { min: 25, max: 30 }
            default:
                return baseThresholds
        }
    }

    if (species && sensorType === 'water_temperature') {
        switch (species.toLowerCase()) {
            case 'catfish':
                return { min: 26, max: 30 }
            case 'tilapia':
                return { min: 25, max: 28 }
            default:
                return baseThresholds
        }
    }

    return baseThresholds
}
