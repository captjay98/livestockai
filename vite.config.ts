import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { config } from 'dotenv'

// Load .env file
config()

export default defineConfig({
  server: {
    port: 3000,
  },
  define: {
    'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
    'process.env.BETTER_AUTH_SECRET': JSON.stringify(
      process.env.BETTER_AUTH_SECRET,
    ),
    'process.env.BETTER_AUTH_URL': JSON.stringify(process.env.BETTER_AUTH_URL),
  },
  build: {
    rollupOptions: {
      external: ['node:stream', 'node:stream/web', 'node:async_hooks'],
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      srcDirectory: 'app',
      server: { entry: './server.ts' },
      router: { routesDirectory: 'routes' },
    }),
    viteReact(),
  ],
})
