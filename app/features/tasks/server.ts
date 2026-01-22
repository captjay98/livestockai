/**
 * Server functions and authenticated wrappers for task management.
 */

import { createServerFn } from '@tanstack/react-start'
import {
  deleteTaskCompletion,
  deleteTask as deleteTaskFromDb,
  getTaskById,
  getTasksWithCompletions,
  insertTask,
  insertTaskCompletion,
} from './repository'
import {
  DEFAULT_TASKS,
  calculateCompletionStatus,
  getPeriodStart,
  validateTaskData,
} from './service'
import type { CreateTaskInput, TaskWithStatus } from './service'
import { AppError } from '~/lib/errors'

export type { TaskWithStatus, CreateTaskInput }

/**
 * Get tasks for a specific farm with completion status for the current period.
 */
export async function getTasks(
  userId: string,
  farmId: string,
  frequency?: 'daily' | 'weekly' | 'monthly',
): Promise<Array<TaskWithStatus>> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    const rows = await getTasksWithCompletions(db, userId, farmId, frequency)
    return calculateCompletionStatus(rows, new Date())
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to fetch tasks',
      cause: error,
    })
  }
}

/**
 * Server function to get tasks.
 */
export const getTasksFn = createServerFn({ method: 'GET' })
  .inputValidator(
    (data: { farmId: string; frequency?: 'daily' | 'weekly' | 'monthly' }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return getTasks(session.user.id, data.farmId, data.frequency)
  })

/**
 * Mark a task as complete.
 */
export async function completeTask(
  userId: string,
  taskId: string,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const task = await getTaskById(db, taskId)
    if (!task) {
      throw new AppError('NOT_FOUND', { message: 'Task not found' })
    }

    const hasAccess = await checkFarmAccess(userId, task.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: task.farmId } })
    }

    const periodStart = getPeriodStart(new Date(), task.frequency)
    return await insertTaskCompletion(db, taskId, userId, periodStart)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to complete task',
      cause: error,
    })
  }
}

/**
 * Server function to complete a task.
 */
export const completeTaskFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return completeTask(session.user.id, data.taskId)
  })

/**
 * Mark a task as incomplete.
 */
export async function uncompleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const task = await getTaskById(db, taskId)
    if (!task) {
      throw new AppError('NOT_FOUND', { message: 'Task not found' })
    }

    const hasAccess = await checkFarmAccess(userId, task.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: task.farmId } })
    }

    const periodStart = getPeriodStart(new Date(), task.frequency)
    await deleteTaskCompletion(db, taskId, userId, periodStart)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to uncomplete task',
      cause: error,
    })
  }
}

/**
 * Server function to uncomplete a task.
 */
export const uncompleteTaskFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return uncompleteTask(session.user.id, data.taskId)
  })

/**
 * Create a new custom task for a farm.
 */
export async function createTask(
  userId: string,
  farmId: string,
  input: CreateTaskInput,
): Promise<string> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const hasAccess = await checkFarmAccess(userId, farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId } })
    }

    const validationError = validateTaskData(input)
    if (validationError) {
      throw new AppError('VALIDATION_ERROR', { message: validationError })
    }

    return await insertTask(db, {
      farmId,
      ...input,
      isDefault: false,
    })
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to create task',
      cause: error,
    })
  }
}

/**
 * Server function to create a task.
 */
export const createTaskFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { farmId: string; data: CreateTaskInput }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return createTask(session.user.id, data.farmId, data.data)
  })

/**
 * Delete a custom task.
 */
export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<void> {
  const { db } = await import('~/lib/db')
  const { checkFarmAccess } = await import('../auth/utils')

  try {
    const task = await getTaskById(db, taskId)
    if (!task) return

    const hasAccess = await checkFarmAccess(userId, task.farmId)
    if (!hasAccess) {
      throw new AppError('ACCESS_DENIED', { metadata: { farmId: task.farmId } })
    }

    await deleteTaskFromDb(db, taskId)
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to delete task',
      cause: error,
    })
  }
}

/**
 * Server function to delete a task.
 */
export const deleteTaskFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { taskId: string }) => data)
  .handler(async ({ data }) => {
    const { requireAuth } = await import('~/features/auth/server-middleware')
    const session = await requireAuth()
    return deleteTask(session.user.id, data.taskId)
  })

/**
 * Seed default tasks for a farm.
 */
export async function seedDefaultTasks(farmId: string): Promise<void> {
  const { db } = await import('~/lib/db')

  try {
    for (const task of DEFAULT_TASKS) {
      await insertTask(db, {
        farmId,
        ...task,
        isDefault: true,
      })
    }
  } catch (error) {
    throw new AppError('DATABASE_ERROR', {
      message: 'Failed to seed default tasks',
      cause: error,
    })
  }
}
