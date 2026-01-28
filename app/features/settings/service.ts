/**
 * Pure business logic for settings operations.
 * All functions are side-effect-free and easily unit testable.
 */

import { formatCompactCurrency, formatCurrency } from './currency-formatter'
import { formatDate, formatDateTime, formatTime } from './date-formatter'
import { CURRENCY_PRESETS } from './currency-presets'
import type { UserSettings } from './currency-presets'
import type { MoneyInput } from './currency-core'

/**
 * Validate individual setting key-value pair
 * Returns validation error message or null if valid
 *
 * @param key - The setting key to validate
 * @param value - The value to validate
 * @returns Validation error message, or null if valid
 */
export function validateSettingData(
    key: string,
    value: unknown,
): string | null {
    // Currency validations
    if (key === 'currencyDecimals') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 0 || num > 4) {
            return 'Currency decimals must be between 0 and 4'
        }
    }

    if (key === 'currencySymbolPosition') {
        if (value !== 'before' && value !== 'after') {
            return 'Currency symbol position must be "before" or "after"'
        }
    }

    // Date/Time validations
    if (key === 'dateFormat') {
        const validFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']
        if (!validFormats.includes(value as string)) {
            return 'Invalid date format'
        }
    }

    if (key === 'timeFormat') {
        if (value !== '12h' && value !== '24h') {
            return 'Time format must be "12h" or "24h"'
        }
    }

    if (key === 'firstDayOfWeek') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 0 || num > 6) {
            return 'First day of week must be between 0 and 6'
        }
    }

    // Unit validations
    if (key === 'weightUnit') {
        if (value !== 'kg' && value !== 'lbs') {
            return 'Weight unit must be "kg" or "lbs"'
        }
    }

    if (key === 'areaUnit') {
        if (value !== 'sqm' && value !== 'sqft') {
            return 'Area unit must be "sqm" or "sqft"'
        }
    }

    if (key === 'temperatureUnit') {
        if (value !== 'celsius' && value !== 'fahrenheit') {
            return 'Temperature unit must be "celsius" or "fahrenheit"'
        }
    }

    // Alert threshold validations
    if (key === 'lowStockThresholdPercent') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 1 || num > 100) {
            return 'Low stock threshold must be between 1 and 100'
        }
    }

    if (key === 'mortalityAlertPercent') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 1 || num > 100) {
            return 'Mortality alert percent must be between 1 and 100'
        }
    }

    if (key === 'mortalityAlertQuantity') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 1) {
            return 'Mortality alert quantity must be at least 1'
        }
    }

    // Business setting validations
    if (key === 'defaultPaymentTermsDays') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 0) {
            return 'Default payment terms must be non-negative'
        }
    }

    if (key === 'fiscalYearStartMonth') {
        const num = typeof value === 'number' ? value : Number(value)
        if (isNaN(num) || num < 1 || num > 12) {
            return 'Fiscal year start must be between 1 and 12'
        }
    }

    // Theme validation
    if (key === 'theme') {
        if (value !== 'light' && value !== 'dark' && value !== 'system') {
            return 'Theme must be "light", "dark", or "system"'
        }
    }

    return null
}

/**
 * Format a monetary amount using user's currency settings
 *
 * @param amount - Amount to format
 * @param currencyCode - Currency code (USD, EUR, NGN, etc.)
 * @returns Formatted currency string
 */
export function formatCurrencyValue(
    amount: MoneyInput,
    currencyCode: string,
): string {
    const preset = CURRENCY_PRESETS.find((p) => p.code === currencyCode)

    if (!preset) {
        // Fallback to USD formatting if currency not found
        return formatCurrency(amount, {
            currencySymbol: '$',
            currencySymbolPosition: 'before',
            currencyDecimals: 2,
            thousandSeparator: ',',
            decimalSeparator: '.',
        })
    }

    return formatCurrency(amount, {
        currencySymbol: preset.symbol,
        currencySymbolPosition: preset.symbolPosition,
        currencyDecimals: preset.decimals,
        thousandSeparator: preset.thousandSeparator,
        decimalSeparator: preset.decimalSeparator,
    })
}

/**
 * Parse a setting value based on its key
 * Returns appropriately typed value
 *
 * @param key - The setting key
 * @param value - The raw value to parse
 * @returns Parsed value
 */
export function parseSettingValue(key: string, value: unknown): unknown {
    // Numbers
    if (
        [
            'currencyDecimals',
            'firstDayOfWeek',
            'lowStockThresholdPercent',
            'mortalityAlertPercent',
            'mortalityAlertQuantity',
            'defaultPaymentTermsDays',
            'fiscalYearStartMonth',
        ].includes(key)
    ) {
        return typeof value === 'number' ? value : Number(value)
    }

    // Booleans in nested objects
    if (key.startsWith('notifications.')) {
        return Boolean(value)
    }

    if (key.startsWith('dashboardCards.')) {
        return Boolean(value)
    }

    // Strings
    return value
}

/**
 * Validate currency code change
 *
 * @param oldCurrencyCode - Current currency code
 * @param newCurrencyCode - New currency code to change to
 * @returns Validation error message, or null if valid
 */
export function validateCurrencyChange(
    oldCurrencyCode: string,
    newCurrencyCode: string,
): string | null {
    // Check if new currency code exists in presets
    const preset = CURRENCY_PRESETS.find((p) => p.code === newCurrencyCode)

    if (!preset) {
        return `Currency code "${newCurrencyCode}" is not supported`
    }

    // No change is valid
    if (oldCurrencyCode === newCurrencyCode) {
        return null
    }

    return null
}

/**
 * Build a summary object from settings
 *
 * @param settings - User settings
 * @returns Summary object with key settings
 */
export function buildSettingsSummary(settings: UserSettings): {
    currency: {
        code: string
        symbol: string
        position: 'before' | 'after'
    }
    region: {
        dateFormat: string
        timeFormat: string
        language: string
    }
    units: {
        weight: 'kg' | 'lbs'
        area: 'sqm' | 'sqft'
        temperature: 'celsius' | 'fahrenheit'
    }
    business: {
        paymentTermsDays: number
        fiscalYearStart: number
    }
} {
    return {
        currency: {
            code: settings.currencyCode,
            symbol: settings.currencySymbol,
            position: settings.currencySymbolPosition,
        },
        region: {
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat,
            language: settings.language,
        },
        units: {
            weight: settings.weightUnit,
            area: settings.areaUnit,
            temperature: settings.temperatureUnit,
        },
        business: {
            paymentTermsDays: settings.defaultPaymentTermsDays,
            fiscalYearStart: settings.fiscalYearStartMonth,
        },
    }
}

/**
 * Merge notification settings with proper defaults
 * Deep merge to preserve existing notification preferences
 *
 * @param defaults - Default notification settings
 * @param existing - Existing notification settings
 * @param updates - New notification updates
 * @returns Merged notification settings
 */
export function mergeNotificationSettings(
    defaults: UserSettings['notifications'],
    existing?: UserSettings['notifications'] | null,
    updates?: Partial<UserSettings['notifications']>,
): UserSettings['notifications'] {
    return {
        ...defaults,
        ...(existing || {}),
        ...(updates || {}),
    } as UserSettings['notifications']
}

/**
 * Merge dashboard card settings with proper defaults
 * Deep merge to preserve existing card visibility preferences
 *
 * @param defaults - Default dashboard card settings
 * @param existing - Existing dashboard card settings
 * @param updates - New dashboard card updates
 * @returns Merged dashboard card settings
 */
export function mergeDashboardCardSettings(
    defaults: UserSettings['dashboardCards'],
    existing?: UserSettings['dashboardCards'] | null,
    updates?: Partial<UserSettings['dashboardCards']>,
): UserSettings['dashboardCards'] {
    return {
        ...defaults,
        ...(existing || {}),
        ...(updates || {}),
    } as UserSettings['dashboardCards']
}

/**
 * Check if low stock alert should be triggered
 *
 * @param currentQuantity - Current inventory quantity
 * @param initialQuantity - Initial quantity
 * @param thresholdPercent - Alert threshold percentage
 * @returns True if alert should be triggered
 */
export function shouldTriggerLowStockAlert(
    currentQuantity: number,
    initialQuantity: number,
    thresholdPercent: number,
): boolean {
    if (initialQuantity <= 0) return false

    const remainingPercent = (currentQuantity / initialQuantity) * 100
    return remainingPercent <= thresholdPercent
}

/**
 * Check if mortality alert should be triggered
 *
 * @param currentQuantity - Current quantity
 * @param initialQuantity - Initial quantity
 * @param alertPercent - Alert threshold percentage
 * @param alertQuantity - Minimum absolute quantity threshold
 * @returns True if alert should be triggered
 */
export function shouldTriggerMortalityAlert(
    currentQuantity: number,
    initialQuantity: number,
    alertPercent: number,
    alertQuantity: number,
): boolean {
    if (initialQuantity <= 0) return false

    const deaths = initialQuantity - currentQuantity
    const deathPercent = (deaths / initialQuantity) * 100

    // Trigger if death percent exceeds threshold AND absolute deaths exceed minimum
    return deathPercent >= alertPercent && deaths >= alertQuantity
}

/**
 * Format a date value using user settings
 *
 * @param date - Date to format
 * @param settings - User settings
 * @returns Formatted date string
 */
export function formatSettingDate(
    date: Date | string,
    settings: Pick<UserSettings, 'dateFormat'>,
): string {
    return formatDate(date, settings)
}

/**
 * Format a time value using user settings
 *
 * @param date - Date/time to format
 * @param settings - User settings
 * @returns Formatted time string
 */
export function formatSettingTime(
    date: Date | string,
    settings: Pick<UserSettings, 'timeFormat'>,
): string {
    return formatTime(date, settings)
}

/**
 * Format a date-time value using user settings
 *
 * @param date - Date/time to format
 * @param settings - User settings
 * @returns Formatted date-time string
 */
export function formatSettingDateTime(
    date: Date | string,
    settings: Pick<UserSettings, 'dateFormat' | 'timeFormat'>,
): string {
    return formatDateTime(date, settings)
}

/**
 * Format amount as compact currency using user settings
 *
 * @param amount - Amount to format
 * @param settings - User settings
 * @returns Compact formatted currency string
 */
export function formatCompactSettingCurrency(
    amount: MoneyInput,
    settings: Pick<
        UserSettings,
        | 'currencySymbol'
        | 'currencySymbolPosition'
        | 'currencyDecimals'
        | 'thousandSeparator'
        | 'decimalSeparator'
    >,
): string {
    return formatCompactCurrency(amount, settings)
}

/**
 * Validate a partial settings update object
 *
 * @param data - Partial settings data to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validatePartialSettings(
    data: Partial<Record<string, unknown>>,
): Array<string> {
    const errors: Array<string> = []

    for (const [key, value] of Object.entries(data)) {
        // Skip nested objects - they're validated separately
        if (key === 'notifications' || key === 'dashboardCards') {
            continue
        }

        const error = validateSettingData(key, value)
        if (error) {
            errors.push(`${key}: ${error}`)
        }
    }

    return errors
}

/**
 * Get currency preset by code
 *
 * @param code - Currency code
 * @returns Currency preset or undefined
 */
export function getCurrencyPresetByCode(code: string) {
    return CURRENCY_PRESETS.find((p) => p.code === code)
}

/**
 * Convert weight between kg and lbs
 *
 * @param weight - Weight value
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted weight
 */
export function convertWeight(
    weight: number,
    fromUnit: 'kg' | 'lbs',
    toUnit: 'kg' | 'lbs',
): number {
    if (fromUnit === toUnit) return weight

    // 1 kg = 2.20462 lbs
    const KG_TO_LBS = 2.20462

    if (fromUnit === 'kg' && toUnit === 'lbs') {
        return weight * KG_TO_LBS
    }

    // lbs to kg
    return weight / KG_TO_LBS
}

/**
 * Convert area between sqm and sqft
 *
 * @param area - Area value
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted area
 */
export function convertArea(
    area: number,
    fromUnit: 'sqm' | 'sqft',
    toUnit: 'sqm' | 'sqft',
): number {
    if (fromUnit === toUnit) return area

    // 1 sqm = 10.7639 sqft
    const SQM_TO_SQFT = 10.7639

    if (fromUnit === 'sqm' && toUnit === 'sqft') {
        return area * SQM_TO_SQFT
    }

    // sqft to sqm
    return area / SQM_TO_SQFT
}

/**
 * Convert temperature between celsius and fahrenheit
 *
 * @param temp - Temperature value
 * @param fromUnit - Source unit
 * @param toUnit - Target unit
 * @returns Converted temperature
 */
export function convertTemperature(
    temp: number,
    fromUnit: 'celsius' | 'fahrenheit',
    toUnit: 'celsius' | 'fahrenheit',
): number {
    if (fromUnit === toUnit) return temp

    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
        return (temp * 9) / 5 + 32
    }

    // fahrenheit to celsius
    return ((temp - 32) * 5) / 9
}
