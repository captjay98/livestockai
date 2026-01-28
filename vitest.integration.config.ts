import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest config for integration tests
 * Run with: bun test:integration
 *
 * Requires DATABASE_URL_TEST environment variable
 */
export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        environment: 'node',
        include: ['**/*.integration.test.ts'],
        exclude: ['node_modules', 'dist'],
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        testTimeout: 30000,
        hookTimeout: 30000,
        fileParallelism: false,
        pool: 'forks',
    },
})
