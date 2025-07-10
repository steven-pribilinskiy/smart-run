import { defineConfig } from '@rstest/core';

export default defineConfig({
  include: ['**/*.test.ts'],
  setupFiles: ['./test/setup.ts'],
});
