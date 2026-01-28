import {
    createStartHandler,
    defaultStreamHandler,
} from '@tanstack/react-start/server'
import { getAuth } from '~/features/auth/config'

const handler = createStartHandler(defaultStreamHandler)

export default {
    async fetch(request: Request, ...args: Array<any>) {
        const url = new URL(request.url)

        // Handle Better Auth API routes
        if (url.pathname.startsWith('/api/auth')) {
            const auth = await getAuth()
            return auth.handler(request)
        }

        // Handle all other routes with TanStack Start
        return handler(request, ...args)
    },
}
