import react from '@vitejs/plugin-react'
import type { ViteUserConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export const vitestConfig = (): ViteUserConfig => {
  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['../../vitest/setup.ts'],
    },
  }
}
