import type { Generated } from 'kysely'

// User Settings (Internationalization)
/**
 * User-specific preferences for currency, units, language, and alerts.
 */
export interface UserSettingsTable {
  /** Unique settings identifier */
  id: Generated<string>
  /** User these settings belong to */
  userId: string

  // Currency settings
  /** ISO 4217 currency code (USD, EUR, NGN, etc.) */
  currencyCode: string
  /** Currency symbol ($ , €, ₦, etc.) */
  currencySymbol: string
  /** Number of decimals to display for currency */
  currencyDecimals: number
  /** Position of the currency symbol */
  currencySymbolPosition: 'before' | 'after'
  /** Character used for thousands separator */
  thousandSeparator: string
  /** Character used for decimal separator */
  decimalSeparator: string

  // Date/Time settings
  /** Date format preference */
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  /** Time format preference */
  timeFormat: '12h' | '24h'
  /** Day the week starts on (0=Sunday, 1=Monday) */
  firstDayOfWeek: number

  // Unit settings
  /** Unit for weight measurements */
  weightUnit: 'kg' | 'lbs'
  /** Unit for area measurements */
  areaUnit: 'sqm' | 'sqft'
  /** Unit for temperature measurements */
  temperatureUnit: 'celsius' | 'fahrenheit'

  // Preferences
  /** Default farm to load on login */
  defaultFarmId: string | null
  /** UI language code */
  language:
    | 'en'
    | 'ha'
    | 'yo'
    | 'ig'
    | 'fr'
    | 'pt'
    | 'sw'
    | 'es'
    | 'hi'
    | 'tr'
    | 'id'
    | 'bn'
    | 'th'
    | 'vi'
    | 'am'
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system'

  // Alerts
  /** Threshold percentage for low stock alerts */
  lowStockThresholdPercent: number
  /** Threshold percentage for mortality alerts */
  mortalityAlertPercent: number
  /** Minimum absolute quantity for mortality alerts */
  mortalityAlertQuantity: number
  /** Enabled/disabled status for specific notification types */
  notifications: {
    lowStock: boolean
    highMortality: boolean
    invoiceDue: boolean
    batchHarvest: boolean
    vaccinationDue?: boolean
    medicationExpiry?: boolean
    waterQualityAlert?: boolean
    weeklySummary?: boolean
    dailySales?: boolean
    batchPerformance?: boolean
    paymentReceived?: boolean
  }

  // Business
  /** Default payment term in days for new invoices */
  defaultPaymentTermsDays: number
  /** Starting month of the fiscal year (1-12) */
  fiscalYearStartMonth: number

  // Dashboard
  /** Visibility of dashboard cards */
  dashboardCards: {
    inventory: boolean
    revenue: boolean
    expenses: boolean
    profit: boolean
    mortality: boolean
    feed: boolean
  }

  // Onboarding state
  /** Whether the user has completed onboarding */
  onboardingCompleted: Generated<boolean>
  /** Current step in the onboarding process */
  onboardingStep: Generated<number>

  createdAt: Generated<Date>
  updatedAt: Generated<Date>
}
