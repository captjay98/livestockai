import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '**/*.integration.test.ts'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 5000,
    env: loadEnv(mode, process.cwd(), ''),
    fileParallelism: true,
    maxConcurrency: 4,
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html'],
      include: ['app/**/*.ts', 'app/**/*.tsx'],
      exclude: [
        'app/routeTree.gen.ts',
        'app/**/*.test.ts',
        'app/lib/db/types.ts',
      ],
    },
  },
}))

// Separate config for integration tests: bun test:integration
export const integrationConfig = defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // Longer timeout for DB operations
    hookTimeout: 10000,
    env: loadEnv(mode, process.cwd(), ''),
    fileParallelism: false, // Sequential to avoid DB conflicts
    pool: 'forks', // Separate processes for isolation
  },
}))
