import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { auth } from './lib/auth/config'

const handler = createStartHandler(defaultStreamHandler)

export default {
  async fetch(request: Request, ...args: Array<any>) {
    const url = new URL(request.url)

    // Handle auth routes
    if (url.pathname.startsWith('/api/auth')) {
      return auth.handler(request)
    }

    // Handle all other routes with TanStack Start
    return handler(request, ...args)
  },
}
