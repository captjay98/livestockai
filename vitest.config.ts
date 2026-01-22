import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'tests/integration/**'],
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 5000,
    fileParallelism: true,
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
})
