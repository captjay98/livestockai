/**
 * Settings Module
 *
 * Internationalization settings for currency, date/time, and units.
 */

// Types and presets
export {
    type CurrencyPreset,
    type UserSettings,
    CURRENCY_PRESETS,
    DEFAULT_SETTINGS,
    getCurrencyPreset,
} from './currency-presets'

// Context and hooks
export { SettingsProvider, useSettings, useSettingsValue } from './context'
export {
    useFormatCurrency,
    useFormatDate,
    useFormatTime,
    useFormatWeight,
    useFormatArea,
    useFormatTemperature,
    usePreferences,
    useAlertThresholds,
    useBusinessSettings,
    useDashboardPreferences,
} from './hooks'

// Formatters (for use outside React components)
export {
    formatCurrency,
    formatCompactCurrency,
    parseCurrency,
} from './currency-formatter'
export {
    formatDate,
    formatTime,
    formatDateTime,
    formatShortDate,
    formatLongDate,
    formatRelativeDate,
    getDateFormatPattern,
} from './date-formatter'
export {
    formatWeight,
    formatWeightValue,
    formatArea,
    formatAreaValue,
    formatTemperature,
    formatTemperatureValue,
    toMetricWeight,
    toMetricArea,
    toCelsius,
    fromMetricWeight,
    fromMetricArea,
    fromCelsius,
    getWeightLabel,
    getAreaLabel,
    getTemperatureLabel,
} from './unit-converter'

// Server functions
export {
    getUserSettings,
    updateUserSettings,
    resetUserSettings,
} from './server'
