import { tanstackConfig } from '@tanstack/eslint-config'
import i18next from 'eslint-plugin-i18next'

export default [
  ...tanstackConfig.map((c) => {
    // If the config has a plugins array, we need to convert it to an object for flat config
    if (c.plugins && Array.isArray(c.plugins)) {
      return {
        ...c,
        plugins: Object.fromEntries(c.plugins.map((p) => [p, {}])),
      }
    }
    return c
  }),
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'public/docs/**',
      'public/typedocs/**',
      'public/sw.js',
      'examples/**',
      'vitest.*.ts',
      'app/lib/db/seeds/development.ts',
    ],
  },
  {
    plugins: {
      i18next,
    },
    rules: {
      'i18next/no-literal-string': 'off', // Disabled - i18n is implemented
    },
  },
]
