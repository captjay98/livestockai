/**
 * Onboarding Server Functions
 *
 * Server-side functions for onboarding state management.
 */

import { createServerFn } from '@tanstack/react-start'
import { DEFAULT_PROGRESS } from './types'
import type { OnboardingProgress } from './types'

/**
 * Get onboarding progress for the current user
 */
export const getOnboardingProgressFn = createServerFn({
  method: 'GET',
}).handler(async () => {
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
})

/**
 * Save onboarding progress
 */
export const saveOnboardingProgressFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { progress: OnboardingProgress }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()

    // For now, progress is stored client-side in localStorage
    // In a full implementation, we'd store this in a user_settings table
    return { success: true, progress: data.progress }
  })

/**
 * Mark onboarding as complete
 */
export const completeOnboardingFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    await requireAuth()

    return { success: true, completedAt: new Date().toISOString() }
  },
)

/**
 * Check if user needs onboarding (lightweight check)
 */
export const checkNeedsOnboardingFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { requireAuth } = await import('../auth/server-middleware')
    const session = await requireAuth()
    const { db } = await import('~/lib/db')

    // Check if user has any farms
    const userFarm = await db
      .selectFrom('user_farms')
      .select(['farmId'])
      .where('userId', '=', session.user.id)
      .executeTakeFirst()

    return {
      needsOnboarding: !userFarm,
      hasFarms: !!userFarm,
    }
  },
)
