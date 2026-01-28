/**
 * Database operations for task management.
 * All functions are pure data access - no business logic.
 */

import type { Kysely } from 'kysely'
import type { Database } from '~/lib/db/types'

/**
 * Data for inserting a new task
 */
export interface TaskInsert {
    farmId: string
    title: string
    description?: string | null
    frequency: 'daily' | 'weekly' | 'monthly'
    isDefault?: boolean
}

/**
 * Result from task query with completion data
 */
export interface TaskWithCompletionRow {
    id: string
    farmId: string
    title: string
    description: string | null
    frequency: string
    isDefault: boolean
    createdAt: Date
    completionId: string | null
    periodStart: Date | null
}

/**
 * Insert a new task into the database
 *
 * @param db - Kysely database instance
 * @param data - Task data to insert
 * @returns The ID of the created task
 */
export async function insertTask(
    db: Kysely<Database>,
    data: TaskInsert,
): Promise<string> {
    const result = await db
        .insertInto('tasks')
        .values({
            farmId: data.farmId,
            title: data.title,
            description: data.description || null,
            frequency: data.frequency,
            isDefault: data.isDefault ?? false,
        })
        .returning('id')
        .executeTakeFirstOrThrow()
    return result.id
}

/**
 * Get all tasks for a farm with completion records for a specific user
 *
 * @param db - Kysely database instance
 * @param userId - ID of the user
 * @param farmId - ID of the farm
 * @param frequency - Optional frequency filter
 */
export async function getTasksWithCompletions(
    db: Kysely<Database>,
    userId: string,
    farmId: string,
    frequency?: 'daily' | 'weekly' | 'monthly',
): Promise<Array<TaskWithCompletionRow>> {
    let query = db
        .selectFrom('tasks')
        .leftJoin('task_completions', (join) =>
            join
                .onRef('task_completions.taskId', '=', 'tasks.id')
                .on('task_completions.userId', '=', userId),
        )
        .where('tasks.farmId', '=', farmId)
        .select([
            'tasks.id',
            'tasks.farmId',
            'tasks.title',
            'tasks.description',
            'tasks.frequency',
            'tasks.isDefault',
            'tasks.createdAt',
            'task_completions.id as completionId',
            'task_completions.periodStart',
        ])
        .orderBy('tasks.title', 'asc')

    if (frequency) {
        query = query.where('tasks.frequency', '=', frequency)
    }

    const rows = await query.execute()
    return rows as Array<TaskWithCompletionRow>
}

/**
 * Get a single task by ID to determine its frequency
 */
export async function getTaskById(db: Kysely<Database>, taskId: string) {
    return await db
        .selectFrom('tasks')
        .where('id', '=', taskId)
        .select(['id', 'frequency', 'farmId'])
        .executeTakeFirst()
}

/**
 * Mark a task as complete if not already marked for that period
 */
export async function insertTaskCompletion(
    db: Kysely<Database>,
    taskId: string,
    userId: string,
    periodStart: Date,
): Promise<string> {
    const result = await db
        .insertInto('task_completions')
        .values({
            taskId,
            userId,
            periodStart,
        })
        .onConflict((oc) =>
            oc.columns(['taskId', 'userId', 'periodStart']).doNothing(),
        )
        .returning('id')
        .executeTakeFirst()

    if (!result) {
        const existing = await db
            .selectFrom('task_completions')
            .where('taskId', '=', taskId)
            .where('userId', '=', userId)
            .where('periodStart', '=', periodStart)
            .select('id')
            .executeTakeFirst()
        return existing?.id ?? ''
    }

    return result.id
}

/**
 * Delete a completion record (uncomplete)
 */
export async function deleteTaskCompletion(
    db: Kysely<Database>,
    taskId: string,
    userId: string,
    periodStart: Date,
): Promise<void> {
    await db
        .deleteFrom('task_completions')
        .where('taskId', '=', taskId)
        .where('userId', '=', userId)
        .where('periodStart', '=', periodStart)
        .execute()
}

/**
 * Delete a task (only if not a system default)
 */
export async function deleteTask(
    db: Kysely<Database>,
    taskId: string,
): Promise<void> {
    await db
        .deleteFrom('tasks')
        .where('id', '=', taskId)
        .where('isDefault', '=', false)
        .execute()
}
