/**
 * Currency Presets for Internationalization Settings
 *
 * Provides pre-configured currency settings for 20 common currencies.
 * Users can select a preset to auto-fill all currency-related settings.
 */

export interface CurrencyPreset {
  code: string
  name: string
  symbol: string
  decimals: number
  symbolPosition: 'before' | 'after'
  thousandSeparator: ',' | '.' | ' ' | "'"
  decimalSeparator: '.' | ','
}

/**
 * 20 common currency presets with locale-appropriate formatting
 */
export const CURRENCY_PRESETS: Array<CurrencyPreset> = [
  // Americas
  {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'MXN',
    name: 'Mexican Peso',
    symbol: '$',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'BRL',
    name: 'Brazilian Real',
    symbol: 'R$',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },

  // Europe
  {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
  {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'CHF',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: "'",
    decimalSeparator: '.',
  },
  {
    code: 'SEK',
    name: 'Swedish Krona',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandSeparator: ' ',
    decimalSeparator: ',',
  },
  {
    code: 'NOK',
    name: 'Norwegian Krone',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandSeparator: ' ',
    decimalSeparator: ',',
  },
  {
    code: 'DKK',
    name: 'Danish Krone',
    symbol: 'kr',
    decimals: 2,
    symbolPosition: 'after',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },
  {
    code: 'PLN',
    name: 'Polish Zloty',
    symbol: 'zł',
    decimals: 2,
    symbolPosition: 'after',
    thousandSeparator: ' ',
    decimalSeparator: ',',
  },
  {
    code: 'TRY',
    name: 'Turkish Lira',
    symbol: '₺',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: '.',
    decimalSeparator: ',',
  },

  // Africa
  {
    code: 'NGN',
    name: 'Nigerian Naira',
    symbol: '₦',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'ZAR',
    name: 'South African Rand',
    symbol: 'R',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ' ',
    decimalSeparator: ',',
  },

  // Asia & Middle East
  {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    decimals: 0,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
  {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },

  // Oceania
  {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    decimals: 2,
    symbolPosition: 'before',
    thousandSeparator: ',',
    decimalSeparator: '.',
  },
]

/**
 * Get a currency preset by code
 */
export function getCurrencyPreset(code: string): CurrencyPreset | undefined {
  return CURRENCY_PRESETS.find((p) => p.code === code)
}

/**
 * User settings interface matching the database schema
 */
export interface UserSettings {
  // Currency
  currencyCode: string
  currencySymbol: string
  currencyDecimals: number
  currencySymbolPosition: 'before' | 'after'
  thousandSeparator: string
  decimalSeparator: string

  // Date/Time
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  firstDayOfWeek: number

  // Units
  weightUnit: 'kg' | 'lbs'
  areaUnit: 'sqm' | 'sqft'
  temperatureUnit: 'celsius' | 'fahrenheit'

  // Preferences
  defaultFarmId: string | null
  language: 'en' | 'ha' | 'yo' | 'ig' | 'fr' | 'pt' | 'sw'
  theme: 'light' | 'dark' | 'system'

  // Alerts
  lowStockThresholdPercent: number
  mortalityAlertPercent: number
  mortalityAlertQuantity: number
  notifications: {
    lowStock: boolean
    highMortality: boolean
    invoiceDue: boolean
    batchHarvest: boolean
    vaccinationDue: boolean
    medicationExpiry: boolean
    waterQualityAlert: boolean
    weeklySummary: boolean
    dailySales: boolean
    batchPerformance: boolean
    paymentReceived: boolean
  }

  // Business
  defaultPaymentTermsDays: number
  fiscalYearStartMonth: number

  // Dashboard
  dashboardCards: {
    inventory: boolean
    revenue: boolean
    expenses: boolean
    profit: boolean
    mortality: boolean
    feed: boolean
  }
}

/**
 * Default settings for new users (USD-based)
 */
export const DEFAULT_SETTINGS: UserSettings = {
  // Currency - USD as international default
  currencyCode: 'USD',
  currencySymbol: '$',
  currencyDecimals: 2,
  currencySymbolPosition: 'before',
  thousandSeparator: ',',
  decimalSeparator: '.',

  // Date/Time - ISO format as default
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  firstDayOfWeek: 1, // Monday

  // Units - Metric as default
  weightUnit: 'kg',
  areaUnit: 'sqm',
  temperatureUnit: 'celsius',

  // Preferences
  defaultFarmId: null,
  language: 'en',
  theme: 'system',

  // Alerts
  lowStockThresholdPercent: 10,
  mortalityAlertPercent: 5,
  mortalityAlertQuantity: 10,
  notifications: {
    lowStock: true,
    highMortality: true,
    invoiceDue: true,
    batchHarvest: true,
    vaccinationDue: true,
    medicationExpiry: true,
    waterQualityAlert: true,
    weeklySummary: false,
    dailySales: false,
    batchPerformance: false,
    paymentReceived: true,
  },

  // Business
  defaultPaymentTermsDays: 30,
  fiscalYearStartMonth: 1,

  // Dashboard
  dashboardCards: {
    inventory: true,
    revenue: true,
    expenses: true,
    profit: true,
    mortality: true,
    feed: true,
  },
}
