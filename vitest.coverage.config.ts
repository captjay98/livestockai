import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest config for combined coverage report
 * Runs ALL tests (unit + property + integration) with coverage
 * Run with: bun test:coverage
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: [
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.property.test.ts',
      '**/*.integration.test.ts',
    ],
    exclude: ['node_modules', 'dist'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    pool: 'forks',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['app/**/*.ts', 'app/**/*.tsx'],
      exclude: [
        'app/routeTree.gen.ts',
        'app/**/*.test.ts',
        'app/**/*.property.test.ts',
        'app/lib/db/types.ts',
        'app/lib/db/migrations/**',
        'app/lib/db/seeds/**',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
    },
  },
})
