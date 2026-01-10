import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/react-start/server'
import { auth } from './lib/auth/config'

const handler = createStartHandler(defaultStreamHandler)

export default {
  async fetch(request: Request, ...args: Array<any>) {
    const url = new URL(request.url)
    console.log('Incoming Request:', request.url, 'Path:', url.pathname)

    // Handle all other routes with TanStack Start
    return handler(request, ...args)
  },
}
