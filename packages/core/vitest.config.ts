import { defineConfig } from 'vitest/config';

export default defineConfig({
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
