import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./packages/shared', import.meta.url)).replace(/\/$/, ''),
      '@': fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, ''),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})