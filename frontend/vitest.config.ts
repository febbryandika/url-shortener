import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Dedicated Vitest config: the React plugin and the same `@/` alias the app uses,
// in a jsdom environment. It deliberately omits the TanStack Router plugin —
// component tests don't need generated route types — so the run stays isolated.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
