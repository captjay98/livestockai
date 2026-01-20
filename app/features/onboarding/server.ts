/**
 * Onboarding Server Functions
 *
 * Server-side functions for onboarding state management.
 */

import { createServerFn } from '@tanstack/react-start'
import { DEFAULT_PROGRESS } from './types'
import type { OnboardingProgress } from './types'
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
}).handler(async () => {
  try {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { db } = await import('~/lib/db')

    // Check if user has any farms
    const userFarms = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', session.user.id)
      .execute()

    const hasFarms = userFarms.length > 0

    // Get stored progress from user_settings (if we have that table)
    // For now, we'll use a simple approach - check if user has farms
    // If they have farms, they've completed onboarding or were added by admin

    // Check user's createdAt to determine if they're new
    const user = await db
      .selectFrom('users')
      .select(['createdAt'])
      .where('id', '=', session.user.id)
      .executeTakeFirst()

    // If user has farms, they either completed onboarding or were added by admin
    if (hasFarms) {
      return {
        needsOnboarding: false,
        isAdminAdded: true, // Assume admin-added if they have farms
        progress: {
          ...DEFAULT_PROGRESS,
          currentStep: 'complete' as const,
          completedSteps: [
            'welcome',
            'create-farm',
            'enable-modules',
            'create-structure',
            'create-batch',
            'preferences',
            'tour',
            'complete',
          ] as const,
          completedAt: user?.createdAt.toISOString(),
        },
        farmId: userFarms[0]?.farmId,
      }
    }

    // New user without farms - needs full onboarding
    return {
      needsOnboarding: true,
      isAdminAdded: false,
      progress: DEFAULT_PROGRESS,
      farmId: null,
    }
  } catch (error) {
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
  .inputValidator((data: { progress: OnboardingProgress }) => data)
  .handler(async ({ data }) => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      await requireAuth()

      // For now, progress is stored client-side in localStorage
      // In a full implementation, we'd store this in a user_settings table
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
export const completeOnboardingFn = createServerFn({ method: 'POST' }).handler(
  async () => {
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
  },
)

/**
 * Evaluates whether a user requires the onboarding walkthrough.
 * Checks both explicit completion flags and heuristic (presence of farms).
 *
 * @returns A promise resolving to the needsOnboarding flag and farm presence.
 */
export const checkNeedsOnboardingFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { db } = await import('~/lib/db')

      // Check user_settings for onboardingCompleted flag
      const userSettings = await db
        .selectFrom('user_settings')
        .select(['onboardingCompleted'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      // If settings exist and onboarding completed, don't need onboarding
      if (userSettings?.onboardingCompleted) {
        return { needsOnboarding: false, hasFarms: true }
      }

      // Check if user has any farms (fallback for users without settings)
      const userFarm = await db
        .selectFrom('user_farms')
        .select(['farmId'])
        .where('userId', '=', session.user.id)
        .executeTakeFirst()

      return {
        needsOnboarding: !userFarm,
        hasFarms: !!userFarm,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError('INTERNAL_ERROR', {
        message: 'Failed to check onboarding status',
        cause: error,
      })
    }
  },
)

/**
 * Mark onboarding as complete in the database.
 * Updates or creates the user's settings.
 *
 * @returns A promise resolving to a success indicator.
 */
export const markOnboardingCompleteFn = createServerFn({
  method: 'POST',
}).handler(async () => {
  try {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { db } = await import('~/lib/db')

    // Check if user_settings exists
    const existing = await db
      .selectFrom('user_settings')
      .select(['id'])
      .where('userId', '=', session.user.id)
      .executeTakeFirst()

    if (existing) {
      await db
        .updateTable('user_settings')
        .set({ onboardingCompleted: true })
        .where('userId', '=', session.user.id)
        .execute()
    } else {
      // Create settings with onboardingCompleted = true
      await db
        .insertInto('user_settings')
        .values({
          userId: session.user.id,
          onboardingCompleted: true,
          onboardingStep: 8,
          ...DEFAULT_SETTINGS,
        })
        .execute()
    }

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
export const resetOnboardingFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    try {
      const { requireAuth } = await import('../auth/server-middleware')
      const session = await requireAuth()
      const { db } = await import('~/lib/db')

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
  },
)
