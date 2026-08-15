import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const checkout = (relative: string): string => fileURLToPath(new URL(`../../deepseek-harness/${relative}`, import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // The published /client bundles are browser module-loader format and
      // crash under Node. This test suite never exercises the store engine
      // itself (the official runtime suite owns that), so the single value
      // import (defineStore) resolves to a test stub instead of dragging the
      // whole runtime client tree (zustand/immer/api-remotes) into devDeps.
      '@deepseek-ai/dsh-client-runtime/client': fileURLToPath(new URL('./tests/stubs/runtime-client.ts', import.meta.url)),
      // Kept for parity with the local convention; unused unless a future
      // test imports the connection client entry.
      '@deepseek-ai/dsh-client-connection/client': checkout('packages/client/connection/src/client/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.{ts,tsx}'],
  },
})
