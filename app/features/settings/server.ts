/**
 * @module Settings
 *
 * User preferences and configuration management.
 * Handles currency, localization, theming, and notification settings.
 * All database operations use dynamic imports for Cloudflare Workers compatibility.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DEFAULT_SETTINGS } from './currency-presets'
import {
  formatCurrencyValue,
  mergeDashboardCardSettings,
  mergeNotificationSettings,
  validatePartialSettings,
} from './service'
import {
  deleteUserSettings as deleteUserSettingsFromDb,
  getAlertThresholds,
  getCurrencySettings,
  getDashboardCardSettings,
  getDefaultFarmId,
  getNotificationSettings,
  getOnboardingStatus,
  getUserSettings as getUserSettingsFromDb,
  setDefaultFarmId as setDefaultFarmIdInDb,
  updateAlertThresholds,
  updateDashboardCardSettings,
  updateNotificationSettings,
  updateOnboardingStatus,
} from './repository'
import type { UserSettings } from './currency-presets'
import { AppError } from '~/lib/errors'

/**
 * Zod schema for validating user settings
 */
export const userSettingsSchema = z.object({
  // Preferences
  defaultFarmId: z.string().nullable().optional(),

  // Regional - Currency
  currencyCode: z.string().optional(),
  currencySymbol: z.string().optional(),
  currencyDecimals: z.number().int().min(0).max(4).optional(),
  currencySymbolPosition: z.enum(['before', 'after']).optional(),
  thousandSeparator: z.string().optional(),
  decimalSeparator: z.string().optional(),

  // Regional - Date/Time
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
  firstDayOfWeek: z.number().int().min(0).max(6).optional(),

  // Regional - Units
  weightUnit: z.enum(['kg', 'lbs']).optional(),
  areaUnit: z.enum(['sqm', 'sqft']).optional(),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']).optional(),

  // Dashboard
  dashboardCards: z
    .object({
      inventory: z.boolean(),
      revenue: z.boolean(),
      expenses: z.boolean(),
      profit: z.boolean(),
      mortality: z.boolean(),
      feed: z.boolean(),
    })
    .optional(),
  language: z.enum([
    'en',
    'ha',
    'yo',
    'ig',
    'fr',
    'pt',
    'sw',
    'es',
    'hi',
    'tr',
    'id',
    'bn',
    'th',
    'vi',
    'am',
  ]),
  theme: z.enum(['light', 'dark', 'system']),

  // Alerts
  lowStockThresholdPercent: z
    .number()
    .int()
    .min(1, 'validation.min')
    .max(100, 'validation.max'),
  mortalityAlertPercent: z
    .number()
    .int()
    .min(1, 'validation.min')
    .max(100, 'validation.max'),
  mortalityAlertQuantity: z.number().int().min(1, 'validation.min'),
  notifications: z
    .object({
      lowStock: z.boolean().optional(),
      highMortality: z.boolean().optional(),
      invoiceDue: z.boolean().optional(),
      batchHarvest: z.boolean().optional(),
      vaccinationDue: z.boolean().optional(),
      medicationExpiry: z.boolean().optional(),
      waterQualityAlert: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
      dailySales: z.boolean().optional(),
      batchPerformance: z.boolean().optional(),
      paymentReceived: z.boolean().optional(),
    })
    .optional(),

  // Business
  defaultPaymentTermsDays: z.number().int().min(0, 'validation.min'),
  fiscalYearStartMonth: z
    .number()
    .int()
    .min(1, 'validation.min')
    .max(12, 'validation.max'),
})

/**
 * Get the current user's settings, including currency, units, and date preferences.
 * Returns default settings if none exist for the user.
 *
 * @returns Promise resolving to the user's settings object
 */
export const getUserSettings = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    let session
    try {
      session = await requireAuth()
      if (!session.user.id) {
        return DEFAULT_SETTINGS
      }
    } catch (error) {
      return DEFAULT_SETTINGS
    }

    const settings = await getUserSettingsFromDb(db, session.user.id)

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
    } as UserSettings
  })

/**
 * Update the current user's settings. Performs an upsert operation.
 *
 * @param data - The new settings data (validated against userSettingsSchema)
 * @returns Promise resolving to a success indicator
 * @throws {Error} If update fails
 */
export const updateUserSettings = createServerFn({ method: 'POST' })
  .inputValidator(userSettingsSchema.partial())
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    try {
      // Validate using service layer
      const validationErrors = validatePartialSettings(data as any)
      if (validationErrors.length > 0) {
        throw new AppError('VALIDATION_ERROR', {
          message: validationErrors.join(', '),
        })
      }

      // Fetch existing settings to merge nested objects properly
      const existingSettings = await getUserSettingsFromDb(db, userId)

      // Merge nested objects using service layer functions
      const baseNotifications = mergeNotificationSettings(
        DEFAULT_SETTINGS.notifications,
        existingSettings?.notifications as
          | UserSettings['notifications']
          | null
          | undefined,
        data.notifications as
          | Partial<UserSettings['notifications']>
          | undefined,
      )

      const baseDashboardCards = mergeDashboardCardSettings(
        DEFAULT_SETTINGS.dashboardCards,
        existingSettings?.dashboardCards as
          | UserSettings['dashboardCards']
          | null
          | undefined,
        data.dashboardCards as
          | Partial<UserSettings['dashboardCards']>
          | undefined,
      )

      // Build the final merged data for database
      const finalData = {
        ...data,
        // Only include notifications if provided in update
        ...(data.notifications ? { notifications: baseNotifications } : {}),
        ...(data.dashboardCards ? { dashboardCards: baseDashboardCards } : {}),
      }

      // Build insert values with ALL required fields from defaults
      const insertValues = {
        userId: userId,
        ...DEFAULT_SETTINGS,
        ...finalData,
        // Ensure notifications has all required fields for new records
        notifications: baseNotifications,
        dashboardCards: baseDashboardCards,
      }

      // For update, we only send the fields that were changed
      await db
        .insertInto('user_settings')
        .values(insertValues as any)
        .onConflict((oc) => oc.column('userId').doUpdateSet(finalData as any))
        .execute()

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      throw new AppError('DATABASE_ERROR', {
        message: 'errors.saveFailed',
        cause: error,
      })
    }
  })

/**
 * Reset user settings back to their default values.
 *
 * @returns Promise resolving to a success indicator
 * @throws {Error} If reset fails
 */
export const resetUserSettings = createServerFn({ method: 'POST' })
  .inputValidator(z.object({}))
  .handler(async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    try {
      // Delete existing settings - they'll be recreated with defaults on next fetch
      await deleteUserSettingsFromDb(db, userId)

      return { success: true }
    } catch (error) {
      throw new AppError('DATABASE_ERROR', {
        message: 'errors.resetFailed',
        cause: error,
      })
    }
  })

/**
 * Get the default farm ID for the current user
 *
 * @returns Promise resolving to the default farm ID or null
 */
export const getDefaultFarm = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    return await getDefaultFarmId(db, userId)
  })

/**
 * Set the default farm ID for the current user
 *
 * @param farmId - The farm ID to set as default
 * @returns Promise resolving to a success indicator
 */
export const setDefaultFarm = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ farmId: z.string().uuid().nullable() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    await setDefaultFarmIdInDb(db, userId, data.farmId)

    return { success: true }
  })

/**
 * Get onboarding status for the current user
 *
 * @returns Promise resolving to onboarding status
 */
export const getOnboarding = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const status = await getOnboardingStatus(db, userId)

    if (!status) {
      return { completed: false, step: 0 }
    }

    return status
  },
)

/**
 * Update onboarding status for the current user
 *
 * @param completed - Whether onboarding is completed
 * @param step - Current onboarding step
 * @returns Promise resolving to a success indicator
 */
export const updateOnboarding = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      completed: z.boolean().optional(),
      step: z.number().int().min(0).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const existing = await getOnboardingStatus(db, userId)

    const completed = data.completed ?? existing?.completed ?? false
    const step = data.step ?? existing?.step ?? 0

    await updateOnboardingStatus(db, userId, completed, step)

    return { success: true, completed, step }
  })

/**
 * Get currency settings for the current user
 *
 * @returns Promise resolving to currency settings
 */
export const getCurrency = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const settings = await getCurrencySettings(db, userId)

    if (!settings) {
      return {
        code: DEFAULT_SETTINGS.currencyCode,
        symbol: DEFAULT_SETTINGS.currencySymbol,
        decimals: DEFAULT_SETTINGS.currencyDecimals,
        position: DEFAULT_SETTINGS.currencySymbolPosition,
        thousandSeparator: DEFAULT_SETTINGS.thousandSeparator,
        decimalSeparator: DEFAULT_SETTINGS.decimalSeparator,
      }
    }

    return settings
  },
)

/**
 * Get notification settings for the current user
 *
 * @returns Promise resolving to notification settings
 */
export const getNotifications = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const settings = await getNotificationSettings(db, userId)

    if (!settings) {
      return DEFAULT_SETTINGS.notifications
    }

    return settings
  },
)

/**
 * Update notification settings for the current user
 *
 * @param notifications - Notification settings to update
 * @returns Promise resolving to a success indicator
 */
export const updateNotifications = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      lowStock: z.boolean().optional(),
      highMortality: z.boolean().optional(),
      invoiceDue: z.boolean().optional(),
      batchHarvest: z.boolean().optional(),
      vaccinationDue: z.boolean().optional(),
      medicationExpiry: z.boolean().optional(),
      waterQualityAlert: z.boolean().optional(),
      weeklySummary: z.boolean().optional(),
      dailySales: z.boolean().optional(),
      batchPerformance: z.boolean().optional(),
      paymentReceived: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    await updateNotificationSettings(db, userId, data)

    return { success: true }
  })

/**
 * Get dashboard card settings for the current user
 *
 * @returns Promise resolving to dashboard card settings
 */
export const getDashboardCards = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const settings = await getDashboardCardSettings(db, userId)

    if (!settings) {
      return DEFAULT_SETTINGS.dashboardCards
    }

    return settings
  },
)

/**
 * Update dashboard card settings for the current user
 *
 * @param dashboardCards - Dashboard card settings to update
 * @returns Promise resolving to a success indicator
 */
export const updateDashboardCards = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      inventory: z.boolean().optional(),
      revenue: z.boolean().optional(),
      expenses: z.boolean().optional(),
      profit: z.boolean().optional(),
      mortality: z.boolean().optional(),
      feed: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    await updateDashboardCardSettings(db, userId, data)

    return { success: true }
  })

/**
 * Get alert thresholds for the current user
 *
 * @returns Promise resolving to alert thresholds
 */
export const getAlertThresholdsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const thresholds = await getAlertThresholds(db, userId)

    if (!thresholds) {
      return {
        lowStockThresholdPercent: DEFAULT_SETTINGS.lowStockThresholdPercent,
        mortalityAlertPercent: DEFAULT_SETTINGS.mortalityAlertPercent,
        mortalityAlertQuantity: DEFAULT_SETTINGS.mortalityAlertQuantity,
      }
    }

    return thresholds
  },
)

/**
 * Update alert thresholds for the current user
 *
 * @param lowStockThresholdPercent - Low stock threshold
 * @param mortalityAlertPercent - Mortality alert threshold
 * @param mortalityAlertQuantity - Mortality alert quantity
 * @returns Promise resolving to a success indicator
 */
export const updateAlertThresholdsFn = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: {
      lowStockThresholdPercent?: number
      mortalityAlertPercent?: number
      mortalityAlertQuantity?: number
    }) =>
      z
        .object({
          lowStockThresholdPercent: z.number().int().min(1).max(100).optional(),
          mortalityAlertPercent: z.number().int().min(1).max(100).optional(),
          mortalityAlertQuantity: z.number().int().min(1).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    await updateAlertThresholds(
      db,
      userId,
      data.lowStockThresholdPercent,
      data.mortalityAlertPercent,
      data.mortalityAlertQuantity,
    )

    return { success: true }
  })

/**
 * Format a monetary amount using user's currency settings
 *
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrencyFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ amount: z.number() }))
  .handler(async ({ data }) => {
    const { getDb } = await import('~/lib/db'); const db = await getDb()
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    const currencySettings = await getCurrencySettings(db, userId)

    const currencyCode = currencySettings?.code ?? DEFAULT_SETTINGS.currencyCode

    return formatCurrencyValue(data.amount, currencyCode)
  })

/**
 * Get settings page data (for loader pattern)
 *
 * @returns Promise resolving to settings data
 */
export const getSettingsPageDataFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    return getUserSettings({ data: {} })
  })

/**
 * Export types for use in other modules
 */
export type { UserSettings }

// Re-export service functions for use in other modules
export {
  validateSettingData,
  formatCurrencyValue,
  parseSettingValue,
  validateCurrencyChange,
  buildSettingsSummary,
  shouldTriggerLowStockAlert,
  shouldTriggerMortalityAlert,
  formatSettingDate,
  formatSettingTime,
  formatSettingDateTime,
  formatCompactSettingCurrency,
  getCurrencyPresetByCode,
  convertWeight,
  convertArea,
  convertTemperature,
} from './service'
