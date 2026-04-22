import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@thermal-label/labelmanager-node': fileURLToPath(
        new URL('../node/src/index.ts', import.meta.url),
      ),
    },
  },
  test: {
    environment: 'node',
  },
});
