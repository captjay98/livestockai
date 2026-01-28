import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

import {
    completeTaskFn,
    createTaskFn,
    deleteTaskFn,
    uncompleteTaskFn,
} from './server'
import type { CreateTaskInput } from './service'
import type {
    OptimisticContext,
    OptimisticRecord,
} from '~/lib/optimistic-utils'
import {
    addOptimisticRecord,
    cancelQueries,
    createOptimisticContext,
    createRollback,
    generateEntityTempId,
    getQueryData,
    removeById,
    replaceTempIdWithRecord,
    setQueryData,
    updateById,
} from '~/lib/optimistic-utils'
import { tempIdResolver } from '~/lib/temp-id-resolver'

/**
 * Task record type for cache operations.
 */
export interface TaskCacheRecord extends OptimisticRecord {
    id: string
    farmId: string
    title: string
    description?: string | null
    frequency: 'daily' | 'weekly' | 'monthly'
    isDefault: boolean
    isCompleted: boolean
    completedAt?: Date | null
    completedBy?: string | null
}

/**
 * Query key constants for task-related queries
 */
export const TASK_QUERY_KEYS = {
    all: ['tasks'] as const,
    lists: () => [...TASK_QUERY_KEYS.all, 'list'] as const,
    list: (farmId?: string, frequency?: string) =>
        [...TASK_QUERY_KEYS.lists(), farmId, frequency] as const,
    details: () => [...TASK_QUERY_KEYS.all, 'detail'] as const,
    detail: (id: string) => [...TASK_QUERY_KEYS.details(), id] as const,
} as const

/**
 * Input type for creating a task mutation
 */
export interface CreateTaskMutationInput {
    farmId: string
    task: CreateTaskInput
}

/**
 * Input type for completing a task mutation
 */
export interface CompleteTaskMutationInput {
    taskId: string
}

/**
 * Input type for uncompleting a task mutation
 */
export interface UncompleteTaskMutationInput {
    taskId: string
}

/**
 * Input type for deleting a task mutation
 */
export interface DeleteTaskMutationInput {
    taskId: string
}

/**
 * Result type for the useTaskMutations hook
 */
export interface UseTaskMutationsResult {
    createTask: ReturnType<
        typeof useMutation<
            string,
            Error,
            CreateTaskMutationInput,
            OptimisticContext<Array<TaskCacheRecord>>
        >
    >
    completeTask: ReturnType<
        typeof useMutation<
            string,
            Error,
            CompleteTaskMutationInput,
            OptimisticContext<Array<TaskCacheRecord>>
        >
    >
    uncompleteTask: ReturnType<
        typeof useMutation<
            void,
            Error,
            UncompleteTaskMutationInput,
            OptimisticContext<Array<TaskCacheRecord>>
        >
    >
    deleteTask: ReturnType<
        typeof useMutation<
            void,
            Error,
            DeleteTaskMutationInput,
            OptimisticContext<Array<TaskCacheRecord>>
        >
    >
    isPending: boolean
}

/**
 * Hook for task mutations with optimistic updates.
 *
 * @returns Object containing mutation functions and pending state
 *
 * **Validates: Requirements 7.5**
 */
export function useTaskMutations(): UseTaskMutationsResult {
    const queryClient = useQueryClient()
    const { t } = useTranslation(['tasks', 'common'])

    const rollbackTasks = createRollback<Array<TaskCacheRecord>>(
        queryClient,
        TASK_QUERY_KEYS.all,
    )

    const createTask = useMutation<
        string,
        Error,
        CreateTaskMutationInput,
        OptimisticContext<Array<TaskCacheRecord>>
    >({
        mutationFn: async ({ farmId, task }) => {
            return createTaskFn({ data: { farmId, data: task } })
        },

        onMutate: async ({ farmId, task }) => {
            await cancelQueries(queryClient, TASK_QUERY_KEYS.all)

            const previousTasks = getQueryData<Array<TaskCacheRecord>>(
                queryClient,
                TASK_QUERY_KEYS.all,
            )
            const tempId = generateEntityTempId('task')

            const optimisticTask: Omit<TaskCacheRecord, 'id'> = {
                farmId,
                title: task.title,
                description: task.description || null,
                frequency: task.frequency,
                isDefault: false,
                isCompleted: false,
                completedAt: null,
                completedBy: null,
            }

            const updatedTasks = addOptimisticRecord(
                previousTasks,
                optimisticTask,
                tempId,
            )
            setQueryData(queryClient, TASK_QUERY_KEYS.all, updatedTasks)

            return createOptimisticContext(previousTasks, tempId)
        },

        onError: (error, _variables, context) => {
            rollbackTasks(context)
            toast.error(
                t('messages.createError', {
                    defaultValue: 'Failed to create task',
                    ns: 'tasks',
                }),
                { description: error.message },
            )
        },

        onSuccess: async (serverId, { farmId, task }, context) => {
            if (context.tempId) {
                // Register the temp ID → server ID mapping for dependent mutations
                await tempIdResolver.register(context.tempId, serverId, 'task')

                // Update pending mutations that reference this temp ID
                tempIdResolver.updatePendingMutations(queryClient)

                const currentTasks = getQueryData<Array<TaskCacheRecord>>(
                    queryClient,
                    TASK_QUERY_KEYS.all,
                )

                const serverTask: TaskCacheRecord = {
                    id: serverId,
                    farmId,
                    title: task.title,
                    description: task.description || null,
                    frequency: task.frequency,
                    isDefault: false,
                    isCompleted: false,
                    completedAt: null,
                    completedBy: null,
                    _isOptimistic: false,
                    _tempId: undefined,
                }

                const updatedTasks = replaceTempIdWithRecord(
                    currentTasks,
                    context.tempId,
                    serverTask,
                )
                setQueryData(queryClient, TASK_QUERY_KEYS.all, updatedTasks)
            }

            toast.success(
                t('messages.created', {
                    defaultValue: 'Task created successfully',
                    ns: 'tasks',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
        },
    })

    const completeTask = useMutation<
        string,
        Error,
        CompleteTaskMutationInput,
        OptimisticContext<Array<TaskCacheRecord>>
    >({
        mutationFn: async ({ taskId }) => {
            return completeTaskFn({ data: { taskId } })
        },

        onMutate: async ({ taskId }) => {
            await cancelQueries(queryClient, TASK_QUERY_KEYS.all)

            const previousTasks = getQueryData<Array<TaskCacheRecord>>(
                queryClient,
                TASK_QUERY_KEYS.all,
            )

            const updatedTasks = updateById(previousTasks, taskId, {
                isCompleted: true,
                completedAt: new Date(),
            })
            setQueryData(queryClient, TASK_QUERY_KEYS.all, updatedTasks)

            return createOptimisticContext(previousTasks)
        },

        onError: (error, _variables, context) => {
            rollbackTasks(context)
            toast.error(
                t('messages.completeError', {
                    defaultValue: 'Failed to complete task',
                    ns: 'tasks',
                }),
                { description: error.message },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.completed', {
                    defaultValue: 'Task completed',
                    ns: 'tasks',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
        },
    })

    const uncompleteTask = useMutation<
        void,
        Error,
        UncompleteTaskMutationInput,
        OptimisticContext<Array<TaskCacheRecord>>
    >({
        mutationFn: async ({ taskId }) => {
            return uncompleteTaskFn({ data: { taskId } })
        },

        onMutate: async ({ taskId }) => {
            await cancelQueries(queryClient, TASK_QUERY_KEYS.all)

            const previousTasks = getQueryData<Array<TaskCacheRecord>>(
                queryClient,
                TASK_QUERY_KEYS.all,
            )

            const updatedTasks = updateById(previousTasks, taskId, {
                isCompleted: false,
                completedAt: null,
                completedBy: null,
            })
            setQueryData(queryClient, TASK_QUERY_KEYS.all, updatedTasks)

            return createOptimisticContext(previousTasks)
        },

        onError: (error, _variables, context) => {
            rollbackTasks(context)
            toast.error(
                t('messages.uncompleteError', {
                    defaultValue: 'Failed to uncomplete task',
                    ns: 'tasks',
                }),
                { description: error.message },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.uncompleted', {
                    defaultValue: 'Task marked as incomplete',
                    ns: 'tasks',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
        },
    })

    const deleteTask = useMutation<
        void,
        Error,
        DeleteTaskMutationInput,
        OptimisticContext<Array<TaskCacheRecord>>
    >({
        mutationFn: async ({ taskId }) => {
            await deleteTaskFn({ data: { taskId } })
        },

        onMutate: async ({ taskId }) => {
            await cancelQueries(queryClient, TASK_QUERY_KEYS.all)

            const previousTasks = getQueryData<Array<TaskCacheRecord>>(
                queryClient,
                TASK_QUERY_KEYS.all,
            )
            const updatedTasks = removeById(previousTasks, taskId)
            setQueryData(queryClient, TASK_QUERY_KEYS.all, updatedTasks)

            return createOptimisticContext(previousTasks)
        },

        onError: (error, _variables, context) => {
            rollbackTasks(context)
            toast.error(
                t('messages.deleteError', {
                    defaultValue: 'Failed to delete task',
                    ns: 'tasks',
                }),
                { description: error.message },
            )
        },

        onSuccess: () => {
            toast.success(
                t('messages.deleted', {
                    defaultValue: 'Task deleted successfully',
                    ns: 'tasks',
                }),
            )
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: TASK_QUERY_KEYS.all })
        },
    })

    return {
        createTask,
        completeTask,
        uncompleteTask,
        deleteTask,
        isPending:
            createTask.isPending ||
            completeTask.isPending ||
            uncompleteTask.isPending ||
            deleteTask.isPending,
    }
}
