/**
 * Currency Formatter for Internationalization Settings
 *
 * Formats monetary values according to user-configured currency settings.
 * Supports symbol positioning, decimal places, and custom separators.
 */

import { toNumber } from './currency-core'
import type { MoneyInput } from './currency-core'
import type { UserSettings } from './currency-presets'

/**
 * Format a number with custom thousand and decimal separators.
 * Internal utility function used by formatters.
 *
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places
 * @param thousandSeparator - Character used for thousands
 * @param decimalSeparator - Character used for decimal point
 * @returns Formatted numeric string
 */
function formatNumber(
    value: number,
    decimals: number,
    thousandSeparator: string,
    decimalSeparator: string,
): string {
    // Handle the integer and decimal parts separately
    const fixed = Math.abs(value).toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')

    // Add thousand separators to integer part
    const withThousands = intPart.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        thousandSeparator,
    )

    // Combine with decimal part if needed
    const formatted =
        decimals > 0 && decPart
            ? `${withThousands}${decimalSeparator}${decPart}`
            : withThousands

    // Add negative sign if needed
    return value < 0 ? `-${formatted}` : formatted
}

/**
 * Format a monetary amount according to user settings
 *
 * @param amount - The amount to format (string, number, or Decimal)
 * @param settings - User settings containing currency configuration
 * @returns Formatted currency string (e.g., "$1,234.56" or "1.234,56 €")
 */
export function formatCurrency(
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
    const value = toNumber(amount)
    const formatted = formatNumber(
        value,
        settings.currencyDecimals,
        settings.thousandSeparator,
        settings.decimalSeparator,
    )

    return settings.currencySymbolPosition === 'before'
        ? `${settings.currencySymbol}${formatted}`
        : `${formatted}${settings.currencySymbol}`
}

/**
 * Format a monetary amount in compact form (e.g., "$1.5K", "₦2.3M")
 *
 * @param amount - The amount to format
 * @param settings - User settings containing currency configuration
 * @returns Compact formatted currency string
 */
export function formatCompactCurrency(
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
    const value = toNumber(amount)
    const absValue = Math.abs(value)
    const sign = value < 0 ? '-' : ''

    let compactValue: string
    if (absValue >= 1_000_000_000) {
        compactValue = `${(absValue / 1_000_000_000).toFixed(1)}B`
    } else if (absValue >= 1_000_000) {
        compactValue = `${(absValue / 1_000_000).toFixed(1)}M`
    } else if (absValue >= 1_000) {
        compactValue = `${(absValue / 1_000).toFixed(1)}K`
    } else {
        // For small values, use full formatting
        return formatCurrency(amount, settings)
    }

    // Remove trailing .0
    compactValue = compactValue.replace(/\.0([BMK])$/, '$1')

    return settings.currencySymbolPosition === 'before'
        ? `${sign}${settings.currencySymbol}${compactValue}`
        : `${sign}${compactValue}${settings.currencySymbol}`
}

/**
 * Parse a formatted currency string back to a number
 *
 * @param formatted - The formatted currency string
 * @param settings - User settings containing currency configuration
 * @returns The numeric value, or null if parsing fails
 */
export function parseCurrency(
    formatted: string,
    settings: Pick<
        UserSettings,
        'currencySymbol' | 'thousandSeparator' | 'decimalSeparator'
    >,
): number | null {
    try {
        // Remove currency symbol and whitespace
        let cleaned = formatted.replace(settings.currencySymbol, '').trim()

        // Remove thousand separators
        cleaned = cleaned.split(settings.thousandSeparator).join('')

        // Replace decimal separator with standard period
        if (settings.decimalSeparator !== '.') {
            cleaned = cleaned.replace(settings.decimalSeparator, '.')
        }

        const value = parseFloat(cleaned)
        return isNaN(value) ? null : value
    } catch {
        return null
    }
}
