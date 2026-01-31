/**
 * Onboarding Server Functions
 *
 * Server-side functions for onboarding state management.
 */

import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { DEFAULT_PROGRESS } from './types'
import { AppError } from '~/lib/errors'
import { DEFAULT_SETTINGS } from '~/features/settings/currency-presets'

/**
 * Get onboarding progress for the current user.
 * Checks if the user has farms (admin added) or stored progress.
 *
 * @returns A promise resolving to the onboarding status object.
 */
export const getOnboardingProgressFn = createServerFn({
  method: 'GET',
})
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { error: logError, debug: logDebug } = await import('~/lib/logger')

      logDebug(
        '[getOnboardingProgressFn] Checking progress for user:',
        session.user.id,
      )

      // Parallelize all initial queries for better performance
      const [user, userSettings, userFarms] = await Promise.all([
        // Check userType - buyers skip onboarding
        db
          .selectFrom('users')
          .select(['userType', 'createdAt'])
          .where('id', '=', session.user.id)
          .executeTakeFirst(),
        // Check user_settings for onboardingCompleted flag and step
        db
          .selectFrom('user_settings')
          .select(['onboardingCompleted', 'onboardingStep'])
          .where('userId', '=', session.user.id)
          .executeTakeFirst(),
        // Check if user has any farms (admin-added users)
        db
          .selectFrom('user_farms')
          .select(['farmId', 'role'])
          .where('userId', '=', session.user.id)
          .execute(),
      ])

      if (!user) {
        logError(
          '[getOnboardingProgressFn] User not found in database:',
          session.user.id,
        )
        return {
          needsOnboarding: true,
          isAdminAdded: false,
          progress: DEFAULT_PROGRESS,
          farmId: null,
        }
      }

      logDebug('[getOnboardingProgressFn] State:', {
        userId: session.user.id,
        userSettings: userSettings
          ? {
              onboardingStep: userSettings.onboardingStep,
              completed: userSettings.onboardingCompleted,
            }
          : 'null',
        farmCount: userFarms.length,
        isBuyer: user.userType === 'buyer',
      })

      const userCreatedAt =
        user.createdAt instanceof Date
          ? user.createdAt
          : new Date(user.createdAt)

      if (user.userType === 'buyer') {
        return {
          needsOnboarding: false,
          isAdminAdded: false,
          progress: {
            ...DEFAULT_PROGRESS,
            currentStep: 'complete' as const,
            completedSteps: ['complete'] as const,
            completedAt: userCreatedAt.toISOString(),
          },
          farmId: null,
        }
      }

      if (userSettings?.onboardingCompleted) {
        return {
          needsOnboarding: false,
          isAdminAdded: false,
          progress: {
            ...DEFAULT_PROGRESS,
            currentStep: 'complete' as const,
            completedSteps: ['complete'] as const,
            completedAt: userCreatedAt.toISOString(),
          },
          farmId: userFarms[0]?.farmId || null,
        }
      }

      // Check for partial progress
      if (userSettings && typeof userSettings.onboardingStep === 'number') {
        const { ONBOARDING_STEPS } = await import('./types')
        const currentStepIndex = userSettings.onboardingStep
        const currentStep = ONBOARDING_STEPS[currentStepIndex] || 'welcome'
        const completedSteps = ONBOARDING_STEPS.slice(0, currentStepIndex)

        // If step is 'complete', onboarding is done
        if (currentStep === 'complete') {
          return {
            needsOnboarding: false,
            isAdminAdded: false,
            progress: {
              ...DEFAULT_PROGRESS,
              currentStep: 'complete',
              completedSteps: [...completedSteps, 'complete'],
              farmId: userFarms[0]?.farmId,
              completedAt: new Date().toISOString(),
            },
            farmId: userFarms[0]?.farmId || null,
          }
        }

        return {
          needsOnboarding: true,
          isAdminAdded: userFarms.length > 0,
          progress: {
            ...DEFAULT_PROGRESS,
            currentStep,
            completedSteps,
            farmId: userFarms[0]?.farmId,
          },
          farmId: userFarms[0]?.farmId || null,
        }
      }

      // Only skip onboarding if they have a farm AND they are NOT the owner (invited execution)
      const hasFarmAndNotOwner =
        userFarms.length > 0 && userFarms.some((f) => f.role !== 'owner')

      if (hasFarmAndNotOwner) {
        // User has farms but onboarding not marked complete - admin-added
        return {
          needsOnboarding: false,
          isAdminAdded: true,
          progress: {
            ...DEFAULT_PROGRESS,
            currentStep: 'complete' as const,
            completedSteps: [
              'welcome',
              'create-farm',
              'create-structure',
              'create-batch',
              'preferences',
              'tour',
              'complete',
            ] as const,
            completedAt: userCreatedAt.toISOString(),
          },
          farmId: userFarms[0]?.farmId,
        }
      }

      // New user without farms (or owner who hasn't saved progress) - needs full onboarding
      return {
        needsOnboarding: true,
        isAdminAdded: false,
        progress: DEFAULT_PROGRESS,
        farmId: userFarms[0]?.farmId || null, // If they have a farm (owner) but no settings, pass ID so they can resume context
      }
    } catch (error) {
      const { error: logError } = await import('~/lib/logger')
      logError('[getOnboardingProgressFn] Unhandled error:', error)
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to retrieve onboarding progress',
        cause: error,
      })
    }
  })

/**
 * Save onboarding progress.
 * Currently returns the data back as it's primarily client-managed.
 *
 * @param data.progress - The current progress object.
 * @returns A promise resolving to the success state and saving progress.
 */
export const saveOnboardingProgressFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      progress: z.object({
        currentStep: z.enum([
          'welcome',
          'create-farm',
          'create-structure',
          'create-batch',
          'preferences',
          'tour',
          'complete',
        ]),
        completedSteps: z.array(
          z.enum([
            'welcome',
            'create-farm',
            'create-structure',
            'create-batch',
            'preferences',
            'tour',
            'complete',
          ]),
        ),
        farmId: z.string().uuid().optional(),
        structureId: z.string().uuid().optional(),
        batchId: z.string().uuid().optional(),
        enabledModules: z.array(z.string()).optional(),
        skipped: z.boolean(),
        completedAt: z.string().optional(),
      }),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      // Calculate numeric step index
      const { ONBOARDING_STEPS } = await import('./types')
      const stepIndex = ONBOARDING_STEPS.indexOf(data.progress.currentStep)
      const numericStep = stepIndex === -1 ? 0 : stepIndex

      // Check if settings exist, then update or insert
      const existing = await db
        .selectFrom('user_settings')
        .select(['id'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      if (existing) {
        await db
          .updateTable('user_settings')
          .set({ onboardingStep: numericStep })
          .where('userId', '=', session.user.id)
          .execute()
      } else {
        await db
          .insertInto('user_settings')
          .values({
            userId: session.user.id,
            onboardingStep: numericStep,
            // Default settings required for new row
            currencyCode: 'USD',
            currencySymbol: '$',
            currencyDecimals: 2,
            currencySymbolPosition: 'before',
            thousandSeparator: ',',
            decimalSeparator: '.',
            dateFormat: 'MM/DD/YYYY',
            timeFormat: '12h',
            firstDayOfWeek: 0,
            weightUnit: 'kg',
            areaUnit: 'sqm',
            temperatureUnit: 'celsius',
            language: 'en',
            theme: 'system',
            lowStockThresholdPercent: 10,
            mortalityAlertPercent: 5,
            mortalityAlertQuantity: 10,
            notifications: {
              lowStock: true,
              highMortality: true,
              invoiceDue: true,
              batchHarvest: true,
            },
            dashboardCards: {
              inventory: true,
              revenue: true,
              expenses: true,
              profit: true,
              mortality: true,
              feed: true,
            },
            defaultPaymentTermsDays: 30,
            fiscalYearStartMonth: 1,
            // Onboarding specific
            onboardingCompleted: false,
          })
          .execute()
      }

      return { success: true, progress: data.progress }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to save onboarding progress',
        cause: error,
      })
    }
  })

/**
 * Mark onboarding as complete.
 *
 * @returns A promise resolving to the success state and completion timestamp.
 */
export const completeOnboardingFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()

      return { success: true, completedAt: new Date().toISOString() }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to complete onboarding',
        cause: error,
      })
    }
  })

/**
 * Evaluates whether a user requires the onboarding walkthrough.
 * Checks both explicit completion flags and heuristic (presence of farms).
 * Buyers (userType='buyer') skip onboarding automatically.
 *
 * @returns A promise resolving to the needsOnboarding flag and farm presence.
 */
export const checkNeedsOnboardingFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { debug } = await import('~/lib/logger')
      const { ONBOARDING_STEPS } = await import('./types')

      await debug(
        '[checkNeedsOnboardingFn] Checking for user:',
        session.user.id,
      )

      // Get user with userType from users table (Better Auth additionalFields)
      const user = await db
        .selectFrom('users')
        .select(['userType'])
        .where('id', '=', session.user.id)
        .executeTakeFirst()

      await debug('[checkNeedsOnboardingFn] User type:', user?.userType)

      // Buyers skip onboarding (they don't need farms)
      if (user?.userType === 'buyer') {
        await debug('[checkNeedsOnboardingFn] Buyer - skipping onboarding')
        return { needsOnboarding: false, hasFarms: false }
      }

      // Check user_settings for onboardingCompleted flag
      const userSettings = await db
        .selectFrom('user_settings')
        .select(['onboardingCompleted', 'onboardingStep'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      await debug('[checkNeedsOnboardingFn] User settings:', {
        exists: !!userSettings,
        completed: userSettings?.onboardingCompleted,
        step: userSettings?.onboardingStep,
      })

      // If settings exist and onboarding completed, don't need onboarding
      if (userSettings?.onboardingCompleted) {
        await debug(
          '[checkNeedsOnboardingFn] Onboarding completed flag is true - no need',
        )
        return { needsOnboarding: false, hasFarms: true }
      }

      // Also check if onboardingStep is at 'complete' (step 6)
      // This handles the case where user reached complete step but flag wasn't set
      if (userSettings && typeof userSettings.onboardingStep === 'number') {
        const currentStep = ONBOARDING_STEPS[userSettings.onboardingStep]
        if (currentStep === 'complete') {
          await debug(
            '[checkNeedsOnboardingFn] Step is at complete - marking done and returning',
          )
          // Auto-fix: set the completed flag since they reached the end
          await db
            .updateTable('user_settings')
            .set({ onboardingCompleted: true })
            .where('userId', '=', session.user.id)
            .execute()
          return { needsOnboarding: false, hasFarms: true }
        }
      }

      // Check if user has any farms (fallback for users without settings)
      const userFarms = await db
        .selectFrom('user_farms')
        .select(['farmId', 'role'])
        .where('userId', '=', session.user.id)
        .execute()

      const ownsFarm = userFarms.some((f) => f.role === 'owner')
      const isInvited = userFarms.length > 0 && !ownsFarm

      await debug('[checkNeedsOnboardingFn] Farm status:', {
        farmCount: userFarms.length,
        ownsFarm,
        isInvited,
      })

      const result = {
        // If they own a farm, they need onboarding (unless completed, checked above).
        // If they are invited (no owned farms), they skip.
        // If no farms, they need onboarding.
        needsOnboarding: !isInvited,
        hasFarms: userFarms.length > 0,
      }

      await debug('[checkNeedsOnboardingFn] Result:', result)
      return result
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to check onboarding status',
        cause: error,
      })
    }
  })

/**
 * Mark onboarding as complete in the database.
 * Updates or creates the user's settings.
 *
 * @returns A promise resolving to a success indicator.
 */
export const markOnboardingCompleteFn = createServerFn({
  method: 'POST',
})
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { getDb } = await import('~/lib/db')
      const db = await getDb()
      const { ONBOARDING_STEPS } = await import('./types')
      const { debug } = await import('~/lib/logger')

      await debug(
        '[markOnboardingCompleteFn] Marking complete for user:',
        session.user.id,
      )

      // Get the index of 'complete' step (should be 6)
      const completeStepIndex = ONBOARDING_STEPS.indexOf('complete')

      // Check if user_settings exists
      const existing = await db
        .selectFrom('user_settings')
        .select(['id', 'onboardingCompleted', 'onboardingStep'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      await debug('[markOnboardingCompleteFn] Existing settings:', existing)

      if (existing) {
        await db
          .updateTable('user_settings')
          .set({
            onboardingCompleted: true,
            onboardingStep: completeStepIndex,
          })
          .where('userId', '=', session.user.id)
          .execute()
        await debug('[markOnboardingCompleteFn] Updated existing settings')
      } else {
        // Create settings with onboardingCompleted = true
        await db
          .insertInto('user_settings')
          .values({
            userId: session.user.id,
            onboardingCompleted: true,
            onboardingStep: completeStepIndex,
            ...DEFAULT_SETTINGS,
          })
          .execute()
        await debug('[markOnboardingCompleteFn] Created new settings')
      }

      // Verify the update
      const updated = await db
        .selectFrom('user_settings')
        .select(['onboardingCompleted', 'onboardingStep'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      await debug(
        '[markOnboardingCompleteFn] Verified settings after update:',
        updated,
      )

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to mark onboarding as complete',
        cause: error,
      })
    }
  })

/**
 * Reset onboarding state to allow user to restart the guide.
 *
 * @returns A promise resolving to a success indicator.
 */
export const resetOnboardingFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({}))
  .handler(async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { getDb } = await import('~/lib/db')
      const db = await getDb()

      await db
        .updateTable('user_settings')
        .set({ onboardingCompleted: false, onboardingStep: 0 })
        .where('userId', '=', session.user.id)
        .execute()

      return { success: true }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('DATABASE_ERROR', {
        message: 'Failed to reset onboarding',
        cause: error,
      })
    }
  })
