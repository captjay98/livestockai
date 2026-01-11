//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: ['eslint.config.js', 'prettier.config.js'],
  },
  {
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-shadow': 'off',
    },
  },
]
