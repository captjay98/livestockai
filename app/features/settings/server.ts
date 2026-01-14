/**
 * Settings Server Functions
 *
 * Server-side functions for managing user settings.
 * All database operations use dynamic imports for Cloudflare Workers compatibility.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DEFAULT_SETTINGS } from './currency-presets'
import type { UserSettings } from './currency-presets'

/**
 * Zod schema for validating user settings
 */
const userSettingsSchema = z.object({
  // Currency
  currencyCode: z.string().min(1).max(3),
  currencySymbol: z.string().min(1).max(5),
  currencyDecimals: z.number().int().min(0).max(3),
  currencySymbolPosition: z.enum(['before', 'after']),
  thousandSeparator: z.string().max(1),
  decimalSeparator: z.string().min(1).max(1),

  // Date/Time
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  firstDayOfWeek: z.number().int().min(0).max(6),

  // Units
  weightUnit: z.enum(['kg', 'lbs']),
  areaUnit: z.enum(['sqm', 'sqft']),
  temperatureUnit: z.enum(['celsius', 'fahrenheit']),
})

/**
 * Get the current user's settings
 * Returns default settings if none exist
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
 * Update the current user's settings
 */
export const updateUserSettings = createServerFn({ method: 'POST' })
  .inputValidator((data: z.infer<typeof userSettingsSchema>) =>
    userSettingsSchema.parse(data),
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
      throw new Error('Failed to save settings')
    }
  })

/**
 * Reset user settings to defaults
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
      throw new Error('Failed to reset settings')
    }
  },
)
