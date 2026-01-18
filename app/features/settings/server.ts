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
import type { UserSettings } from './currency-presets'

/**
 * Zod schema for validating user settings
 */
/**
 * Zod schema for validating user settings.
 * Defines structure and constraints for preferences, alerts, and business configs.
 */
export const userSettingsSchema = z.object({
  // Preferences
  /** Default farm ID to load on login */
  defaultFarmId: z.string().nullable().optional(),
  /** User interface language code (ISO 639-1) */
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
  /** User interface theme preference */
  theme: z.enum(['light', 'dark', 'system']),

  // Alerts
  /** Threshold percentage for low stock alerts */
  lowStockThresholdPercent: z
    .number()
    .int()
    .min(1, 'validation.min')
    .max(100, 'validation.max'),
  /** Threshold percentage for mortality alerts */
  mortalityAlertPercent: z
    .number()
    .int()
    .min(1, 'validation.min')
    .max(100, 'validation.max'),
  /** Minimum absolute quantity for mortality alerts */
  mortalityAlertQuantity: z.number().int().min(1, 'validation.min'),
  /** Enabled/disabled status for specific notification types */
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
  /** Default payment term in days for new invoices */
  defaultPaymentTermsDays: z.number().int().min(0, 'validation.min'),
  /** Starting month of the fiscal year (1-12) */
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
export const getUserSettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { db } = await import('~/lib/db')
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

    const settings = await db
      .selectFrom('user_settings')
      .selectAll()
      .where('userId', '=', session.user.id)
      .executeTakeFirst()

    if (!settings) {
      return DEFAULT_SETTINGS
    }

    // Merge with defaults to ensure all fields exist
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
    } as UserSettings
  },
)

/**
 * Update the current user's settings. Performs an upsert operation.
 *
 * @param data - The new settings data (validated against userSettingsSchema)
 * @returns Promise resolving to a success indicator
 * @throws {Error} If update fails
 */
export const updateUserSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: Partial<z.infer<typeof userSettingsSchema>>) =>
    userSettingsSchema.partial().parse(data),
  )
  .handler(async ({ data }) => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    try {
      // Upsert: insert if not exists, update if exists
      await db
        .insertInto('user_settings')
        .values({
          userId: userId,
          ...DEFAULT_SETTINGS,
          ...data,
        })
        .onConflict((oc) =>
          oc.column('userId').doUpdateSet({
            ...data,
          }),
        )
        .execute()

      return { success: true }
    } catch (error) {
      console.error('Failed to update user settings:', error)
      throw new Error('errors.saveFailed')
    }
  })

/**
 * Reset user settings back to their default values.
 *
 * @returns Promise resolving to a success indicator
 * @throws {Error} If reset fails
 */
export const resetUserSettings = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { db } = await import('~/lib/db')
    const { requireAuth } = await import('../auth/server-middleware')

    const session = await requireAuth()
    const userId = session.user.id

    try {
      // Delete existing settings - they'll be recreated with defaults on next fetch
      await db
        .deleteFrom('user_settings')
        .where('userId', '=', userId)
        .execute()

      return { success: true }
    } catch (error) {
      console.error('Failed to reset user settings:', error)
      throw new Error('errors.resetFailed')
    }
  },
)
