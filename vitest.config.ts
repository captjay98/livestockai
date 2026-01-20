import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    env: loadEnv(mode, process.cwd(), ''),
    fileParallelism: false, // Prevent DB race conditions in integration tests
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
