import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest config for integration tests
 * Run with: bun test:integration
 * 
 * Requires DATABASE_URL_TEST environment variable
 */
export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.integration.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // Longer timeout for DB operations
    hookTimeout: 30000, // Increased for DB operations
    env: loadEnv(mode, process.cwd(), ''),
    fileParallelism: false, // Sequential to avoid DB conflicts
    pool: 'forks', // Separate processes for isolation
  },
}))
