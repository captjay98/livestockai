import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest config for combined coverage report
 * Runs ALL tests (unit + property + integration) with coverage
 * Run with: bun test:coverage
 */
export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    // Include ALL test files
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.property.test.ts',
      '**/*.integration.test.ts',
    ],
    exclude: ['node_modules', 'dist'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000, // Longer for integration tests
    hookTimeout: 30000,
    env: loadEnv(mode, process.cwd(), ''),
    fileParallelism: false, // Sequential for DB tests
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: [
        'app/features/**/*.ts',
        'app/hooks/**/*.ts',
        'app/lib/**/*.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'app/lib/db/types.ts',
        'app/lib/db/migrations/**',
        'app/lib/db/seeds/**',
      ],
    },
  },
}))
