import { createRouter } from '@tanstack/react-router'
import { dehydrate, hydrate } from '@tanstack/react-query'
import { createQueryClient } from './lib/query-client'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
    const queryClient = createQueryClient()

    const router = createRouter({
        routeTree,
        scrollRestoration: true,
        defaultPreloadStaleTime: 30_000,
        context: {
            queryClient,
        },
        // Dehydrate/Hydrate QueryClient
        dehydrate: () => {
            return {
                queryClientState: dehydrate(queryClient) as any,
            }
        },
        hydrate: (data) => {
            hydrate(queryClient, data.queryClientState)
        },
    })

    return router
}
