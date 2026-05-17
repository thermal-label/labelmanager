import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@thermal-label/labelmanager-core': fileURLToPath(
        new URL('../core/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      exclude: [
        'dist/**',
        '**/*.d.ts',
        'src/types.ts',
        'src/index.ts',
        '**/*.config.*',
        '**/__tests__/**',
        '**/*.test.ts',
      ],
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 90 },
    },
  },
});
