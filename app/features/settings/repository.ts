/**
 * Database operations for settings management.
 * All functions are pure data access - no business logic.
 */

import { DEFAULT_SETTINGS } from './currency-presets'
import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'
import type { UserSettings } from './currency-presets'

/**
 * Result from user settings query
 */
export type UserSettingsRow = {
  id: string
  userId: string
  currencyCode: string
  currencySymbol: string
  currencyDecimals: number
  currencySymbolPosition: 'before' | 'after'
  thousandSeparator: string
  decimalSeparator: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  firstDayOfWeek: number
  weightUnit: 'kg' | 'lbs'
  areaUnit: 'sqm' | 'sqft'
  temperatureUnit: 'celsius' | 'fahrenheit'
  defaultFarmId: string | null
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
  theme: 'light' | 'dark' | 'system'
  lowStockThresholdPercent: number
  mortalityAlertPercent: number
  mortalityAlertQuantity: number
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
  defaultPaymentTermsDays: number
  fiscalYearStartMonth: number
  dashboardCards: {
    inventory: boolean
    revenue: boolean
    expenses: boolean
    profit: boolean
    mortality: boolean
    feed: boolean
  }
  onboardingCompleted: boolean
  onboardingStep: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Data for upserting user settings
 */
export type UserSettingsInsert = Omit<
  UserSettingsRow,
  'id' | 'createdAt' | 'updatedAt'
> & {
  userId: string
  onboardingCompleted: boolean
  onboardingStep: number
}

/**
 * Data for updating user settings (all fields optional)
 */
export type UserSettingsUpdate = Partial<
  Omit<
    UserSettingsRow,
    | 'id'
    | 'userId'
    | 'createdAt'
    | 'updatedAt'
    | 'onboardingCompleted'
    | 'onboardingStep'
  >
>

/**
 * Get user settings by user ID
 *
 * @param db - Kysely database instance
 * @param userId - User ID to fetch settings for
 * @returns User settings or null if not found
 */
export async function getUserSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<UserSettingsRow | null> {
  const settings = await db
    .selectFrom('user_settings')
    .selectAll()
    .where('userId', '=', userId)
    .executeTakeFirst()

  return (settings as UserSettingsRow | null) ?? null
}

/**
 * Get a single setting value by key
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param key - Setting key (column name)
 * @returns Setting value or null if not found
 */
export async function getSetting(
  db: Kysely<Database>,
  userId: string,
  key: keyof UserSettingsRow,
): Promise<unknown | null> {
  const setting = await db
    .selectFrom('user_settings')
    .select(key)
    .where('userId', '=', userId)
    .executeTakeFirst()

  return setting?.[key] ?? null
}

/**
 * Upsert user settings
 * Creates new settings if they don't exist, updates if they do
 *
 * @param db - Kysely database instance
 * @param _userId - User ID (included in data)
 * @param data - Settings data to insert/update
 * @returns void
 */
export async function upsertUserSettings(
  db: Kysely<Database>,
  _userId: string,
  data: UserSettingsInsert,
): Promise<void> {
  await db
    .insertInto('user_settings')
    .values(data as any)
    .onConflict((oc) =>
      oc.column('userId').doUpdateSet({
        ...data,
        updatedAt: new Date(),
      } as any),
    )
    .execute()
}

/**
 * Update specific user settings fields
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param data - Settings fields to update
 * @returns void
 */
export async function updateUserSettings(
  db: Kysely<Database>,
  userId: string,
  data: UserSettingsUpdate,
): Promise<void> {
  await db
    .updateTable('user_settings')
    .set({ ...data, updatedAt: new Date() } as any)
    .where('userId', '=', userId)
    .execute()
}

/**
 * Delete user settings
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns void
 */
export async function deleteUserSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<void> {
  await db.deleteFrom('user_settings').where('userId', '=', userId).execute()
}

/**
 * Set a single setting value
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param key - Setting key (column name)
 * @param value - Setting value
 * @returns void
 */
export async function setSetting(
  db: Kysely<Database>,
  userId: string,
  key: keyof UserSettingsRow,
  value: unknown,
): Promise<void> {
  await db
    .updateTable('user_settings')
    .set({ [key]: value, updatedAt: new Date() } as any)
    .where('userId', '=', userId)
    .execute()
}

/**
 * Delete a single setting (reset to default)
 * Note: This is not a common operation as settings have required fields
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param key - Setting key to reset
 * @returns void
 */
export async function deleteSetting(
  db: Kysely<Database>,
  userId: string,
  key: keyof UserSettingsRow,
): Promise<void> {
  // Get the default value for this setting
  const defaultValue = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS]

  await db
    .updateTable('user_settings')
    .set({ [key]: defaultValue, updatedAt: new Date() } as any)
    .where('userId', '=', userId)
    .execute()
}

/**
 * Get all user settings (raw database row)
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Array of user settings (will have 0 or 1 elements)
 */
export async function getAllUserSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<Array<UserSettingsRow>> {
  const settings = await db
    .selectFrom('user_settings')
    .selectAll()
    .where('userId', '=', userId)
    .execute()

  return settings as Array<UserSettingsRow>
}

/**
 * Check if user has settings
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns True if settings exist for user
 */
export async function hasUserSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<boolean> {
  const result = await db
    .selectFrom('user_settings')
    .select('id')
    .where('userId', '=', userId)
    .executeTakeFirst()

  return result !== undefined
}

/**
 * Get onboarding status for user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Object with onboarding status
 */
export async function getOnboardingStatus(
  db: Kysely<Database>,
  userId: string,
): Promise<{ completed: boolean; step: number } | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return {
    completed: settings.onboardingCompleted,
    step: settings.onboardingStep,
  }
}

/**
 * Update onboarding status
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param completed - Whether onboarding is completed
 * @param step - Current onboarding step
 * @returns void
 */
export async function updateOnboardingStatus(
  db: Kysely<Database>,
  userId: string,
  completed: boolean,
  step: number,
): Promise<void> {
  await db
    .updateTable('user_settings')
    .set({
      onboardingCompleted: completed,
      onboardingStep: step,
      updatedAt: new Date(),
    })
    .where('userId', '=', userId)
    .execute()
}

/**
 * Get currency settings for a user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Currency settings
 */
export async function getCurrencySettings(
  db: Kysely<Database>,
  userId: string,
): Promise<{
  code: string
  symbol: string
  decimals: number
  position: 'before' | 'after'
  thousandSeparator: string
  decimalSeparator: string
} | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return {
    code: settings.currencyCode,
    symbol: settings.currencySymbol,
    decimals: settings.currencyDecimals,
    position: settings.currencySymbolPosition,
    thousandSeparator: settings.thousandSeparator,
    decimalSeparator: settings.decimalSeparator,
  }
}

/**
 * Get notification settings for a user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Notification settings
 */
export async function getNotificationSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<UserSettings['notifications'] | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return settings.notifications as UserSettings['notifications']
}

/**
 * Update notification settings
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param notifications - Notification settings to update
 * @returns void
 */
export async function updateNotificationSettings(
  db: Kysely<Database>,
  userId: string,
  notifications: Partial<UserSettings['notifications']>,
): Promise<void> {
  // First get existing settings to merge
  const existing = await getUserSettings(db, userId)

  if (!existing) {
    // If no settings exist, create with defaults merged with updates
    const mergedNotifications = {
      ...DEFAULT_SETTINGS.notifications,
      ...notifications,
    }

    const insertData: UserSettingsInsert = {
      userId,
      ...DEFAULT_SETTINGS,
      notifications: mergedNotifications as any,
      dashboardCards: DEFAULT_SETTINGS.dashboardCards,
      onboardingCompleted: false,
      onboardingStep: 0,
    }

    await upsertUserSettings(db, userId, insertData)
    return
  }

  // Merge with existing notifications
  const mergedNotifications = {
    ...DEFAULT_SETTINGS.notifications,
    ...(existing.notifications as UserSettings['notifications']),
    ...notifications,
  }

  await setSetting(db, userId, 'notifications', mergedNotifications as any)
}

/**
 * Get dashboard card settings for a user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Dashboard card settings
 */
export async function getDashboardCardSettings(
  db: Kysely<Database>,
  userId: string,
): Promise<UserSettings['dashboardCards'] | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return settings.dashboardCards as UserSettings['dashboardCards']
}

/**
 * Update dashboard card settings
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param dashboardCards - Dashboard card settings to update
 * @returns void
 */
export async function updateDashboardCardSettings(
  db: Kysely<Database>,
  userId: string,
  dashboardCards: Partial<UserSettings['dashboardCards']>,
): Promise<void> {
  // First get existing settings to merge
  const existing = await getUserSettings(db, userId)

  if (!existing) {
    // If no settings exist, create with defaults merged with updates
    const mergedCards = {
      ...DEFAULT_SETTINGS.dashboardCards,
      ...dashboardCards,
    }

    const insertData: UserSettingsInsert = {
      userId,
      ...DEFAULT_SETTINGS,
      notifications: DEFAULT_SETTINGS.notifications,
      dashboardCards: mergedCards as any,
      onboardingCompleted: false,
      onboardingStep: 0,
    }

    await upsertUserSettings(db, userId, insertData)
    return
  }

  // Merge with existing dashboard cards
  const mergedCards = {
    ...DEFAULT_SETTINGS.dashboardCards,
    ...(existing.dashboardCards as UserSettings['dashboardCards']),
    ...dashboardCards,
  }

  await setSetting(db, userId, 'dashboardCards', mergedCards as any)
}

/**
 * Get default farm ID for user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Default farm ID or null
 */
export async function getDefaultFarmId(
  db: Kysely<Database>,
  userId: string,
): Promise<string | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return settings.defaultFarmId
}

/**
 * Set default farm ID for user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param farmId - Farm ID to set as default
 * @returns void
 */
export async function setDefaultFarmId(
  db: Kysely<Database>,
  userId: string,
  farmId: string | null,
): Promise<void> {
  await setSetting(db, userId, 'defaultFarmId', farmId)
}

/**
 * Get alert thresholds for user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @returns Alert thresholds
 */
export async function getAlertThresholds(
  db: Kysely<Database>,
  userId: string,
): Promise<{
  lowStockThresholdPercent: number
  mortalityAlertPercent: number
  mortalityAlertQuantity: number
} | null> {
  const settings = await getUserSettings(db, userId)

  if (!settings) {
    return null
  }

  return {
    lowStockThresholdPercent: settings.lowStockThresholdPercent,
    mortalityAlertPercent: settings.mortalityAlertPercent,
    mortalityAlertQuantity: settings.mortalityAlertQuantity,
  }
}

/**
 * Update alert thresholds for user
 *
 * @param db - Kysely database instance
 * @param userId - User ID
 * @param lowStockThresholdPercent - Low stock threshold
 * @param mortalityAlertPercent - Mortality alert threshold
 * @param mortalityAlertQuantity - Mortality alert quantity
 * @returns void
 */
export async function updateAlertThresholds(
  db: Kysely<Database>,
  userId: string,
  lowStockThresholdPercent?: number,
  mortalityAlertPercent?: number,
  mortalityAlertQuantity?: number,
): Promise<void> {
  const updates: Partial<UserSettingsRow> = {}

  if (lowStockThresholdPercent !== undefined) {
    updates.lowStockThresholdPercent = lowStockThresholdPercent
  }

  if (mortalityAlertPercent !== undefined) {
    updates.mortalityAlertPercent = mortalityAlertPercent
  }

  if (mortalityAlertQuantity !== undefined) {
    updates.mortalityAlertQuantity = mortalityAlertQuantity
  }

  if (Object.keys(updates).length > 0) {
    await updateUserSettings(db, userId, updates)
  }
}
