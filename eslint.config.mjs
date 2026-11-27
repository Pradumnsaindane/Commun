import next from 'eslint-config-next'

const typescriptConfig = next.find((entry) => entry.plugins?.['@typescript-eslint'])

if (!typescriptConfig) {
  throw new Error('eslint-config-next did not provide the @typescript-eslint plugin')
}

const config = [
  ...next,
  {
    name: 'commun/frontend-type-safety',
    files: [
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'features/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
    ],
    plugins: {
      '@typescript-eslint': typescriptConfig.plugins['@typescript-eslint'],
    },
    rules: {
      // The frontend boundary must not gain new `any` escape hatches.
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
]

export default config
