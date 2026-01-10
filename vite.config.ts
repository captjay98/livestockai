import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3000,
  },
  optimizeDeps: {
    exclude: [
      '@tanstack/start-server-core',
      '@tanstack/react-start-server',
      '@tanstack/react-start/server',
      'pg',
      'kysely',
      'better-auth',
      'bcrypt',
    ],
  },
  ssr: {
    external: [
      'node:stream',
      'node:stream/web',
      'node:async_hooks',
      'pg',
      'kysely',
      'better-auth',
      'bcrypt',
    ],
    noExternal: [
      // Allow bundling of client-safe packages
      'better-auth/react',
      'better-auth/tanstack-start',
    ],
  },
  build: {
    rollupOptions: {
      external: [
        'node:stream',
        'node:stream/web',
        'node:async_hooks',
        'pg',
        'kysely',
        'better-auth',
        'bcrypt',
      ],
    },
  },
  plugins: [
    tailwindcss(),
    tsconfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      srcDirectory: 'app',
      server: {
        entry: './server.ts',
      },
      router: {
        routesDirectory: 'routes',
      },
    }),
    viteReact(),
  ],
})
