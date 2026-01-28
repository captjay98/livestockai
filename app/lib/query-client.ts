import { QueryClient } from '@tanstack/react-query'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { del, get, set } from 'idb-keyval'
import type { Persister } from '@tanstack/react-query-persist-client'
import { AppError } from '~/lib/errors'

export const createPersister = (): Persister | undefined => {
    // Only create persister on client side
    if (typeof window === 'undefined') return undefined

    return createAsyncStoragePersister({
        storage: {
            getItem: async (key) => {
                try {
                    const value = await get(key)
                    return value ?? null
                } catch {
                    return null
                }
            },
            setItem: async (key, value) => {
                try {
                    await set(key, value)
                } catch {
                    // Ignore
                }
            },
            removeItem: async (key) => {
                try {
                    await del(key)
                } catch {
                    // Ignore
                }
            },
        },
    })
}

export const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                gcTime: 1000 * 60 * 60 * 24, // 24 hours
                staleTime: 1000 * 60, // 1 minute
                // Prevent retries on 404s/403s maybe?
                retry: (failureCount, error) => {
                    if (AppError.isAppError(error)) {
                        // Don't retry auth or forbidden errors
                        if (
                            error.category === 'AUTH' ||
                            error.category === 'FORBIDDEN'
                        ) {
                            return false
                        }
                        // Don't retry not found
                        if (error.category === 'NOT_FOUND') return false
                        // Don't retry validation errors
                        if (error.category === 'VALIDATION') return false
                    }
                    if ((error as any).status === 404) return false
                    return failureCount < 3
                },
            },
            mutations: {
                networkMode: 'offlineFirst',
                retry: 3,
                retryDelay: (attemptIndex) =>
                    Math.min(1000 * Math.pow(2, attemptIndex), 30000),
            },
        },
    })
}
