import { defineConfig, configDefaults } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Playwright specs live in e2e/ and run with `npm run test:e2e`
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(root, './'),
    },
  },
});
